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
