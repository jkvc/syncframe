import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { RING_DISPLAY } from "@/lib/site-routes";

export const metadata: Metadata = pageMetadata(RING_DISPLAY);

/**
 * Presentation layout — fullscreen kiosk; site header/footer hidden via globals.css.
 */
export default function RingDisplayLayout({
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
