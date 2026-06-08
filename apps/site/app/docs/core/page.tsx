import InteriorPageShell from "@/components/editorial/InteriorPageShell";
import PageStampHeader from "@/components/editorial/PageStampHeader";
import CodeBlock from "@/components/docs/CodeBlock";
import DocSection, { RefList, RefRow } from "@/components/docs/DocSection";
import { ActionRow, Pill } from "@/components/site/PageChrome";

export default function CoreDocs() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: "Layer 1" }}
        title="@syncframe/core"
        subtitle="Minimum protocol for deterministic state extrapolation."
        className="mb-12"
      />

      <DocSection title="Overview">
        <p>
          Core provides the foundational sync protocol: clock synchronization,
          anchors, evaluators, smoother, and pluggable storage/transport.
        </p>
        <CodeBlock code="pnpm add @syncframe/core" lang="bash" />
      </DocSection>

      <DocSection title="Anchor">
        <p>
          An anchor describes deterministic state at a server time. Given an
          anchor and server time, any client can evaluate the current value.
        </p>
        <CodeBlock
          code={`// Anchor<T, M>
interface Anchor<T, M> {
  at: number;        // server timestamp
  value: T;          // value at time 'at'
  motion: M;         // motion descriptor
}`}
        />
      </DocSection>

      <DocSection title="Evaluator">
        <p>
          Pure function: (anchor, serverTime) → current value. Same inputs always
          produce the same output. Deterministic across all clients.
        </p>
        <CodeBlock
          code={`// evaluateScalar
function evaluateScalar(
  anchor: Anchor<number, ScalarMotion>,
  serverTimeMs: number
): number`}
          note="Returns: value + (serverTimeMs - anchor.at) × motion.ratePerMs"
        />
      </DocSection>

      <DocSection title="Scalar motion">
        <p>
          Core ships with scalar motion: a number that changes at a constant
          rate per millisecond. Consumers define their own motion shapes for
          complex trajectories.
        </p>
        <CodeBlock
          code={`interface ScalarMotion {
  kind: 'scalar';
  ratePerMs: number;  // units per millisecond
}`}
        />
        <RefList>
          <RefRow label="ratePerMs: 0.001" note="Video at 1x speed" />
          <RefRow label="ratePerMs: 0" note="Paused state" />
          <RefRow label="ratePerMs: -0.001" note="Countdown timer" />
        </RefList>
      </DocSection>

      <DocSection title="Smoother">
        <p>
          Exponential chase interpolation hides network jitter. Tracks evaluated
          value smoothly, snaps on large discontinuities (seek, pause).
        </p>
        <CodeBlock
          code={`function smoothStep(
  current: number,
  target: number,
  dt: number,
  options?: SmootherOptions
): number`}
        />
      </DocSection>

      <DocSection title="SyncServer">
        <p>
          Server-side entry point: anchor CRUD, meta patches, snapshot build, and
          pub/sub fan-out. Each instance is bound to one <code className="font-mono text-sm">namespace</code> at construction (default <code className="font-mono text-sm">default</code>). Need multiple isolated scopes? Run multiple <code className="font-mono text-sm">SyncServer</code> instances over a shared store.
        </p>
        <CodeBlock
          code={`import { SyncServer, InMemoryStore, EventEmitterTransport } from '@syncframe/core/server';

const server = new SyncServer({
  store: new InMemoryStore(),
  transport: new EventEmitterTransport(),
  namespace: 'timer',
});

await server.setAnchor('timer', {
  at: server.clockProbe(),
  value: 60,
  motion: { kind: 'scalar', ratePerMs: -0.001 },
});
await server.publishUpdate();`}
        />
        <CodeBlock
          code={`// SSE routes: repair channel registry before buildSnapshot()
await server.ensureAnchor('timer', () => defaultAnchor(Date.now()));
const snapshot = await server.buildSnapshot();`}
          note="ensureAnchor re-registers the channel set so listAnchors matches getAnchor — important for snapshot streams."
        />
      </DocSection>

      <DocSection title="React hooks">
        <p>
          Client entry point. Hooks subscribe to an SSE endpoint that emits{' '}
          <code className="font-mono text-sm">CoreSnapshot</code> JSON. Multiple
          hooks on the same page share one <code className="font-mono text-sm">EventSource</code> per stream URL.
        </p>
        <CodeBlock
          code={`import { useServerClock, useAnchor } from '@syncframe/core/react';
import { evaluateScalar } from '@syncframe/core/server';

const clock = useServerClock('/api/clock');
const anchor = useAnchor<number>('timer', '/api/timer/stream');

// In a rAF loop:
const value = anchor
  ? evaluateScalar(anchor, clock.serverNow())
  : null;`}
          note="No roomId on hooks — partition scope is chosen server-side when the stream route wires SyncServer."
        />
      </DocSection>

      <DocSection title="Pluggable storage">
        <p>
          Core is backend-agnostic. Ships with in-memory defaults;{' '}
          <code className="font-mono text-sm">@syncframe/redis</code> provides
          production store + transport. Implement <code className="font-mono text-sm">SyncStore</code> for other backends — the low-level interface still takes an explicit namespace partition key if you use the store directly.
        </p>
        <ActionRow>
          <Pill href="/docs/redis" size="xs">
            Redis adapter docs
          </Pill>
        </ActionRow>
      </DocSection>

      <DocSection title="Next steps">
        <ActionRow>
          <Pill href="/docs/redis" size="xs">
            Redis adapter
          </Pill>
          <Pill href="/demo/timer" active size="xs">
            Timer demo
          </Pill>
        </ActionRow>
      </DocSection>
    </InteriorPageShell>
  );
}
