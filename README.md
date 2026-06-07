# Syncframe

**Core is the minimum protocol for deterministic state extrapolation. Consumers own all domain semantics.**

Syncframe enables synchronized state across browsers using dead-reckoning. Instead of streaming state continuously, clients broadcast anchors: "at server time T, value was V, and from then it evolves at rate R." Any client with a synced server clock can evaluate the current value at any later moment using pure math.

## The Minimal Protocol

Core provides exactly one primitive: `Anchor<T, M>` — deterministic state at a server time + motion descriptor. The only built-in motion shape is `ScalarMotion` (a number advancing at a constant rate).

```typescript
interface ScalarMotion {
  kind: 'scalar';
  ratePerMs: number; // units per millisecond
}

interface Anchor<T, M> {
  at: number;        // server timestamp
  value: T;          // value at time `at`
  motion: M;         // how value evolves from `at`
}
```

**Consumers define their own motion shapes** for 2D paths, color interpolation, bouncing, exponential ramps, or any domain-specific behavior. Core's store accepts them as opaque JSON without inspection.

## Use Cases

- **Video playback sync**: Anchor at time T, value = playback position, rate = 1.0 (or 0 for paused, 2.0 for 2x speed)
- **Multi-screen installations**: Positional data synced across displays
- **Countdown timers**: Rate = -1.0 for reverse counting
- **Progress bars**: Rate = percentage per millisecond

With a browser and internet connection, clients extrapolate state deterministically from shared anchors. Clock sync typically lands within ~30ms of server time — enough for video, timers, and UI; not sample-accurate.

## Two-Layer Architecture

**Layer 1 (core)**: Time-event sync protocol — clock synchronization, anchors, evaluators, storage, transport. Core knows nothing about XY coordinates, viewports, or screens.

**Layer 2 (spatial)**: Built on core — world size, viewport management, screen poses, bounding boxes, multi-screen orchestration. Spatial owns all positional semantics.

## Packages & Entry Points

| Package             | Entry point                | What it is                                                                                      |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `@syncframe/core`   | `@syncframe/core/server`   | React-free protocol + server surface: types, `evaluateScalar`, smoother, `SyncStore`/`SyncTransport` + defaults, `SyncServer` |
| `@syncframe/core`   | `@syncframe/core/react`    | Client hooks: `useServerClock`, `useAnchor`, `useScalarAnchor`, `useSmoothedValue`             |
| `@syncframe/core`   | `@syncframe/core`          | Full barrel (everything) — convenience; pulls React in                                         |
| `@syncframe/redis`  | `@syncframe/redis`         | Redis-backed `SyncStore` + `SyncTransport` adapters (connection-injected)                      |
| `@syncframe/spatial`| `@syncframe/spatial`       | Layer 2 — screens, poses, world bbox (in progress)                                             |

Import server code from `@syncframe/core/server` and client code from `@syncframe/core/react` so React hooks (and their DOM types) never leak into server bundles.

## Installation

```bash
npm install @syncframe/core            # protocol, server, hooks
npm install @syncframe/redis ioredis   # optional: Redis backend
```

## Quick Start

Core exposes two focused entry points (plus the full `@syncframe/core` barrel for convenience): `@syncframe/core/server` for the React-free protocol/server surface, and `@syncframe/core/react` for the client hooks.

```typescript
import { SyncServer, InMemoryStore, EventEmitterTransport } from '@syncframe/core/server';

const server = new SyncServer({
  store: new InMemoryStore(),
  transport: new EventEmitterTransport(),
});

// Broadcast a scalar anchor (e.g., video playback position)
await server.setAnchor('room1', 'video', {
  at: server.clockProbe(),
  value: 45.5, // 45.5 seconds
  motion: { kind: 'scalar', ratePerMs: 0.001 }, // 1 second per second
});

// Publish update to subscribers
await server.publishUpdate('room1');
```

On the client:

```typescript
import { evaluateScalar } from '@syncframe/core/server';

// Given an anchor and synced server time, evaluate current value
const currentValue = evaluateScalar(anchor, serverNowMs);
```

## Core Abstractions

- **`evaluateScalar(anchor, serverNowMs)`** — Pure function: `value + ratePerMs * (serverNowMs - at)`
- **`smoothStep(ideal, current, dtMs)`** — Exponential chase smoother to hide jitter
- **`SyncStore`** — Pluggable storage (InMemoryStore, Redis, Postgres, etc.)
- **`SyncTransport`** — Pluggable pub/sub (EventEmitter, WebSocket, Redis, etc.)
- **`SyncServer`** — Orchestrates store + transport
- **React hooks** — `useServerClock`, `useAnchor`, `useScalarAnchor`, `useSmoothedValue`

## Pluggable Backends

Core ships zero-dependency defaults:

- **`InMemoryStore`** — Perfect for local dev, single-process demos
- **`EventEmitterTransport`** — Node.js EventEmitter for single-process pub/sub

For multi-process / serverless deployments, **`@syncframe/redis`** provides `RedisStore` + `RedisTransport`. They're connection-injected — you pass in your own `ioredis` clients, so auth and pooling stay in your app:

```typescript
import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';

const server = new SyncServer({
  store: new RedisStore({ redis }),
  transport: new RedisTransport({ redis, createSubscriber }),
});
```

Or implement the interfaces yourself for any other backend:

```typescript
class PostgresStore implements SyncStore { /* ... */ }
class WebSocketTransport implements SyncTransport { /* ... */ }
```

## Deterministic Evaluation

Same inputs always produce bit-identical outputs. No `Date.now()`, no `Math.random()`, no DOM probes — every input is in the anchor itself.

```typescript
const anchor = { at: 1000, value: 10, motion: { kind: 'scalar', ratePerMs: 0.001 } };

evaluateScalar(anchor, 2000); // 11
evaluateScalar(anchor, 6000); // 15
evaluateScalar(anchor, 1000); // 10
```

## Clock Synchronization

Clients probe the server repeatedly using NTP-style RTT minimization:

```typescript
import { useServerClock } from '@syncframe/core/react';

const { serverNowMs, offsetMs, rttMs } = useServerClock('/api/clock');
```

The hook estimates server time offset by keeping the min-RTT sample across multiple probes.

## Consumer-Defined Motion Shapes

Core's store is opaque — it accepts any motion shape with a `kind` discriminator:

```typescript
// 2D position (spatial's concern)
await server.setAnchor('room1', 'player', {
  at: 1000,
  value: { x: 100, y: 200 },
  motion: { kind: 'linear2d', vx: 0.05, vy: 0.03 },
});

// Color interpolation
await server.setAnchor('room1', 'light', {
  at: 2000,
  value: [255, 100, 50],
  motion: { kind: 'color-lerp', target: [0, 0, 0], durationMs: 1000 },
});

// Your own evaluator
function evaluateLinear2d(anchor, serverNowMs) {
  const dt = serverNowMs - anchor.at;
  return {
    x: anchor.value.x + anchor.motion.vx * dt,
    y: anchor.value.y + anchor.motion.vy * dt,
  };
}
```

## Architecture Principles

1. **Minimal core** — Only scalar time-progression is built-in
2. **Opaque storage** — Core accepts any `motion.kind` without inspection
3. **Consumer ownership** — Play/pause/speed UI, 2D paths, color interpolation are consumer responsibilities
4. **Deterministic evaluation** — Pure functions, no side effects, bit-identical across clients
5. **Pluggable backends** — Storage and transport are interfaces, not implementations
6. **Graceful degradation** — If network drops, clients extrapolate from cached anchors

## License

MIT

## Demo site

The monorepo includes a Next.js docs + demo app at `apps/site` (Vercel deploy root). Run it from the repo root:

```bash
pnpm dev          # localhost:3000
pnpm --filter site build:check   # isolated build while dev server runs
```

Live pages: `/` (landing), `/docs/core`, `/demo/core` (global synced timer). Spatial routes are placeholders. Site UI conventions: [`STYLE.md`](STYLE.md).
