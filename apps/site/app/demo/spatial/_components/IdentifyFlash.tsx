'use client';

import { useEffect, useRef, useState } from 'react';
import type { IdentifyTrigger } from '@syncframe/spatial/react';

interface IdentifyFlashProps {
  trigger: IdentifyTrigger | null | undefined;
  screenName: string;
}

export default function IdentifyFlash({ trigger, screenName }: IdentifyFlashProps) {
  const lastAtRef = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger || trigger.screenName !== screenName) return;
    if (trigger.at <= lastAtRef.current) return;
    lastAtRef.current = trigger.at;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(t);
  }, [trigger, screenName]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(255, 30, 30, 0.85)',
        animation: 'spatial-identify-flash 1000ms ease-out forwards',
      }}
    >
      <style jsx>{`
        @keyframes spatial-identify-flash {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
