'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import StampShell from '@/components/ui/StampShell';

export function QrCode() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  return (
    <StampShell variant="control" bleed={false} className="shrink-0">
      <div className="p-2 leading-none">
        {url ? (
          <QRCodeSVG value={url} size={96} bgColor="#ffffff" fgColor="#0c1222" />
        ) : (
          <div className="h-24 w-24" aria-hidden />
        )}
      </div>
    </StampShell>
  );
}
