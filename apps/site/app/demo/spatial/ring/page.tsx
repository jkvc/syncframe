import InteriorPageShell from '@/components/editorial/InteriorPageShell';
import PageStampHeader from '@/components/editorial/PageStampHeader';
import DocSection, { StepItem, StepList } from '@/components/docs/DocSection';
import { ActionRow, Pill } from '@/components/site/PageChrome';
import { RingOperator } from './_components/RingOperator';

export default function RingDemoPage() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: 'Live demo', trailing: 'Color ring' }}
        className="mb-12"
      >
        <h1 className="font-sans text-4xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Color ring
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
          Twelve colored circles orbit a 500×500 world and spin counter-clockwise.
          Four quadrant displays are pre-seeded — open{' '}
          <code className="font-mono text-sm">
            /demo/spatial/ring/display?screenName=nw
          </code>{' '}
          (or ne, sw, se) on each monitor.
        </p>
      </PageStampHeader>

      <DocSection title="Operator">
        <RingOperator />
      </DocSection>

      <DocSection title="How it works">
        <StepList>
          <StepItem number="01">
            A scalar anchor drives continuous spin;{' '}
            <code className="font-mono">evaluateFrame</code> places twelve petal
            circles on the orbit each tick.
          </StepItem>
          <StepItem number="02">
            Screens <code className="font-mono">nw</code>,{' '}
            <code className="font-mono">ne</code>, <code className="font-mono">sw</code>,{' '}
            <code className="font-mono">se</code> are fixed 250×250 quadrants — no pose
            editing in this demo.
          </StepItem>
          <StepItem number="03">
            Uses a separate SyncServer room from the dot demo; shares only site UI
            chrome and <code className="font-mono">@syncframe/spatial</code> kit.
          </StepItem>
        </StepList>
      </DocSection>

      <ActionRow>
        <Pill href="/docs/spatial" size="xs">
          Read spatial docs
        </Pill>
        <Pill href="/demo/spatial" size="xs">
          Dot demo
        </Pill>
      </ActionRow>
    </InteriorPageShell>
  );
}
