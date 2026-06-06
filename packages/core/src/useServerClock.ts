/**
 * @syncframe/core — NTP-style server clock.
 *
 * Estimates server time offset using RTT minimization. Client probes server
 * repeatedly, keeps the min-RTT sample, and uses its offset for the clock.
 *
 * Uses performance.now() for monotonic client time (immune to system clock changes).
 */

import { useEffect, useState } from 'react';

export interface ServerClock {
  serverNowMs: number;
  offsetMs: number;
  rttMs: number;
  sampleCount: number;
}

interface ClockProbe {
  offset: number;
  rtt: number;
  timestamp: number;
}

export function useServerClock(endpoint: string, probeIntervalMs = 5000, probeCount = 5): ServerClock {
  const [clock, setClock] = useState<ServerClock>({
    serverNowMs: Date.now(),
    offsetMs: 0,
    rttMs: 0,
    sampleCount: 0,
  });

  useEffect(() => {
    let mounted = true;

    const probe = async (): Promise<ClockProbe | null> => {
      const t1 = performance.now();
      const res = await fetch(endpoint);
      const t2 = performance.now();
      if (!res.ok) return null;

      const data = (await res.json()) as { serverNowMs: number };
      const serverNow = data.serverNowMs;

      const rtt = t2 - t1;
      const midClient = (t1 + t2) / 2;
      const offset = serverNow - midClient;

      return { offset, rtt, timestamp: Date.now() };
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
        setClock({
          serverNowMs: Date.now() + best.offset,
          offsetMs: best.offset,
          rttMs: best.rtt,
          sampleCount: clock.sampleCount + 1,
        });
      }
    };

    runProbes();
    const interval = setInterval(runProbes, probeIntervalMs);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [endpoint, probeIntervalMs, probeCount, clock.sampleCount]);

  return clock;
}
