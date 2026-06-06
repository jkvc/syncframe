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
│   ├── core/              # @syncframe/core (npm publish)
│   └── spatial/           # @syncframe/spatial (npm publish)
└── pnpm-workspace.yaml
```

**Vercel deploy:** Set root directory to `apps/site`.

**npm publish:** Run from `packages/core/` or `packages/spatial/` — only ships `dist/`.

### 5. Two-Layer Architecture

The library has exactly two layers:

| Layer     | Package               | Contains                                                                                                      | Does NOT contain                                                    |
| --------- | --------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Core**  | `@syncframe/core`     | Clock sync, `Anchor<T,M>`, evaluators, smoother, `SyncStore` + `SyncTransport` interfaces, React hooks        | Anything about screens, poses, calibration, world bboxes            |
| **Spatial** | `@syncframe/spatial` | Screen registry, `ScreenPose`, world bbox, calibration UI, `ChromeFreeDisplay`                              | Anything that interprets anchors (that's a consumer concern)        |

**The rule:** Core has no notion of screens. Spatial has no motion math of its own — it uses `@syncframe/core` purely as infrastructure.

### 6. Storage and Transport Are Pluggable

The library defines **interfaces** (`SyncStore`, `SyncTransport`) and ships multiple implementations (InMemory, Redis, Postgres). Core must work with zero runtime dependencies (in-memory defaults).

Do **not** hardcode any storage backend into the core package.

### 7. Framework Adapters Are Thin

API route handlers live in adapter packages (e.g. `@syncframe/adapter-next`). They are thin: 10-30 lines that wire a framework's request shape to the core server. The library itself is framework-agnostic.

### 8. Track Tech Debt

Known shortcuts and deferred work go in [`TECH_DEBT.md`](TECH_DEBT.md). All tech debt taken on must be recorded. Delete entries once resolved.

### 9. Testing

- Unit tests live beside source (`__tests__/` folders inside packages).
- Pre-push hook runs `type-check → build` across packages.
- Integration tests that spin up a live server are **expensive** — run only when explicitly asked.

### 10. Prose Line Wrapping

Do **not** hard-wrap paragraphs in Markdown content. Write each paragraph as a single unwrapped line. Editor word wrap is on. Blank lines still separate blocks.

## Running Verification

```bash
pnpm type-check          # tsc --noEmit across all workspaces
pnpm build               # build the site (Next.js)
```
