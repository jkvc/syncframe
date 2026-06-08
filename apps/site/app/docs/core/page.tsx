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

      <DocSection title="Pluggable storage">
        <p>
          Core is backend-agnostic. Ships with in-memory store. Bring your own
          database or cache.
        </p>
        <CodeBlock
          code={`class SyncServer {
  constructor({ store, transport, namespace?: string });
  getAnchor(channelId): Promise<Anchor | null>;
  setAnchor(channelId, anchor): Promise<void>;
  buildSnapshot(): Promise<CoreSnapshot>;
  // ... more methods
}`}
          note="Bind one namespace per SyncServer instance. Customers needing multiple partitions run multiple servers or implement SyncStore directly."
        />
      </DocSection>

      <DocSection title="Next steps">
        <ActionRow>
          <Pill href="/demo/core" active size="xs">
            Try the demo
          </Pill>
        </ActionRow>
      </DocSection>
    </InteriorPageShell>
  );
}
