import InteriorPageShell from '@/components/editorial/InteriorPageShell';
import PageStampHeader from '@/components/editorial/PageStampHeader';
import DocSection, { StepItem, StepList } from '@/components/docs/DocSection';
import { ActionRow, Pill } from '@/components/site/PageChrome';
import { SpatialOperator } from './_components/SpatialOperator';

export default function SpatialDemoPage() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: 'Live demo', trailing: 'Multi-screen dot' }}
        className="mb-12"
      >
        <h1 className="font-sans text-4xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Spatial demo
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
          Register browser windows as named screens, calibrate their poses in world
          space, then watch a bouncing dot span the seams. Open{' '}
          <code className="font-mono text-sm">/demo/spatial/display?screenName=…</code>{' '}
          on each monitor.
        </p>
      </PageStampHeader>

      <DocSection title="Operator">
        <SpatialOperator />
      </DocSection>

      <DocSection title="How it works">
        <StepList>
          <StepItem number="01">
            <code className="font-mono">@syncframe/spatial</code> stores screen
            registry + poses in <code className="font-mono">meta.spatial</code> on a
            dedicated SyncServer room.
          </StepItem>
          <StepItem number="02">
            The dot position is a separate anchor channel — consumer motion lives in
            the demo, not the spatial package.
          </StepItem>
          <StepItem number="03">
            Each display renders a viewport slice of shared world coordinates; calibration
            grids align before switching to content mode.
          </StepItem>
        </StepList>
      </DocSection>

      <ActionRow>
        <Pill href="/docs/spatial" size="xs">
          Read spatial docs
        </Pill>
      </ActionRow>
    </InteriorPageShell>
  );
}
