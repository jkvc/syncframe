import SectionHead from "@/components/editorial/SectionHead";
import StampShell from "@/components/ui/StampShell";
import { twMerge } from "tailwind-merge";

interface DocSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function DocSection({ title, children, className }: DocSectionProps) {
  return (
    <section className={twMerge("mb-10", className)}>
      <SectionHead className="mb-5">{title}</SectionHead>
      <div className="prose-doc flex flex-col gap-3">{children}</div>
    </section>
  );
}

interface RefRowProps {
  label: string;
  note: string;
}

/** Compact reference rows — one stamped panel, aligned label column. */
export function RefList({ children }: { children: React.ReactNode }) {
  return (
    <StampShell variant="control" bleed={false} className="block">
      <div className="divide-y-2 divide-rule">{children}</div>
    </StampShell>
  );
}

export function RefRow({ label, note }: RefRowProps) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:items-baseline sm:gap-6 sm:py-3.5">
      <code className="font-mono text-[12px] font-semibold leading-snug text-hot">
        {label}
      </code>
      <span className="text-[13px] leading-snug text-ink-muted">{note}</span>
    </div>
  );
}

interface StepItemProps {
  number: string;
  children: React.ReactNode;
}

export function StepItem({ number, children }: StepItemProps) {
  return (
    <div className="flex items-start gap-3 text-[14px] leading-relaxed text-ink-muted">
      <span className="mt-[0.35em] shrink-0 font-mono text-[12px] font-bold leading-none text-hot">
        {number}
      </span>
      <p>{children}</p>
    </div>
  );
}

export function StepList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

interface LayerCardProps {
  label: string;
  title: string;
  description: string;
  muted?: boolean;
  actions?: React.ReactNode;
}

export function LayerCard({
  label,
  title,
  description,
  muted = false,
  actions,
}: LayerCardProps) {
  return (
    <StampShell variant="card" bleed={false} interactive className="group block h-full">
      <div className="flex h-full flex-col p-5 sm:p-6">
        <span
          className={twMerge(
            "caption-mono mb-2",
            muted ? "text-ink-faint" : "text-hot",
          )}
        >
          {label}
        </span>
        <h3 className="font-sans text-lg font-extrabold uppercase tracking-tight text-ink">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-muted">
          {description}
        </p>
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </StampShell>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-2 border-dashed border-rule bg-surface px-8 py-12 text-center">
      <p className="caption-mono text-ink-faint">{title}</p>
      {subtitle && (
        <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
      )}
    </div>
  );
}
