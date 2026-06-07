import InteriorPageShell from "@/components/editorial/InteriorPageShell";
import SectionHead from "@/components/editorial/SectionHead";
import Pill from "@/components/editorial/Pill";
import StampShell from "@/components/ui/StampShell";
import {
  LayerCard,
  StepItem,
  StepList,
} from "@/components/docs/DocSection";
import { STAMP_BLEED } from "@/lib/stamp";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <InteriorPageShell className="pt-6 sm:pt-10">
      {/* Hero */}
      <section className={`mb-14 ${STAMP_BLEED}`}>
        <StampShell variant="card" faceClassName="p-6 sm:p-10">
          <p className="caption-mono mb-4 text-hot">Protocol</p>
          <h1 className="font-sans text-[2.5rem] font-black uppercase leading-[1.02] tracking-tight text-ink sm:text-[3.25rem]">
            Sync continuous
            <br />
            state across
            <br />
            browsers
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
            {SITE.description}
          </p>
        </StampShell>
      </section>

      {/* How it works */}
      <section className="mb-14">
        <SectionHead>How it works</SectionHead>
        <StepList>
          <StepItem number="01">
            Instead of streaming position updates, broadcast rare anchors:
            timestamp + value + motion descriptor.
          </StepItem>
          <StepItem number="02">
            Every client syncs to server time using NTP-style offset estimation.
            Monotonic. Deterministic.
          </StepItem>
          <StepItem number="03">
            Given an anchor and server time, any client can compute current state
            via pure math. No network calls.
          </StepItem>
        </StepList>
      </section>

      {/* Two layers */}
      <section className="mb-14">
        <SectionHead>Two layers</SectionHead>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LayerCard
            label="Layer 1"
            title="@syncframe/core"
            description="Clock synchronization, anchor protocol, evaluators, smoother, pluggable storage. Zero runtime dependencies."
            actions={
              <>
                <Pill href="/docs/core" active size="xs">
                  Read docs
                </Pill>
                <Pill href="/demo/core" size="xs">
                  Try demo
                </Pill>
              </>
            }
          />
          <LayerCard
            label="Layer 2"
            title="@syncframe/spatial"
            description="Screen registry, world-coordinate poses, calibration UI. For multi-display setups where screens have geometric positions."
            muted
            actions={
              <span className="caption-mono inline-flex h-7 items-center border-2 border-ink bg-surface-2 px-3.5 text-ink-faint">
                Coming soon
              </span>
            }
          />
        </div>
      </section>

      {/* Use cases */}
      <section className="mb-14">
        <SectionHead>Use cases</SectionHead>
        <StampShell variant="card" bleed={false}>
          <ul className="divide-y-2 divide-rule p-5 sm:p-6">
            {[
              ["Video sync", "synchronized playback across devices"],
              ["Multi-screen installations", "panoramic image flows across N monitors"],
              ["Collaborative canvas", "distributed 2D drawing surface"],
              ["Event timers", "identical countdowns across every display"],
            ].map(([title, desc]) => (
              <li
                key={title}
                className="flex items-start gap-3 py-3 text-[14px] leading-relaxed first:pt-0 last:pb-0"
              >
                <span className="mt-[0.35em] shrink-0 font-sans text-[14px] font-bold leading-none text-hot">
                  →
                </span>
                <span className="text-ink-muted">
                  <strong className="text-ink">{title}</strong> — {desc}
                </span>
              </li>
            ))}
          </ul>
        </StampShell>
      </section>

      {/* Pitch */}
      <section className="text-center">
        <p className="mx-auto max-w-lg text-base leading-relaxed text-ink-muted">
          As long as each device has a browser and internet connection, you can
          sync continuous state across all of them.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Pill href="/docs/core" size="sm">
            Get started
          </Pill>
        </div>
      </section>
    </InteriorPageShell>
  );
}
