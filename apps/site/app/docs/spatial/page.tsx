import InteriorPageShell from '@/components/editorial/InteriorPageShell';
import PageStampHeader from '@/components/editorial/PageStampHeader';
import DocSection, { StepItem, StepList } from '@/components/docs/DocSection';
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
          Screen registry, world-coordinate poses, and presence on top of{' '}
          <code className="font-mono text-sm">@syncframe/core</code>. The package is
          headless — calibration UI and content layers live in your app.
        </p>
      </PageStampHeader>

      <DocSection title="What spatial owns">
        <StepList>
          <StepItem number="01">
            <code className="font-mono">ScreenPose</code> — which slice of world space
            each display renders.
          </StepItem>
          <StepItem number="02">
            <code className="font-mono">meta.spatial</code> — registry, sessions,
            world bbox, render mode (via <code className="font-mono">SpatialServer</code>).
          </StepItem>
          <StepItem number="03">
            Pure coord math — <code className="font-mono">worldToScreen</code>,{' '}
            <code className="font-mono">sliceWorldRegion</code>.
          </StepItem>
          <StepItem number="04">
            React hooks — <code className="font-mono">useSpatialSnapshot</code>,{' '}
            <code className="font-mono">useSelfScreen</code>,{' '}
            <code className="font-mono">useDisplaySurface</code>.
          </StepItem>
        </StepList>
      </DocSection>

      <DocSection title="What consumers own">
        <StepList>
          <StepItem number="01">
            Motion evaluators and anchor channels (e.g. bouncing dot).
          </StepItem>
          <StepItem number="02">
            Calibration grid, room map, pose editor UI.
          </StepItem>
          <StepItem number="03">
            API routes — thin wrappers over <code className="font-mono">SpatialServer</code>{' '}
            + <code className="font-mono">SyncServer</code>.
          </StepItem>
        </StepList>
      </DocSection>

      <DocSection title="Install workflow">
        <StepList>
          <StepItem number="01">
            Register each display with a stable <code className="font-mono">screenName</code>.
          </StepItem>
          <StepItem number="02">
            Set poses in world coordinates; use calibration mode to align seams.
          </StepItem>
          <StepItem number="03">
            Switch to content mode; render your layer cropped to each pose.
          </StepItem>
        </StepList>
      </DocSection>

      <ActionRow>
        <Pill href="/demo/spatial" size="xs">
          Try the spatial demo
        </Pill>
        <Pill href="/docs/core" size="xs">
          Core docs
        </Pill>
      </ActionRow>
    </InteriorPageShell>
  );
}
