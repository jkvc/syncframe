"use client";

import { usePathname } from "next/navigation";
import ContentColumn from "@/components/site/ContentColumn";
import NavMenu from "@/components/site/NavMenu";
import Wordmark from "@/components/site/Wordmark";

const DOC_ITEMS = [
  { href: "/docs/core", label: "core" },
  { href: "/docs/redis", label: "redis" },
  { href: "/docs/spatial", label: "spatial" },
] as const;

const DEMO_ITEMS = [
  { href: "/demo/core", label: "timer" },
  { href: "/demo/spatial", label: "dot" },
  { href: "/demo/spatial/ring", label: "color ring" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="px-5 py-4 sm:px-8">
      <ContentColumn>
        <nav className="flex items-center justify-between gap-4">
          <Wordmark />
          <div className="flex items-center gap-2">
            <NavMenu
              label="doc"
              items={DOC_ITEMS}
              pathname={pathname}
              menuActive={(p) => p.startsWith("/docs")}
            />
            <NavMenu
              label="demo"
              items={DEMO_ITEMS}
              pathname={pathname}
              menuActive={(p) => p.startsWith("/demo")}
            />
          </div>
        </nav>
      </ContentColumn>
    </header>
  );
}
