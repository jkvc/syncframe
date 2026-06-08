"use client";

import { usePathname } from "next/navigation";
import Pill from "@/components/editorial/Pill";
import ContentColumn from "@/components/site/ContentColumn";
import Wordmark from "@/components/site/Wordmark";

const NAV = [
  { href: "/docs/core", label: "Docs" },
  { href: "/demo/core", label: "Demos" },
  { href: "/docs/spatial", label: "Spatial" },
  { href: "/demo/spatial", label: "Spatial demo" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="px-5 py-4 sm:px-8">
      <ContentColumn>
        <nav className="flex items-center justify-between gap-4">
        <Wordmark />
        <div className="flex flex-wrap items-center gap-2">
          {NAV.map(({ href, label }) => {
            const section = href.split("/")[1];
            return (
              <Pill
                key={href}
                href={href}
                active={pathname.startsWith(`/${section}`)}
                size="xs"
              >
                {label}
              </Pill>
            );
          })}
        </div>
        </nav>
      </ContentColumn>
    </header>
  );
}
