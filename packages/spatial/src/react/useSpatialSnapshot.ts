'use client';

import { useEffect, useState } from 'react';
import type { CoreSnapshot } from '@syncframe/core/server';
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
}: UseSpatialSnapshotOptions): {
  spatial: SpatialMeta | null;
  snapshot: CoreSnapshot | null;
  connected: boolean;
} {
  const [spatial, setSpatial] = useState<SpatialMeta | null>(null);
  const [snapshot, setSnapshot] = useState<CoreSnapshot | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    return subscribeSnapshotStream(
      streamEndpoint,
      (next) => {
        setSnapshot(next);
        const raw = next.meta[metaKey];
        setSpatial(parseSpatialMeta(raw));
      },
      setConnected,
    );
  }, [streamEndpoint, metaKey]);

  return { spatial, snapshot, connected };
}
