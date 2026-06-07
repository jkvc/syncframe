# @syncframe/core

The minimum protocol for deterministic state extrapolation across browsers. Instead of streaming state, broadcast **anchors** — "at server time T, value was V, evolving at rate R" — and let any client with a synced clock evaluate the current value with pure math. Consumers own all domain semantics.

Docs and demos: [syncframe.jkvc.ai](https://syncframe.jkvc.ai/)

## Install

```bash
npm install @syncframe/core
```

`react` is an optional peer dependency (only needed for the hooks).

## Entry points

| Import                     | Contents                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `@syncframe/core/server`   | React-free: types, `evaluateScalar`, smoother, `SyncStore`/`SyncTransport` + defaults, `SyncServer` |
| `@syncframe/core/react`    | Hooks: `useServerClock`, `useAnchor`, `useScalarAnchor`, `useSmoothedValue`                     |
| `@syncframe/core`          | Full barrel (everything) — pulls React in                                                       |

Import server code from `/server` and client code from `/react` so hooks never leak into server bundles.

## Quick start

```ts
import { SyncServer, InMemoryStore, EventEmitterTransport } from '@syncframe/core/server';

const server = new SyncServer({
  store: new InMemoryStore(),
  transport: new EventEmitterTransport(),
});

await server.setAnchor('room1', 'video', {
  at: server.clockProbe(),
  value: 45.5,
  motion: { kind: 'scalar', ratePerMs: 0.001 }, // 1 unit/sec
});
await server.publishUpdate('room1');
```

```ts
import { evaluateScalar } from '@syncframe/core/server';

evaluateScalar({ at: 1000, value: 10, motion: { kind: 'scalar', ratePerMs: 0.001 } }, 6000); // 15
```

For pluggable backends beyond the in-memory defaults, see [`@syncframe/redis`](https://www.npmjs.com/package/@syncframe/redis).

## License

MIT
