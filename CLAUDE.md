# CLAUDE.md

Rules for working in this monorepo.

## Important Rules

### 1. Never Commit or Push Without Explicit Permission

You are **never allowed** to commit or push any code unless the user explicitly tells you to do so in a **separate user message**. Do not proactively commit or push changes, even if they appear complete.

### 0.5. Isolated Builds

When the site needs to be built while a dev server is running, use `CHECK_BUILD=1` to avoid conflicts:

```bash
pnpm --filter site build:check
```

This writes to `.next-check/` instead of `.next/`, allowing type-check and build validation without stopping the dev server.

The pattern is configured in `apps/site/next.config.ts`:
```ts
distDir: process.env.CHECK_BUILD === "1" ? ".next-check" : ".next"
```

### 2. Keep CLAUDE.md Stable

Do **not** add frequently-changing content to this file (features, env var names, per-version details). This file is for stable rules and conventions.

### 3. Package Manager

This is a **pnpm workspace monorepo**. Never use `npm` or `yarn`.

- Install: `pnpm install` (from root)
- Site dev: `pnpm dev` (runs `pnpm --filter site dev`)
- Site build: `pnpm build` (runs `pnpm --filter site build`)
- Type-check all: `pnpm type-check` (runs across all workspaces)
- Filter to a package: `pnpm --filter @syncframe/core ...`
- Filter to site: `pnpm --filter site ...`

### 4. Monorepo Structure

```
syncframe/
├── apps/
│   └── site/              # Next.js demo site (Vercel deploy root)
├── packages/
│   ├── core/              # @syncframe/core    (npm publish) — protocol + server + hooks
│   ├── redis/             # @syncframe/redis   (npm publish) — Redis store + transport
│   └── spatial/           # @syncframe/spatial (npm publish) — Layer 2
└── pnpm-workspace.yaml
```

**Vercel deploy:** Set root directory to `apps/site`.

**Publishing:** Run `pnpm publish` (NOT `npm publish`) from a `packages/*` package. The dev `package.json` `exports`/`main`/`types` point at `src/` for live workspace editing; the published artifact must use the `dist/` paths in `publishConfig`. `pnpm publish` applies those `publishConfig` field overrides and strips `publishConfig`; plain `npm publish` on this toolchain does **not**, shipping a broken exports map that points at unpublished `src/`. Only `dist/` is shipped (`files`).

### 5. Two-Layer Architecture

The library has exactly two layers:

| Layer     | Package               | Contains                                                                                                      | Does NOT contain                                                    |
| --------- | --------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Core**  | `@syncframe/core`     | Clock sync, `Anchor<T,M>`, evaluators, smoother, `SyncStore` + `SyncTransport` interfaces, React hooks        | Anything about screens, poses, calibration, world bboxes            |
| **Spatial** | `@syncframe/spatial` | Screen registry, `ScreenPose`, world bbox, calibration UI, `ChromeFreeDisplay`                              | Anything that interprets anchors (that's a consumer concern)        |

**The rule:** Core has no notion of screens. Spatial has no motion math of its own — it uses `@syncframe/core` purely as infrastructure.

### 5.5. Core Entry Points (`/server` vs `/react`)

`@syncframe/core` declares subpath exports. Import from the focused entry that matches the context — **never** deep-import `@syncframe/core/src/...` (the `exports` map forbids it):

- `@syncframe/core/server` — React-free protocol + server surface (types, `evaluateScalar`, smoother, `SyncStore`/`SyncTransport` + defaults, `SyncServer`). Use from API routes, adapter packages, any Node code.
- `@syncframe/core/react` — client hooks (`useServerClock`, `useAnchor`, `useScalarAnchor`, `useSmoothedValue`) plus type re-exports. Use from client components.
- `@syncframe/core` — full barrel; pulls React in. Convenience only.

This keeps hooks (and their DOM-lib types) out of server bundles and non-DOM packages. See [`notes/2026-06-06-package-architecture.md`](notes/2026-06-06-package-architecture.md).

### 6. Storage and Transport Are Pluggable

The library defines **interfaces** (`SyncStore`, `SyncTransport`). Core ships zero-dependency in-memory defaults (`InMemoryStore`, `EventEmitterTransport`); real backends live in their own packages — Redis ships today as **`@syncframe/redis`** (connection-injected, type-only dependency on core). Postgres and others are future packages.

Do **not** hardcode any storage backend into the core package.

### 7. Framework Adapters Are Thin

API route handlers live in adapter packages (e.g. `@syncframe/adapter-next`). They are thin: 10-30 lines that wire a framework's request shape to the core server. The library itself is framework-agnostic.

### 8. Track Tech Debt

Known shortcuts and deferred work go in [`TECH_DEBT.md`](TECH_DEBT.md). All tech debt taken on must be recorded. Delete entries once resolved.

### 9. Testing

- Unit tests live beside source (`__tests__/` folders inside packages and `apps/site`).
- Pre-push hook runs `type-check`, `lint`, and `test` in parallel, then a `CHECK_BUILD=1` site build.
- Integration tests that spin up a live server are **expensive** — run only when explicitly asked.

### 10. Prose Line Wrapping

Do **not** hard-wrap paragraphs in Markdown content. Write each paragraph as a single unwrapped line. Editor word wrap is on. Blank lines still separate blocks.

## Running Verification

```bash
pnpm type-check          # tsc --noEmit across all workspaces
pnpm build               # build the site (Next.js)
```
