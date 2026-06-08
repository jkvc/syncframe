# TECH DEBT

Tracked shortcuts and deferred work. Delete entries once resolved.

## Entries

### [2026-06-06] No adapter packages yet

- **Context:** The demo site wires Next.js API routes directly against `@syncframe/core/server`. Framework-specific route handlers (Next.js, Express, Hono) are still planned as thin adapter packages.
- **File(s):** TBD — `packages/adapter-next/`, `packages/adapter-express/`, etc.
- **Fix:** Extract the route-shape translation into adapter packages. Each is ~30 LOC.

### [2026-06-06] No CI / no GitHub Actions

- **Context:** Verification runs locally via the `.husky/pre-push` hook (type-check, lint, test, then build), but there's no `.github/workflows` running the same pipeline on push/PR.
- **File(s):** TBD — `.github/workflows/`
- **Fix:** Add a workflow that runs `type-check → lint → test → build`.

### [2026-06-07] Spatial demo API has no authentication

- **Context:** All `/api/spatial/*` routes are open to any visitor. Mutations affect the shared `spatial-demo` room (register/delete screens, poses, dot control, identify).
- **File(s):** `apps/site/app/api/spatial/`
- **Fix:** Gate mutations behind auth or a dev-only env flag; or scope rooms per tenant/session.

### [2026-06-07] No world-bbox resize route in spatial demo

- **Context:** `setWorldBbox` reducer exists; world canvas is still fixed at 1920×1080 in the demo because no API route re-anchors the dot on resize.
- **File(s):** `apps/site/app/api/spatial/`
- **Fix:** Add `/api/spatial/world-bbox` route, re-anchor dot on resize (mirror cabin world-bbox route).

### [2026-06-07] SSE connection sharing via core snapshot cache

- **Context:** `useAnchor` and `useSpatialSnapshot` share one EventSource per `streamEndpoint` through `subscribeSnapshotStream` in `@syncframe/core/react`. Without this, operator + display pages opened duplicate SSE connections per hook.
- **File(s):** `packages/core/src/snapshotStreamCache.ts`, `packages/core/src/useAnchor.ts`, `packages/spatial/src/react/useSpatialSnapshot.ts`
- **Fix:** N/A — intentional pattern. Extend cache if additional snapshot consumers are added.

### [2026-06-07] Unused Instrument Serif font load

- **Context:** The site wordmark uses italic Space Grotesk, not serif. `Instrument_Serif` is still imported in `app/layout.tsx` and `--font-serif` remains in `globals.css` from an earlier iteration.
- **File(s):** `apps/site/app/layout.tsx`, `apps/site/app/globals.css`
- **Fix:** Remove the font import, CSS variable, and body className entry.
