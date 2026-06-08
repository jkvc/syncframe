"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { CONTROL_SIZE, type ControlSize } from "@/components/ui/controlSize";
import {
  STAMP_CARD_SHADOW,
  STAMP_CONTROL_LIFT,
  STAMP_CONTROL_SHADOW,
  STAMP_FACE,
} from "@/lib/stamp";

export interface NavMenuItem {
  href: string;
  label: string;
}

interface NavMenuProps {
  label: string;
  items: readonly NavMenuItem[];
  pathname: string;
  menuActive: (pathname: string) => boolean;
  size?: ControlSize;
}

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavMenu({
  label,
  items,
  pathname,
  menuActive,
  size = "xs",
}: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const hide = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 100);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [open]);

  const active = menuActive(pathname);
  const dims = `${CONTROL_SIZE[size].height} ${CONTROL_SIZE[size].pillPaddingX}`;

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide();
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className="group caption-mono inline-flex cursor-pointer"
      >
        <span
          className={twMerge(
            STAMP_FACE,
            STAMP_CONTROL_SHADOW,
            !active && STAMP_CONTROL_LIFT,
            "inline-flex items-center gap-1.5",
            active
              ? "border-ink bg-ink text-surface"
              : "border-ink bg-surface text-ink-muted",
            dims,
          )}
        >
          {label}
          <span className="text-[10px] opacity-70" aria-hidden>
            ▾
          </span>
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 min-w-[9rem] pt-1"
        >
          <div
            className={twMerge(
              STAMP_FACE,
              STAMP_CARD_SHADOW,
              "bg-surface py-1",
            )}
          >
            {items.map((item) => {
              const itemActive = isItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={twMerge(
                    "caption-mono block px-3.5 py-2 text-xs uppercase transition-colors",
                    itemActive
                      ? "bg-ink text-surface"
                      : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
