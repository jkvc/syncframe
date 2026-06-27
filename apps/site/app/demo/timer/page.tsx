import type { Metadata } from "next";
import InteriorPageShell from "@/components/editorial/InteriorPageShell";
import PageStampHeader from "@/components/editorial/PageStampHeader";
import DocSection, { StepItem, StepList } from "@/components/docs/DocSection";
import { ActionRow, Pill } from "@/components/site/PageChrome";
import { pageMetadata } from "@/lib/metadata";
import { TIMER_DEMO } from "@/lib/site-routes";
import { Timer } from "./timer";
import { QrCode } from "./qr-code";

export const metadata: Metadata = pageMetadata(TIMER_DEMO);

export default function TimerDemoPage() {
  return (
    <InteriorPageShell>
      <PageStampHeader
        meta={{ eyebrow: "Live demo", trailing: "Global timer" }}
        className="mb-12"
      >
        <h1 className="font-sans text-4xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Timer demo
        </h1>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex max-w-md flex-col gap-2 text-base leading-relaxed text-ink-muted">
            <p>A single global countdown, synced across every browser.</p>
            <p>
              Anyone can control it — open a second tab and watch them stay
              locked together.
            </p>
            <p>
              Or scan the QR code to open it on your phone and watch it stay in
              sync.
            </p>
          </div>
          <QrCode />
        </div>
      </PageStampHeader>

      <DocSection title="Timer">
        <Timer />
      </DocSection>

      <DocSection title="How it works">
        <StepList>
          <StepItem number="01">
            One Redis key holds the current anchor: server time, value, and
            rate. No rooms — it&apos;s a single global clock.
          </StepItem>
          <StepItem number="02">
            Every control (reset, pause/resume, speed) re-anchors on the server,
            then broadcasts the new anchor over Redis pub/sub.
          </StepItem>
          <StepItem number="03">
            Each browser syncs to server time with an NTP-style clock, then
            evaluates the anchor locally every frame — no value streaming.
          </StepItem>
          <StepItem number="04">
            Evaluation is deterministic — every client computes the same value for
            a given server moment. After clock sync, clients typically agree within
            ~30ms.
          </StepItem>
        </StepList>
      </DocSection>

      <ActionRow>
        <Pill href="/docs/core" size="xs">
          Read core docs
        </Pill>
      </ActionRow>
    </InteriorPageShell>
  );
}
