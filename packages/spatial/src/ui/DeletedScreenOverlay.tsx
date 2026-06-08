'use client';

import type { ReactNode } from 'react';

export interface DeletedScreenOverlayProps {
  screenName: string;
  children?: ReactNode;
}

export default function DeletedScreenOverlay({
  screenName,
  children,
}: DeletedScreenOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-black/95 p-8 text-center text-white">
      <div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/60">
        Screen Deleted
      </div>
      <div className="mb-2 text-2xl font-medium">
        &ldquo;{screenName}&rdquo; was removed
      </div>
      <p className="mb-6 max-w-md text-sm text-white/70">
        This screen view was deleted by the operator. Pick a different screen or register a new one.
      </p>
      {children}
    </div>
  );
}
