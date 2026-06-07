# TECH DEBT

Tracked shortcuts and deferred work. Delete entries once resolved.

## Entries

### [2026-06-06] Spatial package is still a placeholder stub

- **Context:** `@syncframe/core` and `@syncframe/redis` are implemented and exercised by the timer demo, but `@syncframe/spatial` is still an empty barrel with a `VERSION` export only.
- **File(s):** `packages/spatial/src/index.ts`
- **Fix:** Implement the screen registry, `ScreenPose`, world bbox, and calibration UI on top of `@syncframe/core`. It rides the existing `@syncframe/redis` backend with no adapter changes (see `notes/2026-06-06-package-architecture.md`).

### [2026-06-06] No adapter packages yet

- **Context:** The demo site wires Next.js API routes directly against `@syncframe/core/server`. Framework-specific route handlers (Next.js, Express, Hono) are still planned as thin adapter packages.
- **File(s):** TBD — `packages/adapter-next/`, `packages/adapter-express/`, etc.
- **Fix:** Extract the route-shape translation into adapter packages. Each is ~30 LOC.

### [2026-06-06] No CI / no GitHub Actions

- **Context:** Verification runs locally via the `.husky/pre-push` hook (type-check, lint, test, then build), but there's no `.github/workflows` running the same pipeline on push/PR.
- **File(s):** TBD — `.github/workflows/`
- **Fix:** Add a workflow that runs `type-check → lint → test → build`.

### [2026-06-06] Spatial demo + docs are placeholders

- **Context:** `apps/site` has a working timer demo (`/demo/core`) and docs, but the `/demo/spatial` and `/docs/spatial` pages are placeholders pending the spatial package.
- **File(s):** `apps/site/app/demo/spatial/`, `apps/site/app/docs/spatial/`
- **Fix:** Build the spatial demo + docs once `@syncframe/spatial` is functional.

### [2026-06-07] Unused Instrument Serif font load

- **Context:** The site wordmark uses italic Space Grotesk, not serif. `Instrument_Serif` is still imported in `app/layout.tsx` and `--font-serif` remains in `globals.css` from an earlier iteration.
- **File(s):** `apps/site/app/layout.tsx`, `apps/site/app/globals.css`
- **Fix:** Remove the font import, CSS variable, and body className entry.
