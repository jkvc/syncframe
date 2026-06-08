import InteriorPageShell from '@/components/editorial/InteriorPageShell';
import PageStampHeader from '@/components/editorial/PageStampHeader';
import CodeBlock from '@/components/docs/CodeBlock';
import DocSection, { RefList, RefRow, StepItem, StepList } from '@/components/docs/DocSection';
import { ActionRow, Pill } from '@/components/site/PageChrome';

export default function SpatialDocsPage() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: 'Layer 2', trailing: '@syncframe/spatial' }}
        className="mb-12"
      >
        <h1 className="font-sans text-4xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Spatial
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
          Multi-display calibration on top of <code className="font-mono text-sm">@syncframe/core</code>. Register screens, assign each a world-coordinate viewport, track presence, and render shared content cropped per display. Optional <code className="font-mono text-sm">/ui</code> ships display chrome; content layers (dot, pano) stay in your app.
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
          Bind one <code className="font-mono text-sm">SyncServer</code> namespace for your spatial app (the site demo uses <code className="font-mono text-sm">spatial-demo</code>). <code className="font-mono text-sm">SpatialServer</code> read-modify-writes the <code className="font-mono text-sm">spatial</code> key under that server&apos;s meta.
        </p>
        <CodeBlock
          code={`import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';
import { SpatialServer, ensureScreen } from '@syncframe/spatial/server';

const sync = new SyncServer({
  store: new RedisStore({ redis }),
  transport: new RedisTransport({ redis, createSubscriber }),
  namespace: 'spatial-demo',
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
  streamEndpoint: '/api/spatial/stream',
});

// Display — registry + pose + heartbeat + identify
import { useDisplaySurface } from '@syncframe/spatial/react';

const { pose, isCalibration, isContent, deleted, identifyTrigger } = useDisplaySurface({
  screenName: 'wall-left',
  streamEndpoint: '/api/spatial/stream',
  apiBase: '/api/spatial',
  heartbeat: true,
});

// Content motion — separate core anchor channel
import { useAnchor } from '@syncframe/core/react';

const dotAnchor = useAnchor('dot', '/api/spatial/stream');`}
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
          The site demo implements thin Next.js routes under <code className="font-mono text-sm">/api/spatial/*</code>. Each mutating route calls <code className="font-mono text-sm">spatial.apply(...)</code> then <code className="font-mono text-sm">spatial.publish()</code>. The stream route merges identify triggers and prunes stale sessions before fan-out.
        </p>
        <RefList>
          <RefRow label="GET /stream" note="SSE CoreSnapshot; : open preamble; ensureAnchor for content channel" />
          <RefRow label="POST /screens/register" note="{ name } — idempotent, validates screen name" />
          <RefRow label="PUT /screens/update-pose" note="{ name, pose } — normalizeScreenPose validates W/H &gt; 0" />
          <RefRow label="DELETE /screens/delete" note="?name= — cascades sessions in meta" />
          <RefRow label="POST /heartbeat" note="Upserts session on screen entry" />
          <RefRow label="POST /render-mode" note="{ mode: 'calibration' | 'content' }" />
          <RefRow label="POST /identify" note="{ name } — transient trigger (demo: separate Redis key, 5s TTL)" />
          <RefRow label="POST /dot" note="{ action: 'start' | 'pause' | 'reset' } — consumer-owned anchor" />
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
          WYSIWYG: map and wall share the same <code className="font-mono text-sm">evaluateFrame</code> and the same paint helpers. A scrolling pano returns one wide image rect with scroll offset in <code className="font-mono text-sm">x</code>; projection crops it per screen. The dot demo uses solid rects in <code className="font-mono text-sm">lib/dot-render.tsx</code>.
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
  streamEndpoint="/api/spatial/stream"
  apiBase="/api/spatial"
  clockEndpoint="/api/clock"
  contentLayer={dotLayer}
  presentation
/>`}
          note="Site demo: /demo/spatial/display?screenName=left. Registration is app glue; rendering is entirely ChromeFreeDisplay + contentLayer."
        />
      </DocSection>

      <DocSection title="Identify flash">
        <p>
          Operator hits identify on a screen; server stores a short-lived trigger; SSE merges it into <code className="font-mono text-sm">meta.spatial.identifyTrigger</code>; matching displays flash red for 1s. Client dedupes on <code className="font-mono text-sm">trigger.at</code> so replays do not re-flash.
        </p>
        <CodeBlock
          code={`// Demo: Redis key syncframe:{namespace}:spatial:identify (EX 5s)
// Merged in buildSpatialDemoSnapshot() — not persisted in meta JSON

// Bundled in ChromeFreeDisplay; also importable from @syncframe/spatial/ui
<IdentifyFlash trigger={identifyTrigger} screenName={screenName} />`}
        />
      </DocSection>

      <DocSection title="Calibration workflow">
        <StepList>
          <StepItem number="01">
            Open the display URL on each monitor: <code className="font-mono text-sm">/demo/spatial/display?screenName=wall-left</code>. The page auto-registers the name.
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
            Switch to <strong>content</strong> mode and start the dot (or your layer). Motion is evaluated on every client at <code className="font-mono text-sm">serverNow()</code>; only the pose crop differs per display.
          </StepItem>
        </StepList>
      </DocSection>

      <DocSection title="Dot demo (reference consumer)">
        <p>
          The <a href="/demo/spatial" className="text-hot underline">spatial demo</a> is a bouncing-circle layer on a <code className="font-mono text-sm">dot</code> anchor channel. Motion lives in <code className="font-mono text-sm">lib/dot.ts</code>; the <code className="font-mono text-sm">SpatialContentLayer</code> module is <code className="font-mono text-sm">lib/dot-layer.tsx</code> (shared <code className="font-mono text-sm">evaluateFrame</code> for map + display).
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
          note="Registry: lib/spatial-content-registry.ts. Display omits debug labels in presentation mode."
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
          <Pill href="/demo/spatial" active size="xs">
            Dot demo
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
