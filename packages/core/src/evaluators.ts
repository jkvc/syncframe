/**
 * @syncframe/core — anchor evaluators (pure functions).
 *
 * Each evaluator maps `(anchor, serverNowMs) → T` deterministically. Same
 * inputs ⇒ bit-identical outputs across all clients. No Date.now(), no
 * Math.random(), no DOM probes — every input is in the anchor itself.
 *
 * Core ships only one evaluator: `evaluateScalar`. Consumers define their
 * own evaluators for custom motion shapes.
 */

import type { Anchor, ScalarMotion } from './types';

// ─── scalar ─────────────────────────────────────────────────────────────────

/**
 * Evaluate a scalar anchor at a given server time.
 *
 * The anchor describes: "at server time `anchor.at`, the value was
 * `anchor.value`, and from then it drifts at `anchor.motion.ratePerMs`
 * units per millisecond."
 *
 * Returns: `value + ratePerMs * (nowMs - at)`
 *
 * Examples:
 * - Video playback: rate = 1.0 (1 second per second)
 * - Paused: rate = 0
 * - 2x speed: rate = 2.0
 * - Countdown: rate = -1.0
 */
export function evaluateScalar(
  anchor: Anchor<number, ScalarMotion>,
  serverNowMs: number,
): number {
  const dt = serverNowMs - anchor.at;
  return anchor.value + anchor.motion.ratePerMs * dt;
}
