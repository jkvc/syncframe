import type { Metadata } from 'next';
import DocJsonLd from '@/components/DocJsonLd';
import InteriorPageShell from '@/components/editorial/InteriorPageShell';
import PageStampHeader from '@/components/editorial/PageStampHeader';
import CodeBlock from '@/components/docs/CodeBlock';
import DocSection, { RefList, RefRow, StepItem, StepList } from '@/components/docs/DocSection';
import { ActionRow, Pill } from '@/components/site/PageChrome';
import { pageMetadata } from '@/lib/metadata';
import { SPATIAL_DOC } from '@/lib/site-routes';

export const metadata: Metadata = pageMetadata(SPATIAL_DOC);

export default function SpatialDocsPage() {
  return (
    <InteriorPageShell>
      <DocJsonLd route={SPATIAL_DOC} />
      <PageStampHeader
        meta={{ eyebrow: 'Layer 2', trailing: '@syncframe/spatial' }}
        className="mb-12"
      >
        <h1 className="font-sans text-4xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Spatial
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
          Multi-display calibration on top of <code className="font-mono text-sm">@syncframe/core</code>. Register screens, assign each a world-coordinate viewport, track presence, and render shared content cropped per display. Optional <code className="font-mono text-sm">/ui</code> ships display chrome; content layers stay in your app. Live examples: the <a href="/demo/dot" className="text-hot underline">dot demo</a> (bouncing circle) and <a href="/demo/ring" className="text-hot underline">color ring demo</a> (spinning petals across four quadrants).
        </p>
      </PageStampHeader>

      <DocSection title="Overview">
        <p>
          Layer 1 syncs scalar or vector state with anchors and a server clock. Layer 2 adds a <strong>screen registry</strong>: named displays, poses in a shared world canvas, session heartbeats, and a global calibration/content render mode. Content motion still uses core anchors — spatial only owns where each screen looks in world space.
        </p>
        <p>
          Prerequisites: <code className="font-mono text-sm">@syncframe/core</code> (protocol + hooks) and a production store such as <code className="font-mono text-sm">@syncframe/redis</code>. See <a href="/docs/core" className="text-hot underline">core docs</a> and <a href="/docs/redis" className="text-hot underline">redis adapter docs</a>.
        </p>
        <CodeBlock
          code={`// Monorepo / workspace today — npm publish TBD
pnpm add @syncframe/core @syncframe/redis`}
          lang="bash"
        />
      </DocSection>

      <DocSection title="Entry points">
        <RefList>
          <RefRow label="@syncframe/spatial/server" note="Types, pure reducers, coord math, SpatialServer — React-free" />
          <RefRow label="@syncframe/spatial/react" note="useSpatialSnapshot, useSelfScreen, useDisplaySurface" />
          <RefRow label="@syncframe/spatial/ui" note="ChromeFreeDisplay, TopDownRoomMap, SpatialContentLayer contract, presentation kiosk mode" />
          <RefRow label="@syncframe/spatial" note="Full barrel (pulls React) — convenience only" />
        </RefList>
        <p>
          Import server code from <code className="font-mono text-sm">/server</code> in API routes; import hooks from <code className="font-mono text-sm">/react</code> in client components.
        </p>
      </DocSection>

      <DocSection title="What spatial owns vs what you own">
        <StepList>
          <StepItem number="01">
            <strong>Spatial owns:</strong> <code className="font-mono">ScreenPose</code>, <code className="font-mono">SpatialMeta</code> reducers, <code className="font-mono">SpatialServer</code> bridge, world↔normalized coord helpers, hooks, and optional <code className="font-mono">/ui</code> display kit (calibration grid, room map, display shell).
          </StepItem>
          <StepItem number="02">
            <strong>You own:</strong> operator panels (pose editor, screen cards), concrete content layers conforming to <code className="font-mono">SpatialContentLayer</code>, anchor evaluators, API routes, identify Redis key, SSE stream wiring.
          </StepItem>
          <StepItem number="03">
            <strong>Core still owns:</strong> clock sync, anchor CRUD, snapshot pub/sub, <code className="font-mono text-sm">useAnchor</code> for motion channels.
          </StepItem>
        </StepList>
      </DocSection>

      <DocSection title="Data model">
        <p>
          Spatial state lives in <code className="font-mono text-sm">meta.spatial</code> on a <code className="font-mono text-sm">SyncServer</code> instance. Snapshots are still core <code className="font-mono text-sm">CoreSnapshot</code> JSON over SSE — spatial is a structured meta blob plus whatever anchor channels your content needs.
        </p>
        <CodeBlock
          code={`interface SpatialMeta {
  worldBbox: { width: number; height: number };  // default 1920×1080
  renderMode: 'calibration' | 'content';
  contentLayerId?: string;  // consumer sets via SpatialServer.initialMeta (not a lib default)
  screens: Record<string, ScreenEntry>;
  identifyTrigger?: { screenName: string; at: number } | null; // often merged at SSE build
}

interface ScreenEntry {
  pose: ScreenPose;
  createdAt: string;
  sessions: Record<string, ScreenSession>;
}

interface ScreenPose {
  worldX: number;
  worldY: number;
  worldWidth: number;
  worldHeight: number;
}`}
        />
        <p>
          Each <code className="font-mono text-sm">screenName</code> is a stable id (1–32 chars, alphanumeric + <code className="font-mono text-sm">_-</code>). New screens get a default pose covering the full world bbox at the origin — operators spread them manually. Sessions are per browser tab; pose is per name.
        </p>
      </DocSection>

      <DocSection title="Wire SpatialServer">
        <p>
          Bind one <code className="font-mono text-sm">SyncServer</code> namespace per spatial app. The site runs two isolated rooms: <code className="font-mono text-sm">dot-demo</code> (<a href="/demo/dot" className="text-hot underline">dot demo</a>) and <code className="font-mono text-sm">ring-demo</code> (<a href="/demo/ring" className="text-hot underline">color ring demo</a>). <code className="font-mono text-sm">SpatialServer</code> read-modify-writes the <code className="font-mono text-sm">spatial</code> key under that server&apos;s meta.
        </p>
        <CodeBlock
          code={`import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';
import { SpatialServer, ensureScreen } from '@syncframe/spatial/server';

const sync = new SyncServer({
  store: new RedisStore({ redis }),
  transport: new RedisTransport({ redis, createSubscriber }),
  namespace: 'dot-demo',
});

const spatial = new SpatialServer({ sync });

await spatial.ensureInitialized();
await spatial.apply((m) => ensureScreen(m, 'wall-left'));
await spatial.publish();`}
        />
        <CodeBlock
          code={`// Pure reducers (testable, framework-agnostic)
import {
  ensureScreen,
  updatePose,
  deleteScreen,
  heartbeat,
  setRenderMode,
  setWorldBbox,
  setContentLayerId,
  pruneStaleSessions,
  parseSpatialMeta,
} from '@syncframe/spatial/server';

// spatial.apply((m) => updatePose(m, name, pose) ?? m)
// spatial.apply((m) => heartbeat(m, name, session) ?? m)`}
          note="Always mutate through spatial.apply() so the full spatial object is written back to meta."
        />
      </DocSection>

      <DocSection title="Coordinate math">
        <p>
          A <code className="font-mono text-sm">ScreenPose</code> defines which rectangle of world space a display renders. Map world points into normalized 0..1 coordinates within that pose, then scale to viewport pixels in your renderer (independent X/Y scale — stretch to fill the monitor).
        </p>
        <CodeBlock
          code={`import { worldToScreen, screenToWorld } from '@syncframe/spatial/server';

const pose = { worldX: 100, worldY: 200, worldWidth: 400, worldHeight: 300 };

// World (300, 350) → normalized (0.5, 0.5) — center of this pose's bbox
worldToScreen({ x: 300, y: 350 }, pose);

// Pixel placement (consumer — map normalized or world units to clientWidth/Height):
const scaleX = viewportWidth / pose.worldWidth;
const screenX = (worldX - pose.worldX) * scaleX;`}
        />
        <p>
          Content layers crop world shapes to each pose via <code className="font-mono text-sm">mapWorldShapeToScreenPixels</code> from <code className="font-mono text-sm">@syncframe/spatial/ui</code>: evaluate motion in world space at <code className="font-mono text-sm">clock.serverNow()</code>, then affine-stretch into the viewport.
        </p>
      </DocSection>

      <DocSection title="React hooks">
        <p>
          Hooks subscribe to your SSE stream (core <code className="font-mono text-sm">CoreSnapshot</code>). Multiple hooks on the same stream URL share one <code className="font-mono text-sm">EventSource</code> via <code className="font-mono text-sm">subscribeSnapshotStream</code> in core.
        </p>
        <CodeBlock
          code={`// Operator — registry + render mode, no heartbeat
import { useSpatialSnapshot, listScreenNames, isScreenOnline } from '@syncframe/spatial/react';

const { spatial, snapshot, connected } = useSpatialSnapshot({
  streamEndpoint: '/api/dot/stream',
});

// Display — registry + pose + heartbeat + identify
import { useDisplaySurface } from '@syncframe/spatial/react';

const { pose, isCalibration, isContent, deleted, identifyTrigger } = useDisplaySurface({
  screenName: 'wall-left',
  streamEndpoint: '/api/dot/stream',
  apiBase: '/api/dot',
  heartbeat: true,
});

// Content motion — separate core anchor channel
import { useAnchor } from '@syncframe/core/react';

const dotAnchor = useAnchor('dot', '/api/dot/stream');`}
          note="Partition scope is server-side: your stream route binds SyncServer.namespace. Hooks only pass channel id + stream URL."
        />
      </DocSection>

      <DocSection title="Presence & heartbeats">
        <p>
          Each display tab generates a <code className="font-mono text-sm">sessionId</code> and POSTs heartbeats every 10s with viewport size and user agent. Sessions expire after 30s without a heartbeat. Every heartbeat triggers a snapshot publish so the operator UI stays fresh.
        </p>
        <RefList>
          <RefRow label="HEARTBEAT_INTERVAL_MS" note="10_000 — client cadence" />
          <RefRow label="SESSION_TTL_MS" note="30_000 — server prune + client stale filter" />
          <RefRow label="POST /heartbeat" note="{ screenName, sessionId, clientWidthPx, clientHeightPx, devicePixelRatio, userAgent }" />
        </RefList>
        <CodeBlock
          code={`// Display detects deletion from snapshot absence OR heartbeat 404
// useSelfScreen stops heartbeating when deleted`}
        />
      </DocSection>

      <DocSection title="API routes (consumer pattern)">
        <p>
          Each site demo implements thin Next.js routes under its own prefix — <code className="font-mono text-sm">/api/dot/*</code> and <code className="font-mono text-sm">/api/ring/*</code>. Each mutating route calls <code className="font-mono text-sm">spatial.apply(...)</code> then <code className="font-mono text-sm">spatial.publish()</code>. The stream route merges identify triggers and prunes stale sessions before fan-out.
        </p>
        <RefList>
          <RefRow label="GET /stream" note="SSE CoreSnapshot; : open preamble; ensureAnchor for content channel" />
          <RefRow label="POST /screens/register" note="{ name } — idempotent, validates screen name" />
          <RefRow label="PUT /screens/update-pose" note="{ name, pose } — normalizeScreenPose validates W/H &gt; 0" />
          <RefRow label="DELETE /screens/delete" note="?name= — cascades sessions in meta" />
          <RefRow label="POST /heartbeat" note="Upserts session on screen entry" />
          <RefRow label="POST /render-mode" note="{ mode: 'calibration' | 'content' }" />
          <RefRow label="POST /identify" note="{ name } — transient trigger (demo: separate Redis key, 5s TTL)" />
          <RefRow label="POST /control" note="Dot only — { action: 'start' | 'pause' | 'reset' } on the dot anchor" />
          <RefRow label="POST /spin" note="Ring only — { action: 'start' | 'pause' } on the ring-spin scalar anchor" />
        </RefList>
      </DocSection>

      <DocSection title="Content layer contract">
        <p>
          Each content module exports a <code className="font-mono text-sm">SpatialContentLayer</code>. <code className="font-mono text-sm">evaluateFrame</code> is required: it returns world-space rects (<code className="font-mono text-sm">WorldFrame</code>) with motion baked into <code className="font-mono text-sm">x</code>/<code className="font-mono text-sm">y</code>. <code className="font-mono text-sm">MapView</code> and <code className="font-mono text-sm">Display</code> paint those rects; the spatial package supplies pose-crop projection only.
        </p>
        <ul className="prose-doc list-disc space-y-2 pl-5">
          <li><strong>Top-down map</strong> — <code className="font-mono text-sm">TopDownRoomMap</code> hosts <code className="font-mono text-sm">MapView</code> at <code className="font-mono text-sm">(0,0)</code> in <code className="font-mono text-sm">worldW×worldH</code> with uniform scale. Screen pose rects are overlaid on top.</li>
          <li><strong>Wall display</strong> — <code className="font-mono text-sm">Display</code> calls <code className="font-mono text-sm">projectWorldFrameToViewport</code> to crop each rect to the screen pose bbox and stretch into viewport pixels.</li>
        </ul>
        <CodeBlock
          code={`type WorldShapePaint =
  | { kind: 'solid'; color: string }
  | { kind: 'image'; url: string };

interface WorldShape {
  x: number; y: number; width: number; height: number;
  paint: WorldShapePaint;
  label?: string; opacity?: number;
}

interface SpatialContentLayer {
  id: string;
  label: string;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  MapView: ComponentType<WorldPreviewContext>;
  Display: ComponentType<ContentLayerDisplayProps>;
}

// @syncframe/spatial/ui — projection only, no draw opinions
import { projectWorldFrameToViewport } from '@syncframe/spatial/ui';`}
        />
        <p>
          WYSIWYG: map and wall share the same <code className="font-mono text-sm">evaluateFrame</code> and the same paint helpers. A scrolling pano returns one wide image rect with scroll offset in <code className="font-mono text-sm">x</code>; projection crops it per screen. The <a href="/demo/dot" className="text-hot underline">dot demo</a> uses solid rects in <code className="font-mono text-sm">lib/dot-render.tsx</code>; the <a href="/demo/ring" className="text-hot underline">color ring demo</a> places twelve outlined petals in <code className="font-mono text-sm">lib/ring-render.tsx</code>.
        </p>
      </DocSection>

      <DocSection title="Display UI kit (/ui)">
        <p>
          Import display chrome from <code className="font-mono text-sm">@syncframe/spatial/ui</code>. <code className="font-mono text-sm">ChromeFreeDisplay</code> is the unified display shell: calibration grid or content layer, heartbeat, identify flash.
        </p>
        <CodeBlock
          code={`import { ChromeFreeDisplay, TopDownRoomMap } from '@syncframe/spatial/ui';
import { dotLayer } from '@/lib/dot-layer';

// Operator map — consumer MapView; screen overlays on top
<TopDownRoomMap
  spatial={spatial}
  snapshot={snapshot}
  clock={clock}
  MapView={dotLayer.MapView}
  selectedScreenName={selected}
/>`}
        />
      </DocSection>

      <DocSection title="Presentation displays (kiosk)">
        <p>
          Physical monitors run a fullscreen URL with no site chrome. Pass <code className="font-mono text-sm">presentation</code> to <code className="font-mono text-sm">ChromeFreeDisplay</code>: loading and deleted states render as black (<code className="font-mono text-sm">PresentationBlank</code>), not status text. In <strong>content</strong> mode only the layer renders; in <strong>calibration</strong> mode the grid + HUD still appear.
        </p>
        <CodeBlock
          code={`// display/layout.tsx — hide site header/footer
<div data-presentation className="fixed inset-0 bg-black">…</div>

// Thin page glue: register screenName, then one spatial component
<ChromeFreeDisplay
  screenName="left"
  streamEndpoint="/api/dot/stream"
  apiBase="/api/dot"
  clockEndpoint="/api/clock"
  contentLayer={dotLayer}
  presentation
/>`}
          note="Dot: /demo/dot/display?screenName=left. Ring: /demo/ring/display?screenName=nw. Registration is app glue; rendering is entirely ChromeFreeDisplay + contentLayer."
        />
      </DocSection>

      <DocSection title="Identify flash">
        <p>
          Operator hits identify on a screen; server stores a short-lived trigger; SSE merges it into <code className="font-mono text-sm">meta.spatial.identifyTrigger</code>; matching displays flash red for 1s. Client dedupes on <code className="font-mono text-sm">trigger.at</code> so replays do not re-flash.
        </p>
        <CodeBlock
          code={`// Demo: Redis key syncframe:{namespace}:spatial:identify (EX 5s)
// Merged in buildDotDemoSnapshot() — not persisted in meta JSON

// Bundled in ChromeFreeDisplay; also importable from @syncframe/spatial/ui
<IdentifyFlash trigger={identifyTrigger} screenName={screenName} />`}
        />
      </DocSection>

      <DocSection title="Calibration workflow">
        <StepList>
          <StepItem number="01">
            Open the display URL on each monitor — e.g. <code className="font-mono text-sm">/demo/dot/display?screenName=wall-left</code> or the ring&apos;s fixed quadrants <code className="font-mono text-sm">/demo/ring/display?screenName=nw</code>. The page auto-registers the name.
          </StepItem>
          <StepItem number="02">
            On the operator page, confirm screens show online (heartbeat). Edit poses in world coordinates — each pose is the world rectangle that display maps to its viewport.
          </StepItem>
          <StepItem number="03">
            Switch to <strong>calibration</strong> mode: each display shows a test grid stretched to its pose. Align seams across monitors.
          </StepItem>
          <StepItem number="04">
            Use <strong>identify</strong> to flash a screen red when you need to match a physical monitor to a name.
          </StepItem>
          <StepItem number="05">
            Switch to <strong>content</strong> mode and start motion (dot control, ring spin, or your layer). Motion is evaluated on every client at <code className="font-mono text-sm">serverNow()</code>; only the pose crop differs per display.
          </StepItem>
        </StepList>
      </DocSection>

      <DocSection title="Site demos">
        <p>
          Two live consumers share the same spatial stack with separate Redis namespaces and content layers. Use the dot demo for free-form screen registration and bouncing motion; use the color ring demo for a fixed four-quadrant layout and scalar spin.
        </p>
      </DocSection>

      <DocSection title="Dot demo">
        <p>
          The <a href="/demo/dot" className="text-hot underline">dot demo</a> is a bouncing-circle layer on a <code className="font-mono text-sm">dot</code> anchor channel. Motion lives in <code className="font-mono text-sm">lib/dot.ts</code>; the <code className="font-mono text-sm">SpatialContentLayer</code> module is <code className="font-mono text-sm">lib/dot-layer.tsx</code> (shared <code className="font-mono text-sm">evaluateFrame</code> for map + display).
        </p>
        <CodeBlock
          code={`// dot-layer.tsx — data + consumer renderers
export const dotLayer: SpatialContentLayer = {
  id: 'dot',
  evaluateFrame: evaluateDotFrame,
  MapView: DotMapView,      // lib/dot-render.tsx — solid + image paint
  Display: DotDisplay,      // DotViewport + offset decay
};

// Motion math (no React): apps/site/lib/dot.ts`}
          note="useDotContentLayer() wires the layer for operator + display. Display omits debug labels in presentation mode."
        />
      </DocSection>

      <DocSection title="Color ring demo">
        <p>
          The <a href="/demo/ring" className="text-hot underline">color ring demo</a> is a second spatial room (<code className="font-mono text-sm">ring-demo</code>) with a 500×500 white world, four pre-seeded quadrant screens (<code className="font-mono text-sm">nw</code>, <code className="font-mono text-sm">ne</code>, <code className="font-mono text-sm">sw</code>, <code className="font-mono text-sm">se</code>), and a scalar <code className="font-mono text-sm">ring-spin</code> anchor driving CCW rotation. Motion lives in <code className="font-mono text-sm">lib/ring.ts</code>; the content layer is <code className="font-mono text-sm">lib/ring-layer.tsx</code> (<code className="font-mono text-sm">useRingContentLayer()</code> adds client-side spin smoothing).
        </p>
        <CodeBlock
          code={`// ring-layer.tsx — twelve petals from one evaluateFrame
export const ringLayer: SpatialContentLayer = {
  id: 'ring',
  evaluateFrame: evaluateRingFrame,
  MapView: RingMapView,     // lib/ring-render.tsx
  Display: RingViewport,
};

// Operator: POST /api/ring/spin { action: 'start' | 'pause' }
// Displays: /demo/ring/display?screenName=nw`}
          note="Identify-only operator — poses are fixed at initial meta. Separate from dot-demo; no shared Redis state."
        />
      </DocSection>

      <DocSection title="Snapshot shape on the wire">
        <CodeBlock
          code={`{
  "anchors": {
    "dot": {
      "at": 1730000000000,
      "value": { "x": 120, "y": 80 },
      "motion": { "kind": "linear2dBouncing" }
    }
  },
  "meta": {
    "spatial": {
      "worldBbox": {
        "width": 1920,
        "height": 1080
      },
      "renderMode": "content",
      "contentLayerId": "dot",
      "screens": {
        "wall-left": {
          "pose": {
            "worldX": 0,
            "worldY": 0,
            "worldWidth": 960,
            "worldHeight": 1080
          },
          "createdAt": "2026-06-07T12:00:00.000Z",
          "sessions": {
            "abc123": {
              "sessionId": "abc123",
              "clientWidthPx": 1920,
              "clientHeightPx": 1080,
              "devicePixelRatio": 2,
              "lastSeenAt": "2026-06-07T12:00:10.000Z"
            }
          }
        }
      },
      "identifyTrigger": null
    }
  },
  "contentData": null
}`}
        />
      </DocSection>

      <DocSection title="Next steps">
        <ActionRow>
          <Pill href="/demo/dot" active size="xs">
            Dot demo
          </Pill>
          <Pill href="/demo/ring" size="xs">
            Color ring demo
          </Pill>
          <Pill href="/docs/core" size="xs">
            Core docs
          </Pill>
          <Pill href="/docs/redis" size="xs">
            Redis adapter
          </Pill>
        </ActionRow>
      </DocSection>
    </InteriorPageShell>
  );
}
