'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChromeFreeDisplay, PresentationBlank } from '@syncframe/spatial/ui';
import { isValidScreenName } from '@syncframe/spatial/react';
import {
  SPATIAL_API_BASE,
  SPATIAL_STREAM_ENDPOINT,
} from '@/lib/spatial-config';
import { useDotContentLayer } from '@/lib/dot-layer';

export function SpatialDisplay() {
  const contentLayer = useDotContentLayer();
  const params = useSearchParams();
  const screenName = params.get('screenName')?.trim() ?? '';
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!screenName || registered) return;
    if (!isValidScreenName(screenName)) return;

    void fetch(`${SPATIAL_API_BASE}/screens/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: screenName }),
    }).then((res) => {
      if (res.ok) setRegistered(true);
    });
  }, [screenName, registered]);

  if (!screenName || !isValidScreenName(screenName) || !registered) {
    return <PresentationBlank />;
  }

  return (
    <ChromeFreeDisplay
      screenName={screenName}
      streamEndpoint={SPATIAL_STREAM_ENDPOINT}
      apiBase={SPATIAL_API_BASE}
      clockEndpoint="/api/clock"
      contentLayer={contentLayer}
      heartbeat
      presentation
    />
  );
}
