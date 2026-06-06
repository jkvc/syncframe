/**
 * @syncframe/core/react — React hooks entry point.
 *
 * Client-only surface: NTP-style server clock, anchor subscriptions, and the
 * smoothed-value hook. The protocol types are re-exported here too so client
 * components can pull hooks and the types they parameterize from one import.
 */

// React hooks
export { useServerClock } from './useServerClock';
export type { ServerClock } from './useServerClock';
export { useAnchor } from './useAnchor';
export { useScalarAnchor } from './useScalarAnchor';
export { useSmoothedValue } from './useSmoothedValue';

// Clock model (pure, React-free) — exposed for advanced consumers (e.g. mapping
// server time onto a third clock domain like the Web Audio clock).
export {
  estimateOffset,
  fitClockModel,
  effectiveOffset,
  projectServerNow,
  IDENTITY_CLOCK_MODEL,
} from './clock-model';
export type { ClockModel, ClockSample } from './clock-model';

// Convenience type re-exports for client consumers.
export type {
  Anchor,
  AnyAnchor,
  MotionDescriptor,
  MotionShape,
  ScalarMotion,
  CoreSnapshot,
  SmootherOptions,
} from './types';
