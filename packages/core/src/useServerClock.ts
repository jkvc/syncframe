/**
 * @syncframe/core — NTP-style server clock.
 *
 * Estimates the server epoch from the client using RTT-minimized probes, then
 * fits an offset+skew line through recent samples so the clock stays accurate
 * *between* probes (the local wall clock drifts relative to the server's at a
 * few tens of ppm). See `clock-model.ts` for the pure math.
 *
 * The model is an *epoch* correction: `serverEpoch ≈ project(localEpoch)`. Probe
 * midpoints are therefore measured with `Date.now()` (epoch), not
 * `performance.now()` (ms since page load) — mixing the two yields an offset on
 * the order of `Date.now()` itself. `performance.now()` is used only for the
 * round-trip time, where its monotonicity actually helps.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fitClockModel,
  effectiveOffset,
  projectServerNow,
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

    const probe = async (): Promise<ClockProbe | null> => {
      const sentAt = Date.now();
      const perfStart = performance.now();
      const res = await fetch(endpoint);
      const rtt = performance.now() - perfStart;
      const receivedAt = Date.now();
      if (!res.ok) return null;

      const data = (await res.json()) as { serverNowMs: number };
      const localMidMs = (sentAt + receivedAt) / 2;
      return { offset: data.serverNowMs - localMidMs, rtt, localMidMs };
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
    };
  }, [endpoint, probeIntervalMs, probeCount]);

  return { ...clock, serverNow };
}
