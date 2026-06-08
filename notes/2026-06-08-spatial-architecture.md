# Spatial Layer Architecture — `@syncframe/spatial`

**Date:** 2026-06-08

This note records how Layer 2 is actually implemented after the spatial demo work landed on `main` (commits `d7dfe9f` through `20b2f1b`, plus site consumer refactors in `8b915e4` / `813e114`). It is the design record for *why* the package looks the way it does. Integration how-to lives on the site at `/docs/spatial`; package wiring for core/redis is in [2026-06-06-package-architecture.md](./2026-06-06-package-architecture.md); original vision is in [2026-06-06-kickoff.md](./2026-06-06-kickoff.md).

---

## What this package is

`@syncframe/spatial` is Layer 2: **where each named display looks in a shared world canvas**. It does not own content motion. Motion stays on Layer 1 anchor channels (`dot`, `ring-spin`, `video`, …) evaluated with `clock.serverNow()` from `@syncframe/core`.

Spatial owns:

- A **screen registry** (`screens[name] → pose + sessions`)
- **World bbox** and global **render mode** (`calibration` | `content`)
- Pure **reducers** and **coord math** for poses
- **`SpatialServer`** — read-modify-write bridge over `SyncServer.meta`
- Optional **React hooks** and a **`/ui` display kit** (calibration grid, room map, kiosk shell)

Spatial does **not** own:

- Concrete scenes (dot, ring, pano, video)
- Operator panels (pose editor, screen cards, spin controls)
- API route handlers (thin Next.js glue in `apps/site`)
- Identify Redis keys (pattern is documented; each app implements its own key under its namespace)
- Framework adapters (`@syncframe/adapter-next` is still planned — see `TECH_DEBT.md`)

The package is **`private: true`** and **not published to npm** yet. `@syncframe/core` and `@syncframe/redis` are published at **0.3.0**; spatial is consumed from the monorepo workspace (`workspace:*` in `apps/site`).

---

## Evolution (commits that shaped the design)

| Commit | What changed architecturally |
|--------|------------------------------|
| `d7dfe9f` | Layer 2 exists: headless spatial types/reducers/hooks, first dot demo, **namespace-bound `SyncServer`** (breaking 0.2.x `roomId` per call), `ensureAnchor`, **`snapshotStreamCache`** so multiple hooks share one SSE connection. Released core/redis **0.3.0**. |
| `301ac82` | **`/ui` kit** ported from Reckon reference: `CalibrationGrid`, `TopDownRoomMap`, `ChromeFreeDisplay`, `IdentifyFlash`, presentation kiosk mode. Introduced **`SpatialContentLayer`** with shared `evaluateFrame` for map + wall. |
| `6f135b5` | **`maxScreens`** cap on `SpatialServer` (default 5); `ensureScreen` returns `limit_reached`; demo uses 4. |
| `143adff` | **`rotationDeg` removed** from `ScreenPose` — poses are axis-aligned bboxes only; rotation is explicitly out of scope. |
| `ac28b07` | Unified content around **one `evaluateFrame`** and **two projections**: world-native map vs pose-cropped viewport. Dropped intermediate `MapPreview` from the contract. |
| `4047eef` | **Rendering opinions moved out of the lib** — spatial keeps projection math; consumers own `MapView` / `Display` paint (SVG, div, canvas). Dot gets `lib/dot-render.tsx`. |
| `e01adc1` | **`defaultSpatialMeta` has no `contentLayerId`**; no default map background. `SpatialServer.initialMeta` is how apps seed layer id / pre-baked screens. `TopDownRoomMap` no longer paints a world underlay. |
| `20b2f1b` | **`WorldShapePaint`** union (`solid` \| `image`), **`evaluateFrame` required**, paint threaded through `projectWorldFrameToViewport`. |
| `c4e4ab8` | Second consumer: **color ring demo** — isolated `ring-demo` namespace, scalar spin anchor, fixed quadrant screens (site-only; no lib changes). |
| `8b915e4` | Site restructure: flat `/demo/dot`, `/demo/ring`, `/demo/timer`; dot-specific `lib/dot-*`, `/api/dot/*`, `dot-demo` Redis namespace. |

---

## Position in the two-layer stack

```
┌─────────────────────────────────────────────────────────────────┐
│  apps/site (consumers)                                          │
│  lib/dot.ts, lib/ring.ts — motion reducers + anchor shapes     │
│  lib/dot-layer.tsx, lib/ring-layer.tsx — SpatialContentLayer  │
│  lib/dot-render.tsx, lib/ring-render.tsx — paint opinions     │
│  app/api/{dot,ring}/* — thin routes, snapshot enrichment        │
└────────────────────────────┬────────────────────────────────────┘
                             │ implements SpatialContentLayer
                             │ calls SpatialServer + SyncServer
┌────────────────────────────▼────────────────────────────────────┐
│  @syncframe/spatial                                             │
│  meta.spatial blob, reducers, coords, hooks, /ui kit            │
└────────────────────────────┬────────────────────────────────────┘
                             │ meta + anchors on same SyncServer
┌────────────────────────────▼────────────────────────────────────┐
│  @syncframe/core                                                │
│  SyncServer, anchors, clock, SSE CoreSnapshot, useAnchor       │
└────────────────────────────┬────────────────────────────────────┘
                             │ SyncStore + SyncTransport
┌────────────────────────────▼────────────────────────────────────┐
│  @syncframe/redis (or InMemoryStore in tests)                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key invariant:** spatial state is **not** a separate database table or channel. It is a structured JSON object at `meta.spatial` on the same `SyncServer` namespace as the content anchors. SSE still ships one `CoreSnapshot` per namespace; clients parse both `anchors` and `meta.spatial` from it.

---

## Entry points

Same pattern as core — separate React/DOM from server code:

| Import | Contents | Use from |
|--------|----------|----------|
| `@syncframe/spatial/server` | `SpatialMeta` types, reducers, `coords`, `SpatialServer`, `normalizeScreenPose`, constants | API routes, snapshot builders, tests |
| `@syncframe/spatial/react` | `useSpatialSnapshot`, `useSelfScreen`, `useDisplaySurface`, helpers (`listScreenNames`, `isScreenOnline`, …) | Client components |
| `@syncframe/spatial/ui` | `SpatialContentLayer` contract, `projectWorldFrameToViewport`, display chrome | Client components (display + operator map) |
| `@syncframe/spatial` | Full barrel — convenience only | Avoid in server bundles |

Deep imports under `packages/spatial/src/...` are not part of the public contract.

---

## Data model (`SpatialMeta`)

Defined in `packages/spatial/src/types.ts`. Persisted under `meta.spatial` (key overridable via `SpatialServer.metaKey`, default `'spatial'`).

```typescript
interface SpatialMeta {
  worldBbox: { width: number; height: number };  // default 1920×1080
  renderMode: 'calibration' | 'content';
  contentLayerId?: string;   // opaque to spatial; set via initialMeta, not a lib default
  screens: Record<string, ScreenEntry>;
  identifyTrigger?: { screenName: string; at: number } | null;  // usually SSE-only
}

interface ScreenEntry {
  pose: ScreenPose;           // world-axis-aligned bbox — no rotation
  createdAt: string;
  sessions: Record<string, ScreenSession>;
}

interface ScreenPose {
  worldX: number;
  worldY: number;
  worldWidth: number;   // must be > 0
  worldHeight: number;  // must be > 0
}
```

**Screen names:** 1–32 chars, `[a-z0-9_-]`, case-insensitive (`isValidScreenName`).

**Default pose for new screens:** full world bbox at origin (`DEFAULT_POSE`).

**Sessions vs pose:** pose is per *name* (the logical display). sessions are per *browser tab* (`sessionId` from client crypto random). Operator UI uses session heartbeats for presence; pose editing is independent.

**`contentLayerId`:** forwarded for operator UI only. Spatial reducers do not interpret it. Apps set it through `SpatialServer({ initialMeta: { contentLayerId: 'dot' } })` or `setContentLayerId` reducer — never defaulted by `defaultSpatialMeta()`.

**`identifyTrigger`:** documented on the type for wire shape, but **not persisted in Redis meta JSON**. Site demos store a short-lived key (`syncframe:{namespace}:spatial:identify`, TTL 5s) and merge into the snapshot at SSE build time (`buildDotDemoSnapshot`, `buildRingDemoSnapshot`). Clients dedupe flashes on `trigger.at` (`IdentifyFlash`).

---

## `SpatialServer` — the meta bridge

`SpatialServer` wraps one `SyncServer` instance. It never talks to Redis directly.

| Method | Role |
|--------|------|
| `getMeta()` | `parseSpatialMeta` + `pruneStaleSessions` at read time |
| `apply(mutator)` | Read-modify-write full spatial object via `sync.patchMeta({ spatial: next })` |
| `ensureInitialized()` | Writes `defaultSpatialMeta()` merged with `initialMeta` if key missing |
| `registerScreen(name)` | `ensureScreen` with `maxScreens`; returns `{ ok, reason: 'limit_reached' }` |
| `publish()` | `sync.publishUpdate()` — fan-out after mutations |

**Why `apply` always writes the whole spatial object:** `patchMeta` shallow-merges top-level meta keys. Nested `spatial.screens` must be replaced atomically by the mutator return value, not patched field-by-field from outside.

**`maxScreens`:** constructor option (default `DEFAULT_MAX_SCREENS` = 5). Dot demo passes 4. Ring demo passes 4 with all four names pre-seeded in `initialMeta` so registration is idempotent.

**`initialMeta`:** the extension point for app-specific starting state. Examples on the site:

- **Dot:** `{ contentLayerId: 'dot' }` only — screens registered at runtime.
- **Ring:** `buildRingInitialMeta()` — 500×500 world, `renderMode: 'content'`, four quadrant poses (`nw`/`ne`/`sw`/`se`), `contentLayerId: 'ring'`.

---

## Core integration: one namespace, many channels

`SyncServer` (0.3.0+) binds partition scope at construction:

```typescript
const sync = new SyncServer({
  store: new RedisStore({ redis }),
  transport: new RedisTransport({ redis, createSubscriber }),
  namespace: 'dot-demo',  // or 'ring-demo', 'global' for timer, etc.
});
```

Anchor CRUD is `getAnchor(channelId)` / `setAnchor(channelId, …)` — no per-call room id.

Redis keys (default prefix `syncframe`):

- `syncframe:{namespace}:anchor:{channelId}` — anchor JSON
- `syncframe:{namespace}:meta` — includes `spatial` key among others
- `syncframe:{namespace}:channels` — set of anchor channel ids

Site namespaces today:

| Demo | `SyncServer.namespace` | Motion anchor(s) | API prefix |
|------|------------------------|------------------|------------|
| Timer | `global` | `timer` (scalar) | `/api/timer` |
| Dot | `dot-demo` | `dot` (linear2dBouncing) | `/api/dot` |
| Ring | `ring-demo` | `ring-spin` (scalar angle) | `/api/ring` |

Shared Redis instances must use distinct namespaces (watchparty uses `wp:` prefix on its own keys; syncframe uses `syncframe:` + namespace).

---

## SSE and hook sharing

`CoreSnapshot` streams over SSE. Spatial hooks subscribe to the same endpoint as `useAnchor` for that room.

`subscribeSnapshotStream` in `@syncframe/core/react` (backed by `snapshotStreamCache.ts`) keeps **one `EventSource` per `streamEndpoint` URL**. On a dot operator page running both `useSpatialSnapshot` and `useAnchor('dot', …)`, both hooks attach to the same connection. This is intentional (see `TECH_DEBT.md`).

Stream routes typically:

1. `ensureInitialized()` on `SpatialServer`
2. `ensureAnchor(contentChannel, factory)` on `SyncServer`
3. On publish: build snapshot, optionally enrich (`pruneStaleSessions`, merge `identifyTrigger`), send `data: …\n\n`
4. Heartbeat comments `: ping` / `: open` for proxies

---

## `SpatialContentLayer` contract

The central consumer extension point (`packages/spatial/src/ui/content-layer.ts`). Spatial defines **geometry + projection**; the app defines **what to draw**.

```typescript
type WorldShapePaint =
  | { kind: 'solid'; color: string }
  | { kind: 'image'; url: string };

interface WorldShape {
  x: number; y: number; width: number; height: number;
  paint: WorldShapePaint;
  label?: string;
  opacity?: number;
}

interface SpatialContentLayer {
  id: string;
  label: string;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;  // required
  MapView: ComponentType<WorldPreviewContext>;
  Display: ComponentType<ContentLayerDisplayProps>;
}

interface WorldEvalContext {
  snapshot: CoreSnapshot;
  clock: ServerClock;
  spatial: SpatialMeta;
}
```

**`evaluateFrame` rules:**

- Called at `clock.serverNow()` on both map and wall.
- Returns world-space **axis-aligned rects** only. Motion is baked into `x`/`y` (scroll offset, bounce position, spin angle via layout, etc.).
- Empty `{ shapes: [] }` is valid when anchor is missing.
- Ripples, backgrounds, petals — all are just more `WorldShape` entries.

**`MapView` vs `Display`:**

- **`MapView`** — rendered inside `TopDownRoomMap` SVG at world coordinates `(0,0)…(worldW, worldH)` with uniform scale. Screen pose rects are drawn **on top** by the kit as overlays (not part of the layer).
- **`Display`** — receives `pose` for this monitor; typically calls `projectWorldFrameToViewport(evaluateFrame(ctx), pose, innerWidth, innerHeight)` then paints projected shapes.

**Static export vs hook factory:** dot/ring export both a static `dotLayer` / `ringLayer` (for tests/docs) and `useDotContentLayer()` / `useRingContentLayer()` that close over React state (ripple effects, spin smoothing offsets). Production UI uses the hooks.

---

## Two projections (WYSIWYG map and wall)

Implemented in `packages/spatial/src/ui/world-projection.ts` — **no paint opinions**.

1. **Map (world-native):** `TopDownRoomMap` sets SVG `viewBox="0 0 worldW worldH"`. `MapView` draws shapes in world units. Operator sees the whole room plus screen rectangles.

2. **Wall (pose crop + stretch):** `mapWorldShapeToScreenPixels` computes independent `scaleX = viewportWidth / pose.worldWidth`, `scaleY = viewportHeight / pose.worldHeight`, then maps shape edges relative to `pose.worldX/Y`. Non-uniform scale is intentional — each physical monitor stretches its world slice to fill the viewport (seam alignment is a calibration problem, not a projection problem).

`projectWorldFrameToViewport` adds `visible` (off-viewport cull) and passes `paint` through for consumer renderers.

Lower-level normalized coords (`worldToScreen` / `screenToWorld` in `coords.ts`) map to 0..1 within a pose bbox — useful for hit testing or non-rect content; display kit uses pixel projection directly.

---

## React hooks

| Hook | Purpose |
|------|---------|
| `useSpatialSnapshot({ streamEndpoint })` | Operator: `spatial` + full `snapshot` + `connected` |
| `useSelfScreen({ screenName, spatial, apiBase })` | Display: resolve `entry`, heartbeat loop, `deleted` detection |
| `useDisplaySurface(…)` | Combines snapshot + self screen + render mode + identify trigger |

**Presence:** `useSelfScreen` POSTs `/heartbeat` every `HEARTBEAT_INTERVAL_MS` (10s). Server `heartbeat` reducer upserts session; `pruneStaleSessions` drops sessions older than `SESSION_TTL_MS` (30s). `isScreenOnline` mirrors that for operator UI.

**Deletion:** display marks `deleted` if heartbeat returns 404 or screen name disappears from snapshot (operator deleted the name).

---

## `/ui` display kit

Ported from the Reckon reference implementation; site styling follows `STYLE.md`.

| Component | Role |
|-----------|------|
| `TopDownRoomMap` | Operator preview — `MapView` + screen overlays + online tint |
| `CalibrationGrid` | Test pattern stretched to pose in calibration mode |
| `ChromeFreeDisplay` | Unified display shell: loading/deleted/calibration/content/identify |
| `PresentationBlank` | Black fullscreen for kiosk (`presentation` prop) |
| `IdentifyFlash` | 1s red overlay; dedupes on `trigger.at` |
| `DeletedScreenOverlay` | Non-kiosk deleted state |

**Presentation mode:** `data-presentation` layout hides site chrome via `globals.css`. Loading and deleted states are black, not status text. Calibration grid still shows in calibration mode; content mode renders only the layer.

**Operator panels are app code:** `DotOperator`, `RingOperator`, `DotPoseEditor` live under `apps/site/app/demo/*/_components/`. The library intentionally does not ship pose editors or screen cards.

---

## Site reference consumers (patterns, not prescriptions)

### Dot (`/demo/dot`, `dot-demo`)

- **World:** default 1920×1080.
- **Screens:** operator registers arbitrary names (max 4); poses edited manually.
- **Motion:** `dot` channel, `linear2dBouncing` in `lib/dot.ts`; control via `POST /api/dot/control`.
- **Layer:** `useDotContentLayer()` — bounce ripples as expanding world circles, complement background color, client offset decay for SSE latency.
- **Files:** `lib/dot-{server,config,snapshot,identify}.ts`, `lib/dot-layer.tsx`, `lib/dot-render.tsx`.

### Color ring (`/demo/ring`, `ring-demo`)

- **World:** 500×500 white canvas.
- **Screens:** four fixed quadrants pre-seeded in `buildRingInitialMeta()`; identify-only operator (no pose editor).
- **Motion:** `ring-spin` scalar anchor; `POST /api/ring/spin` start/pause; resume uses `serverNow` in POST body + client spin-angle offset decay to avoid jump.
- **Layer:** `useRingContentLayer()` — twelve outlined petals from `layoutRingPetals(angle, worldSize)`.
- **Files:** `lib/ring-{server,config,snapshot,identify,initial-meta}.ts`, `lib/ring-layer.tsx`, `lib/ring-render.tsx`.

Both demos share identical spatial **route shape** (stream, heartbeat, identify, render-mode, screens/*) but different **namespaces**, **anchors**, and **initial meta**. Neither demo imports the other's lib code.

---

## API route pattern (consumer-owned)

Spatial does not ship route handlers. The repeated pattern in `apps/site/app/api/{dot,ring}/`:

| Route | Typical flow |
|-------|----------------|
| `GET /stream` | `ensureInitialized`, `ensureAnchor`, subscribe, `build*DemoSnapshot`, SSE |
| `POST /screens/register` | `spatial.registerScreen` → 409 on limit |
| `PUT /screens/update-pose` | `normalizeScreenPose` → `updatePose` reducer |
| `DELETE /screens/delete` | `deleteScreen` |
| `POST /heartbeat` | `heartbeat` reducer; 404 if name gone |
| `POST /render-mode` | `setRenderMode` |
| `POST /identify` | app Redis SET + TTL; snapshot merge on read |
| Content control | dot: `POST /control`; ring: `POST /spin` — both mutate anchors on the same `SyncServer` then `spatial.publish()` |

Mutations always: **reducer → `spatial.apply` → `spatial.publish()`** so all clients receive one coherent snapshot.

---

## Deliberate non-features

Documented so future work does not accidentally smuggle demo concerns back into the lib:

- **No screen rotation** — removed `rotationDeg`; poses are bboxes only (`143adff`).
- **No default content layer** — apps must set `contentLayerId` via `initialMeta` if they want it (`e01adc1`).
- **No lib-owned scene renderers** — no dot SVG, no map background (`4047eef`, `e01adc1`).
- **No identify persistence in meta** — transient Redis + SSE merge only.
- **No world-bbox resize API on site yet** — `setWorldBbox` reducer exists; dot re-anchor on resize is tech debt (`TECH_DEBT.md`).
- **No auth on demo APIs** — open mutations on shared rooms (`TECH_DEBT.md`).
- **No npm publish** for spatial yet — no `tsup` build / `publishConfig` in `packages/spatial/package.json`.

---

## Testing strategy

Unit tests live beside source under `packages/spatial/src/__tests__/`:

- `reducers.test.ts` — pure meta mutations, parse defaults, limit behavior
- `coords.test.ts` — world ↔ normalized screen
- `spatial-server.test.ts` — `apply` deep merge, `initialMeta`, `maxScreens`
- `render-world-frame.test.ts` — projection math, visibility culling

Site consumer logic is tested separately (`apps/site/lib/__tests__/dot*.ts`, `ring.test.ts`). Layer tests call `evaluateFrame` with mock `CoreSnapshot` + clock.

---

## Related docs (do not duplicate here)

- **Integration guide:** `apps/site/app/docs/spatial/page.tsx` (`/docs/spatial`)
- **Core entry points + redis adapter:** [2026-06-06-package-architecture.md](./2026-06-06-package-architecture.md)
- **Original two-layer vision:** [2026-06-06-kickoff.md](./2026-06-06-kickoff.md)
- **Site visual system:** `STYLE.md`, [2026-06-07-site-design-system.md](./2026-06-07-site-design-system.md)
- **Agent conventions:** `CLAUDE.md` (stable rules only)
- **Deferred work:** `TECH_DEBT.md`

---

## Open questions / likely next steps

- **Publish `@syncframe/spatial`** — add `tsup` build, `publishConfig`, version ≥ 0.1.0; document breaking changes from any API stabilization.
- **`@syncframe/adapter-next`** — extract repeated route boilerplate (~30 LOC per handler).
- **World bbox resize route** — re-anchor content when `worldBbox` changes.
- **Third content layer** (e.g. pano scroll) — validates `evaluateFrame` for wide image rects with scroll offset in `x`.
- **Postgres store package** — spatial meta would remain a JSON blob inside `meta.spatial`; no schema change to the spatial API surface.
