/**
 * @syncframe/core — client API.
 *
 * The minimum protocol for deterministic state extrapolation. Consumers
 * own all domain semantics.
 *
 * Core abstractions:
 * - Anchor<T, M>: deterministic state at server time + motion descriptor
 * - evaluateScalar: pure function to extrapolate scalar motion over time
 * - Server clock: NTP-style offset estimation
 * - Storage/transport: pluggable backends (InMemory, EventEmitter by default)
 * - React hooks: useServerClock, useScalarAnchor, useSmoothedValue
 * - Smoother: exponential chase to hide jitter
 */

// Types
export type {
  Anchor,
  AnyAnchor,
  MotionDescriptor,
  MotionShape,
  ScalarMotion,
  CoreSnapshot,
  SmootherOptions,
} from './types';

// Evaluators
export { evaluateScalar } from './evaluators';

// Smoother
export { smoothStep, createSmoother } from './smoother';

// Storage
export type { SyncStore } from './store';
export { buildCoreSnapshot } from './store';
export { InMemoryStore } from './store-inmemory';

// Transport
export type { SyncTransport } from './transport';
export { EventEmitterTransport } from './transport-eventemitter';

// Server
export type { SyncServerOptions } from './server';
export { SyncServer } from './server';

// React hooks
export { useServerClock } from './useServerClock';
export type { ServerClock } from './useServerClock';
export { useScalarAnchor } from './useScalarAnchor';
export { useSmoothedValue } from './useSmoothedValue';
