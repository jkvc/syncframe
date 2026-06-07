import CodeBlockFrame from "@/components/docs/CodeBlockFrame";
import { highlightCode } from "@/lib/shiki";

interface CodeBlockProps {
  code: string;
  lang?: "typescript" | "tsx" | "bash" | "shellscript";
  note?: React.ReactNode;
  className?: string;
}

export default async function CodeBlock({
  code,
  lang = "typescript",
  note,
  className,
}: CodeBlockProps) {
  const html = await highlightCode(code, lang);
  return (
    <CodeBlockFrame
      code={code}
      html={html}
      note={note}
      className={className}
    />
  );
}
