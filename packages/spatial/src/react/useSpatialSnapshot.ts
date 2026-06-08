'use client';

import { useEffect, useState } from 'react';
import { subscribeSnapshotStream } from '@syncframe/core/react';
import { parseSpatialMeta } from '../reducers';
import type { SpatialMeta } from '../types';

export interface UseSpatialSnapshotOptions {
  streamEndpoint: string;
  metaKey?: string;
}

export function useSpatialSnapshot({
  streamEndpoint,
  metaKey = 'spatial',
}: UseSpatialSnapshotOptions): { spatial: SpatialMeta | null; connected: boolean } {
  const [spatial, setSpatial] = useState<SpatialMeta | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    return subscribeSnapshotStream(
      streamEndpoint,
      (snapshot) => {
        const raw = snapshot.meta[metaKey];
        setSpatial(parseSpatialMeta(raw));
      },
      setConnected,
    );
  }, [streamEndpoint, metaKey]);

  return { spatial, connected };
}
