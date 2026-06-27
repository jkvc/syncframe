import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { DOT_DISPLAY } from "@/lib/site-routes";

export const metadata: Metadata = pageMetadata(DOT_DISPLAY);

/**
 * Presentation layout — fullscreen kiosk; site header/footer hidden via globals.css.
 */
export default function DotDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-presentation className="fixed inset-0 z-[200] overflow-hidden bg-black">
      {children}
    </div>
  );
}
