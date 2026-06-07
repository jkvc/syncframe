import { twMerge } from "tailwind-merge";
import { CONTENT_MAX } from "@/lib/layout";

interface InteriorPageShellProps {
  children: React.ReactNode;
  maxWidthClassName?: string;
  className?: string;
}

export default function InteriorPageShell({
  children,
  maxWidthClassName = CONTENT_MAX,
  className,
}: InteriorPageShellProps) {
  return (
    <div
      className={twMerge(
        "min-h-screen px-5 pb-16 pt-8 text-ink sm:px-8",
        className,
      )}
    >
      <div className={twMerge("mx-auto w-full", maxWidthClassName)}>
        {children}
      </div>
    </div>
  );
}
