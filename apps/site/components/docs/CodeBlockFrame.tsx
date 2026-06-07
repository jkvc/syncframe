"use client";

import { useCallback, useState } from "react";
import StampShell from "@/components/ui/StampShell";
import {
  STAMP_CONTROL_LIFT,
  STAMP_CONTROL_SHADOW,
  STAMP_FACE,
} from "@/lib/stamp";
import { twMerge } from "tailwind-merge";

interface CodeBlockFrameProps {
  code: string;
  html: string;
  note?: React.ReactNode;
  className?: string;
}

function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function CodeBlockFrame({
  code,
  html,
  note,
  className,
}: CodeBlockFrameProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [code]);

  return (
    <StampShell variant="control" bleed={false} className="mb-3 block w-full">
      <div className="group/code relative bg-surface">
        <button
          type="button"
          onClick={copy}
          title={copied ? "Copied" : "Copy code"}
          aria-label={copied ? "Copied" : "Copy code"}
          className={twMerge(
            "group absolute right-3 top-3 z-10 cursor-pointer transition-opacity duration-150",
            "opacity-100 focus-visible:opacity-100",
            "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/code:opacity-100",
            copied && "[@media(hover:hover)]:opacity-100",
          )}
        >
          <span
            className={twMerge(
              STAMP_FACE,
              STAMP_CONTROL_SHADOW,
              !copied && STAMP_CONTROL_LIFT,
              "inline-flex h-7 w-7 items-center justify-center",
              copied
                ? "bg-ink text-surface border-ink"
                : "bg-surface text-ink-muted border-ink",
            )}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </span>
        </button>
        <div
          className={twMerge(
            "code-block w-full overflow-x-auto p-4 font-mono text-[12px] leading-relaxed sm:p-5 sm:text-[13px]",
            "[&_.shiki]:!bg-transparent [&_.shiki]:m-0 [&_.shiki]:bg-transparent [&_.shiki]:p-0",
            "[&_.shiki_code]:font-mono [&_.shiki_code]:text-[12px] [&_.shiki_code]:leading-relaxed sm:[&_.shiki_code]:text-[13px]",
            className,
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {note && (
          <div className="hairline px-4 py-3 text-[14px] leading-relaxed text-ink-muted sm:px-5 sm:py-4">
            {note}
          </div>
        )}
      </div>
    </StampShell>
  );
}
