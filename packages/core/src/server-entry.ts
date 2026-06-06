/**
 * @syncframe/core/server — server-safe entry point.
 *
 * Everything reachable from here is pure / Node-safe: the protocol types, the
 * scalar evaluator, the smoother, the storage + transport interfaces with their
 * in-memory/event-emitter defaults, and the `SyncServer` orchestrator. Nothing
 * here imports React or touches DOM globals, so it's safe to pull into API
 * routes, adapter packages, and other non-DOM build targets.
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
