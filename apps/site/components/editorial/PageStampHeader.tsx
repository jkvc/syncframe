import StampShell from "@/components/ui/StampShell";
import KindStamp from "@/components/editorial/KindStamp";
import { twMerge } from "tailwind-merge";

export interface PageStampMeta {
  eyebrow: string;
  trailing?: string;
}

interface PageStampHeaderProps {
  meta: PageStampMeta;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  faceClassName?: string;
}

export default function PageStampHeader({
  meta,
  title,
  subtitle,
  children,
  trailing,
  className,
  faceClassName,
}: PageStampHeaderProps) {
  return (
    <StampShell
      variant="card"
      bleed={false}
      className={className}
      faceClassName={twMerge("p-6 sm:p-8", faceClassName)}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <KindStamp label={meta.eyebrow} />
        {meta.trailing && (
          <span className="caption-mono shrink-0 text-right text-ink-faint">
            {meta.trailing}
          </span>
        )}
      </div>

      {children ?? (
        <>
          {title && (
            <h1 className="font-sans text-4xl font-black uppercase leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
              {subtitle}
            </p>
          )}
        </>
      )}

      {trailing && <div className="mt-4">{trailing}</div>}
    </StampShell>
  );
}
