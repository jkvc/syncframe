/**
 * @syncframe/core — clock offset + skew model.
 *
 * `useServerClock` samples the server epoch repeatedly. A single sample yields
 * an *offset* (`serverEpoch - localEpoch`). But the local wall clock ticks at a
 * slightly different rate than the server's (crystal drift, ~tens of ppm), so a
 * fixed offset goes stale between probes. Fitting a line through recent samples
 * recovers both the offset *and* the skew (drift rate), keeping `serverNow()`
 * accurate between probes over long sessions.
 *
 * Everything here is pure and isomorphic: no React, no DOM, no `Date.now()`.
 * All inputs are epoch milliseconds.
 */

export interface ClockSample {
  /** Local epoch midpoint of the probe: `(sentAt + receivedAt) / 2`. */
  localMidMs: number;
  /** Measured offset for this probe: `serverEpoch - localMidMs`. */
  offsetMs: number;
  /** Relative trust weight (higher = more trusted). Defaults to `1`. */
  weight?: number;
}

export interface ClockModel {
  /** Local-time reference the fit is centered on (epoch ms). */
  refLocalMs: number;
  /** Offset at `refLocalMs`: `serverEpoch ≈ refLocalMs + offsetMs` there. */
  offsetMs: number;
  /** Drift slope: change in offset per ms of local time (≈ negative local skew). */
  skew: number;
}

/** A clock that needs no correction (local time == server time). */
export const IDENTITY_CLOCK_MODEL: ClockModel = { refLocalMs: 0, offsetMs: 0, skew: 0 };

/** Max plausible drift slope (1000 ppm). Beyond this we assume regression noise. */
const MAX_SKEW = 1e-3;
/** Minimum local-time span across samples before skew is trusted (ms). */
const MIN_SKEW_SPAN_MS = 10_000;
/** Minimum sample count before skew is trusted. */
const MIN_SKEW_SAMPLES = 3;

/**
 * Single-probe offset estimate: the server's reported time minus the local
 * midpoint of the round trip. Assumes symmetric latency; error is half the
 * path asymmetry.
 */
export function estimateOffset(serverNowMs: number, sentAtMs: number, receivedAtMs: number): number {
  return serverNowMs - (sentAtMs + receivedAtMs) / 2;
}

/** Largest half-sensible RTT (ms) before we distrust a Resource-Timing sample. */
const MAX_PROBE_RTT_MS = 5_000;

/**
 * Raw timing inputs for one clock probe. The `Date.now()` bracket is always
 * available; `net` carries the (more accurate) network span from the Resource
 * Timing API when the browser exposes it (same-origin, or cross-origin with
 * `Timing-Allow-Origin`). All values are epoch milliseconds.
 */
export interface RawProbeTiming {
  /** `Date.now()` immediately before the fetch. */
  sentAtMs: number;
  /** `Date.now()` immediately after the fetch resolves. */
  receivedAtMs: number;
  /** Resource Timing network span, converted to epoch (`timeOrigin + mark`). */
  net?: { requestStartMs: number; responseEndMs: number } | null;
}

/** Derived per-probe timing: the local epoch midpoint and the round-trip time. */
export interface ProbeSample {
  /** Local epoch midpoint of the round trip. */
  localMidMs: number;
  /** Round-trip time (ms). */
  rttMs: number;
}

/**
 * Reduce raw probe timing to a `{ localMidMs, rttMs }` sample.
 *
 * Prefers the Resource Timing network span (`responseEnd - requestStart`),
 * which excludes main-thread/JS scheduling jitter that contaminates the
 * `Date.now()` bracket. Falls back to the bracket when Resource Timing is
 * unavailable or reports an implausible span (≤ 0 or ≥ 5s).
 */
export function deriveProbeSample(t: RawProbeTiming): ProbeSample {
  if (t.net) {
    const rttMs = t.net.responseEndMs - t.net.requestStartMs;
    if (rttMs > 0 && rttMs < MAX_PROBE_RTT_MS) {
      return { localMidMs: (t.net.requestStartMs + t.net.responseEndMs) / 2, rttMs };
    }
  }
  return {
    localMidMs: (t.sentAtMs + t.receivedAtMs) / 2,
    rttMs: t.receivedAtMs - t.sentAtMs,
  };
}

/**
 * Weighted least-squares fit of offset vs local time. Returns the offset at the
 * weighted-mean local time plus the skew (slope).
 *
 * Degrades gracefully to offset-only (`skew = 0`, weighted-mean offset) when
 * there aren't enough samples or enough time span to estimate drift reliably —
 * so early in a session it behaves exactly like the previous offset-only model.
 */
export function fitClockModel(samples: ClockSample[]): ClockModel {
  if (samples.length === 0) return IDENTITY_CLOCK_MODEL;

  let sumW = 0;
  let sumWX = 0;
  let sumWO = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const s of samples) {
    const w = s.weight ?? 1;
    sumW += w;
    sumWX += w * s.localMidMs;
    sumWO += w * s.offsetMs;
    if (s.localMidMs < minX) minX = s.localMidMs;
    if (s.localMidMs > maxX) maxX = s.localMidMs;
  }
  const meanX = sumWX / sumW;
  const meanO = sumWO / sumW;

  // Not enough leverage to trust a slope — fall back to offset-only.
  if (samples.length < MIN_SKEW_SAMPLES || maxX - minX < MIN_SKEW_SPAN_MS) {
    return { refLocalMs: meanX, offsetMs: meanO, skew: 0 };
  }

  let sxx = 0;
  let sxo = 0;
  for (const s of samples) {
    const w = s.weight ?? 1;
    const dx = s.localMidMs - meanX;
    sxx += w * dx * dx;
    sxo += w * dx * (s.offsetMs - meanO);
  }
  if (sxx === 0) return { refLocalMs: meanX, offsetMs: meanO, skew: 0 };

  const rawSkew = sxo / sxx;
  const skew = Math.max(-MAX_SKEW, Math.min(MAX_SKEW, rawSkew));
  return { refLocalMs: meanX, offsetMs: meanO, skew };
}

/** Effective offset (`serverNow - localNow`) the model implies at a local time. */
export function effectiveOffset(model: ClockModel, localNowMs: number): number {
  return model.offsetMs + model.skew * (localNowMs - model.refLocalMs);
}

/** Project server epoch time for a given local epoch time using the model. */
export function projectServerNow(model: ClockModel, localNowMs: number): number {
  return localNowMs + effectiveOffset(model, localNowMs);
}
