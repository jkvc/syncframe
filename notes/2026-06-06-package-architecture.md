# Package Architecture — Core Entry Points + Redis Adapter

**Date:** 2026-06-06

This note records the package design as it actually stands after wiring up the first real demo (the global countdown timer). It supersedes the backend/adapter sketches in the [kickoff note](./2026-06-06-kickoff.md), which were aspirational.

## The shape today

```
syncframe/
├── apps/
│   └── site/              # Next.js demo site + docs (Vercel deploy root)
└── packages/
    ├── core/              # @syncframe/core      — protocol + server + React hooks
    ├── redis/             # @syncframe/redis     — Redis SyncStore + SyncTransport
    └── spatial/           # @syncframe/spatial   — Layer 2 (still a placeholder stub)
```

Three packages, two concerns. `core` and `spatial` answer *what state am I syncing*; `redis` (and the in-memory defaults inside `core`) answer *how is it persisted and fanned out*. The two concerns are orthogonal: any domain composes with any backend because both sides only ever touch core's interfaces.

## `@syncframe/core` has three entry points

Core mixes pure protocol code (safe anywhere) with React hooks (client-only, reference DOM globals). Importing the whole barrel into a server route or a non-DOM package dragged the hooks in for type-checking and bundling, which caused real friction. The fix is subpath exports declared in `packages/core/package.json`:

| Import specifier          | Contents                                                                                  | Use from                          |
| ------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------- |
| `@syncframe/core/server`  | Types, `evaluateScalar`, smoother, `SyncStore`/`SyncTransport` + defaults, `SyncServer`    | API routes, adapters, any Node    |
| `@syncframe/core/react`   | `useServerClock`, `useAnchor`, `useScalarAnchor`, `useSmoothedValue` (+ type re-exports)   | Client components                 |
| `@syncframe/core`         | Everything (full barrel) — back-compat convenience; pulls React in                        | Quick scripts / examples          |

`/server` is React-free, so it never pulls hooks (and their DOM-lib type dependencies) into a server bundle or a non-DOM package's type-check. The barrel still exports the same names it always did, so nothing that imported `@syncframe/core` broke.

Implementation: `src/server-entry.ts` and `src/react-entry.ts` are thin barrels; `src/index.ts` composes both. The `exports` map's targets are `.ts` source files (the packages are consumed as source via `transpilePackages`, not pre-built).

**Rule going forward:** server-only code imports from `/server`, client code from `/react`. Reach for the bare barrel only in throwaway scripts. The `exports` map now *forbids* deep `@syncframe/core/src/...` paths, so the boundary is enforced, not just convention.

## `@syncframe/redis` is a standalone adapter

The Redis-backed `SyncStore` and `SyncTransport` implementations live in their own package rather than inside `core`, which keeps core's zero-runtime-dependency promise intact.

- **Connection-injected.** The package takes `ioredis` clients (`redis` for commands/publish, a `createSubscriber` factory for dedicated subscriber connections) in its constructors. Connection, auth, and pooling concerns live in the application, not the adapter. `ioredis` is a peer dependency.
- **Type-only dependency on core.** Every `@syncframe/core/server` import is `import type` and erased at compile time, so the package has no runtime dependency on core — it only *implements* core's interfaces.
- **Domain-agnostic.** `RedisStore`/`RedisTransport` serialize `AnyAnchor`/`CoreSnapshot` JSON under namespaced keys (`prefix` is configurable, default `"syncframe"`) and pub/sub them. They never inspect what's inside an anchor, so the same adapter serves the timer demo, future spatial state, or anything else.

## How they compose

`apps/site/lib/sync.ts` wires a single global `SyncServer` to the Redis adapter:

```typescript
import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';

new SyncServer({
  store: new RedisStore({ redis }),
  transport: new RedisTransport({ redis, createSubscriber }),
});
```

When `spatial` becomes real, it will express screens/poses as more core anchors/channels and ride this exact wiring with zero adapter changes — either as more channels on the same server or a second `SyncServer` with a different key `prefix`.

## What this changed in the repo

- Added `packages/core/src/server-entry.ts`, `packages/core/src/react-entry.ts`; rewrote `src/index.ts` to compose them; added the `exports` map.
- Migrated every consumer off deep `@syncframe/core/src/...` imports onto `/server` or `/react` (redis package + tests, `lib/sync.ts`, `lib/timer.ts`, the timer client component).
- Added `@syncframe/redis` to `transpilePackages` in `apps/site/next.config.ts`.
- Updated `README.md` examples to the new entry points.

Verified with type-check, lint, the full unit suite, a production build, and a live smoke test of the timer API + SSE stream.
