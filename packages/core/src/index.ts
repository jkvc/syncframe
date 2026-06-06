/**
 * @syncframe/core — full barrel (back-compat).
 *
 * The minimum protocol for deterministic state extrapolation. Consumers own all
 * domain semantics. This entry re-exports everything; prefer the focused
 * subpaths in new code:
 *   - `@syncframe/core/server` — types, evaluator, smoother, store/transport, SyncServer
 *   - `@syncframe/core/react`  — React hooks (+ type re-exports)
 *
 * Importing from `.` pulls the React hooks in, so server-only contexts should
 * use `@syncframe/core/server` to stay free of DOM/React.
 */

// Server-safe surface: types, evaluator, smoother, store/transport, SyncServer.
export * from './server-entry';

// React hooks. (Types are already exported above via server-entry, so only the
// hooks and the hook-specific ServerClock type are added here to avoid
// duplicate-export ambiguity.)
export { useServerClock } from './useServerClock';
export type { ServerClock } from './useServerClock';
export { useAnchor } from './useAnchor';
export { useScalarAnchor } from './useScalarAnchor';
export { useSmoothedValue } from './useSmoothedValue';

// Clock model (pure, React-free).
export {
  estimateOffset,
  fitClockModel,
  effectiveOffset,
  projectServerNow,
  IDENTITY_CLOCK_MODEL,
} from './clock-model';
export type { ClockModel, ClockSample } from './clock-model';
