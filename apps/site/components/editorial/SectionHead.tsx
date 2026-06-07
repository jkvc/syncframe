import { twMerge } from "tailwind-merge";

interface SectionHeadProps {
  children: React.ReactNode;
  className?: string;
}

/** Left-aligned bold uppercase section title. */
export default function SectionHead({ children, className }: SectionHeadProps) {
  return (
    <header className={twMerge("mb-6", className)}>
      <h2 className="font-sans text-2xl font-black uppercase leading-none tracking-tight text-ink sm:text-3xl">
        {children}
      </h2>
    </header>
  );
}
