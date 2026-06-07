import Pill from "@/components/editorial/Pill";

interface ActionRowProps {
  children: React.ReactNode;
}

export function ActionRow({ children }: ActionRowProps) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export { Pill };
