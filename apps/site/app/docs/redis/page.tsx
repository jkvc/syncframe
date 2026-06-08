import InteriorPageShell from "@/components/editorial/InteriorPageShell";
import PageStampHeader from "@/components/editorial/PageStampHeader";
import CodeBlock from "@/components/docs/CodeBlock";
import DocSection from "@/components/docs/DocSection";
import { ActionRow, Pill } from "@/components/site/PageChrome";

export default function RedisDocsPage() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: "Adapter", trailing: "@syncframe/redis" }}
        title="@syncframe/redis"
        subtitle="Redis-backed SyncStore and SyncTransport for production deployments."
        className="mb-12"
      />

      <DocSection title="Overview">
        <p>
          Pluggable adapters so <code className="font-mono text-sm">SyncServer</code> can
          persist anchors and fan out snapshots across processes and serverless instances.
          Connection-injected — you supply <code className="font-mono text-sm">ioredis</code>{" "}
          clients; auth and pooling stay in your app.
        </p>
        <CodeBlock code="pnpm add @syncframe/redis @syncframe/core ioredis" lang="bash" />
      </DocSection>

      <DocSection title="Wire-up">
        <CodeBlock
          code={`import Redis from 'ioredis';
import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';

const redis = new Redis(process.env.REDIS_URL!);

const server = new SyncServer({
  store: new RedisStore({ redis, prefix: 'syncframe' }),
  transport: new RedisTransport({
    redis,
    createSubscriber: () => new Redis(process.env.REDIS_URL!),
    prefix: 'syncframe',
  }),
  namespace: 'my-app',
});`}
          note="Subscriber connections cannot issue other commands — create a fresh client per subscription."
        />
      </DocSection>

      <DocSection title="Key layout">
        <p>
          Keys and pub/sub channels live under <code className="font-mono text-sm">{'{prefix}:{namespace}:…'}</code>.
          Use a distinct <code className="font-mono text-sm">prefix</code> when sharing Redis with
          other apps (e.g. <code className="font-mono text-sm">wp:</code> for watchparty).
        </p>
      </DocSection>

      <DocSection title="Next steps">
        <ActionRow>
          <Pill href="/docs/core" size="xs">
            Core docs
          </Pill>
          <Pill href="/demo/core" active size="xs">
            Timer demo
          </Pill>
        </ActionRow>
      </DocSection>
    </InteriorPageShell>
  );
}
