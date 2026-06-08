'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChromeFreeDisplay, PresentationBlank } from '@syncframe/spatial/ui';
import { isValidScreenName } from '@syncframe/spatial/react';
import { RING_API_BASE, RING_STREAM_ENDPOINT } from '@/lib/ring-config';
import { useRingContentLayer } from '@/lib/ring-layer';

export function RingDisplay() {
  const contentLayer = useRingContentLayer();
  const params = useSearchParams();
  const screenName = params.get('screenName')?.trim() ?? '';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!screenName || ready) return;
    if (!isValidScreenName(screenName)) return;
    setReady(true);
  }, [screenName, ready]);

  if (!screenName || !isValidScreenName(screenName) || !ready) {
    return <PresentationBlank />;
  }

  return (
    <ChromeFreeDisplay
      screenName={screenName}
      streamEndpoint={RING_STREAM_ENDPOINT}
      apiBase={RING_API_BASE}
      clockEndpoint="/api/clock"
      contentLayer={contentLayer}
      heartbeat
      presentation
    />
  );
}
