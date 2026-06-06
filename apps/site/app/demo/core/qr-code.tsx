'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from '../demo.module.css';

// Encodes the current page URL so a phone scanning it lands on the same global
// timer and sees it synced in real time. Rendered client-side because the URL
// is only known in the browser.
export function QrCode() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  return (
    <div className={styles.qrCode}>
      {url ? (
        <QRCodeSVG value={url} size={96} bgColor="#ffffff" fgColor="#1a1a1a" />
      ) : (
        <div style={{ width: 96, height: 96 }} aria-hidden />
      )}
    </div>
  );
}
