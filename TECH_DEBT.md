# TECH DEBT

Tracked shortcuts and deferred work. Delete entries once resolved.

## Entries

### [2026-06-06] Core and spatial packages are placeholder stubs

- **Context:** Scaffolded the monorepo and package structure before implementation. The `index.ts` files are empty barrels with a `VERSION` export only.
- **File(s):** `packages/core/src/index.ts`, `packages/spatial/src/index.ts`
- **Fix:** Implement clock, anchor, evaluator, smoother, store + transport interfaces, and React hooks into `@syncframe/core`. Then implement the screen/pose/calibration code into `@syncframe/spatial`.

### [2026-06-06] No storage backend shipped yet

- **Context:** `@syncframe/core` will define `SyncStore` and `SyncTransport` interfaces with an `InMemoryStore` + `EventEmitterTransport` default, but neither exists yet. Redis and Postgres adapters are planned.
- **File(s):** `packages/core/src/` (planned)
- **Fix:** Implement the interfaces + in-memory defaults first, then add Redis and Postgres adapters.

### [2026-06-06] No adapter packages yet

- **Context:** Framework-specific route handlers (Next.js, Express, Hono) are planned as thin adapter packages.
- **File(s):** TBD — `packages/adapter-next/`, `packages/adapter-express/`, etc.
- **Fix:** Create adapter packages once `@syncframe/core` has a `SyncServer` class. Each adapter is ~30 LOC of request-shape translation.

### [2026-06-06] No CI / no GitHub Actions

- **Context:** Repo has no `.github/workflows` yet.
- **File(s):** TBD
- **Fix:** Add a workflow that runs `type-check → lint → test → build` on push/PR, once the core package has real code.

### [2026-06-06] Site has only a trivial counter demo

- **Context:** The root Next.js site has a placeholder page with a local counter. No real sync demos, no documentation pages, no API reference.
- **File(s):** `app/page.tsx`
- **Fix:** Add proper documentation pages, API reference, and working demos (e.g., synced counter, synced video player) once the core library is functional.
