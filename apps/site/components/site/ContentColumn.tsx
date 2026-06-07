import { twMerge } from "tailwind-merge";
import { CONTENT_MAX } from "@/lib/layout";

interface ContentColumnProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContentColumn({
  children,
  className,
}: ContentColumnProps) {
  return (
    <div className={twMerge("mx-auto w-full", CONTENT_MAX, className)}>
      {children}
    </div>
  );
}
