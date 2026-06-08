'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChromeFreeDisplay, PresentationBlank } from '@syncframe/spatial/ui';
import { isValidScreenName } from '@syncframe/spatial/react';
import {
  DOT_API_BASE,
  DOT_STREAM_ENDPOINT,
} from '@/lib/dot-config';
import { useDotContentLayer } from '@/lib/dot-layer';

export function DotDisplay() {
  const contentLayer = useDotContentLayer();
  const params = useSearchParams();
  const screenName = params.get('screenName')?.trim() ?? '';
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!screenName || registered) return;
    if (!isValidScreenName(screenName)) return;

    void fetch(`${DOT_API_BASE}/screens/register`, {
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
      streamEndpoint={DOT_STREAM_ENDPOINT}
      apiBase={DOT_API_BASE}
      clockEndpoint="/api/clock"
      contentLayer={contentLayer}
      heartbeat
      presentation
    />
  );
}
