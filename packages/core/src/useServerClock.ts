/**
 * @syncframe/core — NTP-style server clock.
 *
 * Estimates server time offset using RTT minimization. Client probes server
 * repeatedly, keeps the min-RTT sample, and uses its offset for the clock.
 *
 * The offset is an *epoch* correction: `serverEpoch ≈ Date.now() + offsetMs`.
 * The probe midpoint must therefore be measured with `Date.now()` (epoch), not
 * `performance.now()` (ms since page load) — mixing the two yields an offset on
 * the order of `Date.now()` itself. `performance.now()` is used only for the
 * round-trip time, where its monotonicity actually helps.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ServerClock {
  serverNowMs: number;
  offsetMs: number;
  rttMs: number;
  sampleCount: number;
  /**
   * Live server time, evaluated on call: `Date.now() + offsetMs`. Stable
   * identity across renders (safe to use in effect deps), but always returns
   * the latest estimate. Prefer this over reading the snapshot `serverNowMs`,
   * which is only refreshed on each probe.
   */
  serverNow: () => number;
}

type ClockState = Omit<ServerClock, 'serverNow'>;

interface ClockProbe {
  offset: number;
  rtt: number;
  timestamp: number;
}

/**
 * Estimate the epoch offset to add to local time to get server time, given the
 * server's reported time and the local epoch timestamps bracketing the probe.
 *
 * `offset = serverNow - midpoint(sentAt, receivedAt)`. All three are epoch ms,
 * so the result is the small true clock skew between client and server.
 */
export function estimateOffset(serverNowMs: number, sentAtMs: number, receivedAtMs: number): number {
  return serverNowMs - (sentAtMs + receivedAtMs) / 2;
}

export function useServerClock(endpoint: string, probeIntervalMs = 5000, probeCount = 5): ServerClock {
  const [clock, setClock] = useState<ClockState>({
    serverNowMs: Date.now(),
    offsetMs: 0,
    rttMs: 0,
    sampleCount: 0,
  });

  // Mirror the latest offset in a ref so `serverNow()` can stay a stable
  // callback while still returning fresh values between renders.
  const offsetRef = useRef(0);
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

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
      const offset = estimateOffset(data.serverNowMs, sentAt, receivedAt);

      return { offset, rtt, timestamp: receivedAt };
    };

    const runProbes = async () => {
      const probes: ClockProbe[] = [];
      for (let i = 0; i < probeCount; i++) {
        const result = await probe();
        if (result && mounted) {
          probes.push(result);
        }
      }

      if (probes.length > 0 && mounted) {
        // Min-RTT sample is most accurate
        const best = probes.reduce((a, b) => (a.rtt < b.rtt ? a : b));
        offsetRef.current = best.offset;
        setClock((prev) => ({
          serverNowMs: Date.now() + best.offset,
          offsetMs: best.offset,
          rttMs: best.rtt,
          sampleCount: prev.sampleCount + 1,
        }));
      }
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
