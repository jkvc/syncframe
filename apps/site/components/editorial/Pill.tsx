"use client";

import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { CONTROL_SIZE, type ControlSize } from "@/components/ui/controlSize";
import {
  STAMP_CONTROL_LIFT,
  STAMP_CONTROL_SHADOW,
  STAMP_FACE,
} from "@/lib/stamp";

interface BaseProps {
  children: React.ReactNode;
  active?: boolean;
  size?: ControlSize;
  title?: string;
  className?: string;
  disabled?: boolean;
}

type ButtonVariant = BaseProps & {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  href?: never;
};

type LinkVariant = BaseProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type Props = ButtonVariant | LinkVariant;

const ROOT = "group caption-mono inline-flex cursor-pointer";

function faceClasses({
  active,
  size,
  extra,
}: {
  active: boolean;
  size: ControlSize;
  extra?: string;
}): string {
  const state = active
    ? "bg-ink text-surface border-ink"
    : "bg-surface border-ink text-ink-muted";
  const shadow = STAMP_CONTROL_SHADOW;
  const lift = !active ? STAMP_CONTROL_LIFT : "";
  const dims = `${CONTROL_SIZE[size].height} ${CONTROL_SIZE[size].pillPaddingX}`;
  return twMerge(
    STAMP_FACE,
    shadow,
    lift,
    "inline-flex items-center gap-1.5",
    state,
    dims,
    extra,
  );
}

export default function Pill(props: Props) {
  const active = props.active ?? false;
  const size = props.size ?? "xs";
  const face = faceClasses({ active, size, extra: props.className });

  if ("href" in props && typeof props.href === "string") {
    return (
      <Link href={props.href} title={props.title} className={ROOT}>
        <span className={face}>{props.children}</span>
      </Link>
    );
  }

  const btn = props as ButtonVariant;
  const disabled = btn.disabled ?? false;
  return (
    <button
      type={btn.type ?? "button"}
      onClick={btn.onClick}
      disabled={disabled}
      title={btn.title}
      className={twMerge(ROOT, disabled && "cursor-not-allowed opacity-40")}
    >
      <span className={face}>{props.children}</span>
    </button>
  );
}
