/**
 * @syncframe/core — shared types.
 *
 * Core is the minimum protocol for deterministic state extrapolation. Consumers
 * own all domain semantics.
 *
 * Core abstractions:
 *   - Anchor<T, M>   deterministic state at a server time + motion descriptor
 *   - CoreSnapshot   latest known room state, diffused on every change
 *   - SmootherOptions  tunable knobs for the chase-smoother
 *
 * Motion shapes are a tagged union dispatched by `motion.kind`. Consumers
 * may define their own motion shapes (any object with `kind: string`) plus
 * their own evaluators — the core store accepts them as opaque JSON.
 */

// ─── Anchor / motion ────────────────────────────────────────────────────────

/**
 * Generic anchor: "at server time `at`, value was `value`, and from then it
 * evolves per motion `M`." Any client with a synced server clock can
 * evaluate the current value at any later moment via a pure function.
 */
export interface Anchor<T, M> {
  at: number;
  value: T;
  motion: M;
}

/**
 * Scalar drift — a single number advancing at a constant rate.
 *
 * This is core's only motion shape. It's sufficient for any time-progression
 * use case: video playback (rate = 1.0), paused state (rate = 0), countdown
 * (rate = -1.0), 2x speed (rate = 2.0), etc.
 *
 * Consumers who need more complex motion (2D paths, bouncing, exponential
 * ramps) define their own motion shapes. They own the math; core's opaque
 * anchor store accepts them without inspection.
 */
export interface ScalarMotion {
  kind: 'scalar';
  ratePerMs: number;
}

export type MotionShape = ScalarMotion;

/**
 * Minimal motion descriptor the store layer cares about — a tagged object.
 * Anchors are persisted as opaque JSON, so the store is generic over any
 * motion with a `kind` discriminator, including consumer-defined shapes.
 */
export interface MotionDescriptor {
  kind: string;
}

export type AnyAnchor = Anchor<unknown, MotionDescriptor>;

// ─── Snapshot ───────────────────────────────────────────────────────────────

/**
 * Layer 1 snapshot. No screen / pose / calibration data — that belongs in
 * `@syncframe/spatial`. `meta` and `contentData` are opaque to core; the
 * store just round-trips whatever JSON the consumer writes.
 */
export interface CoreSnapshot {
  anchors: Record<string, AnyAnchor | null>;
  meta: Record<string, unknown>;
  contentData: Record<string, unknown> | null;
}

// ─── Smoother ───────────────────────────────────────────────────────────────

/**
 * Tunable knobs for the exponential chase smoother.
 *
 * - `timeConstantMs`: how quickly the displayed value converges on the
 *   evaluated ideal (smaller = tighter tracking, more jitter).
 * - `snapThreshold`: if the error exceeds this, skip the smooth and jump —
 *   covers first render, large seeks, and post-disconnect recovery.
 */
export interface SmootherOptions {
  timeConstantMs?: number;
  snapThreshold?: number;
}
