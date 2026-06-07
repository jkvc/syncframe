import { twMerge } from "tailwind-merge";

export const KIND_STAMP_CLASS =
  "inline-flex items-center gap-1 border border-ink bg-surface-2 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-hot";

interface KindStampProps {
  label: string;
  className?: string;
}

export default function KindStamp({ label, className }: KindStampProps) {
  return <span className={twMerge(KIND_STAMP_CLASS, className)}>{label}</span>;
}
