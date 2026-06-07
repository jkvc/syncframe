/**
 * @syncframe/core — NTP-style server clock.
 *
 * Estimates the server epoch from the client using RTT-minimized probes, then
 * fits an offset+skew line through recent samples so the clock stays accurate
 * *between* probes (the local wall clock drifts relative to the server's at a
 * few tens of ppm). See `clock-model.ts` for the pure math.
 *
 * The model is an *epoch* correction: `serverEpoch ≈ project(localEpoch)`. Each
 * probe's local midpoint and RTT come from the Resource Timing API when the
 * browser exposes it — `responseEnd - requestStart` is the pure network span,
 * free of the main-thread/JS scheduling jitter that contaminates a `Date.now()`
 * bracket around `fetch`. Those marks are relative to `performance.timeOrigin`,
 * so we add it back to land in the epoch domain. When Resource Timing is
 * unavailable (older engines) or unexposed (cross-origin without
 * `Timing-Allow-Origin`), we transparently fall back to the `Date.now()`
 * bracket. See `deriveProbeSample` in `clock-model.ts` for the pure reduction.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fitClockModel,
  effectiveOffset,
  projectServerNow,
  deriveProbeSample,
  IDENTITY_CLOCK_MODEL,
  type ClockModel,
  type ClockSample,
} from './clock-model';

// Re-exported for back-compat: estimateOffset historically lived here.
export { estimateOffset } from './clock-model';

export interface ServerClock {
  serverNowMs: number;
  offsetMs: number;
  /** Estimated local-clock drift relative to the server, in parts per million. */
  skewPpm: number;
  rttMs: number;
  sampleCount: number;
  /**
   * Live server time, evaluated on call via the current offset+skew model.
   * Stable identity across renders (safe to use in effect deps), but always
   * returns the latest estimate. Prefer this over reading the snapshot
   * `serverNowMs`, which is only refreshed on each probe.
   */
  serverNow: () => number;
}

type ClockState = Omit<ServerClock, 'serverNow'>;

interface ClockProbe {
  offset: number;
  rtt: number;
  localMidMs: number;
}

/** How many recent (per-round, min-RTT) samples to fit the line through. */
const MAX_HISTORY = 30;

export function useServerClock(endpoint: string, probeIntervalMs = 5000, probeCount = 5): ServerClock {
  const [clock, setClock] = useState<ClockState>({
    serverNowMs: Date.now(),
    offsetMs: 0,
    skewPpm: 0,
    rttMs: 0,
    sampleCount: 0,
  });

  // The fitted model and the rolling sample history live in refs so `serverNow()`
  // can stay a stable callback while returning fresh values between renders.
  const modelRef = useRef<ClockModel>(IDENTITY_CLOCK_MODEL);
  const historyRef = useRef<ClockSample[]>([]);
  const serverNow = useCallback(() => projectServerNow(modelRef.current, Date.now()), []);

  useEffect(() => {
    let mounted = true;

    // Resolve a (possibly relative) endpoint to the absolute URL the Resource
    // Timing entries are keyed by.
    const toAbsolute = (u: string) =>
      typeof location !== 'undefined' ? new URL(u, location.href).href : u;

    // Capture resource timings via an observer rather than `getEntriesByName`:
    // the observer is not subject to the (default 250-entry) resource-timing
    // buffer cap, so frequent cache-busted probes never silently stop landing.
    const timings = new Map<string, PerformanceResourceTiming>();
    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        observer = new PerformanceObserver((list) => {
          for (const e of list.getEntries() as PerformanceResourceTiming[]) {
            timings.set(e.name, e);
          }
        });
        observer.observe({ type: 'resource', buffered: true });
      } catch {
        observer = null;
      }
    }

    const probe = async (): Promise<ClockProbe | null> => {
      // Cache-bust so each probe gets its own Resource Timing entry and never a
      // cached (zero-latency) response.
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const url = toAbsolute(`${endpoint}${endpoint.includes('?') ? '&' : '?'}_=${nonce}`);

      const sentAt = Date.now();
      const res = await fetch(url, { cache: 'no-store' });
      const receivedAt = Date.now();
      if (!res.ok) return null;

      const data = (await res.json()) as { serverNowMs: number };

      // The resource entry may be delivered to the observer a tick after the
      // fetch promise resolves; give it one macrotask to arrive.
      let entry = timings.get(url);
      if (!entry) {
        await new Promise((r) => setTimeout(r, 0));
        entry = timings.get(url);
      }
      timings.delete(url);

      const net =
        entry && entry.requestStart > 0 && entry.responseEnd > 0 && performance.timeOrigin > 0
          ? {
              requestStartMs: performance.timeOrigin + entry.requestStart,
              responseEndMs: performance.timeOrigin + entry.responseEnd,
            }
          : null;

      const { localMidMs, rttMs } = deriveProbeSample({
        sentAtMs: sentAt,
        receivedAtMs: receivedAt,
        net,
      });
      return { offset: data.serverNowMs - localMidMs, rtt: rttMs, localMidMs };
    };

    const runProbes = async () => {
      const probes: ClockProbe[] = [];
      for (let i = 0; i < probeCount; i++) {
        const result = await probe();
        if (result && mounted) {
          probes.push(result);
        }
      }
      if (probes.length === 0 || !mounted) return;

      // The min-RTT probe of this round is the least jittery / most symmetric.
      const best = probes.reduce((a, b) => (a.rtt < b.rtt ? a : b));

      const history = historyRef.current;
      history.push({ localMidMs: best.localMidMs, offsetMs: best.offset, weight: 1 / Math.max(best.rtt, 1) });
      if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

      const model = fitClockModel(history);
      modelRef.current = model;

      const now = Date.now();
      setClock((prev) => ({
        serverNowMs: projectServerNow(model, now),
        offsetMs: effectiveOffset(model, now),
        skewPpm: model.skew * 1e6,
        rttMs: best.rtt,
        sampleCount: prev.sampleCount + 1,
      }));
    };

    runProbes();
    const interval = setInterval(runProbes, probeIntervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
      observer?.disconnect();
    };
  }, [endpoint, probeIntervalMs, probeCount]);

  return { ...clock, serverNow };
}
