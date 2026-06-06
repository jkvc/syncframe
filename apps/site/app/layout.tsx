import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syncframe",
  description: "Dead-reckoning time sync for browsers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-[#1a1a1a]">
        <header className="border-b border-[#e5e5e5] px-6 py-3">
          <nav className="flex items-center justify-between max-w-6xl mx-auto">
            <Link href="/" className="font-mono font-bold text-base tracking-tight">
              SYNCFRAME
            </Link>
            <div className="flex gap-6 font-mono text-xs">
              <Link href="/docs/core" className="text-[#666] hover:text-[#1a1a1a] transition-colors">
                DOCS
              </Link>
              <Link href="/demo/core" className="text-[#666] hover:text-[#1a1a1a] transition-colors">
                DEMOS
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-[#e5e5e5] px-6 py-3">
          <div className="max-w-6xl mx-auto text-center text-[#666] text-xs font-mono">
            SYNCFRAME © 2026
          </div>
        </footer>
      </body>
    </html>
  );
}
