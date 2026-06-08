/**
 * @syncframe/core — anchor subscription hook.
 *
 * Subscribes to a snapshot stream (SSE) and returns the latest anchor
 * for a single channel. This is the transport-facing building block: it gives
 * you the raw `Anchor` (including its motion descriptor), which you need when
 * the UI depends on *how* the value is moving (play/pause, speed) and not just
 * the evaluated number. `useScalarAnchor` builds on this for the number-only
 * case.
 *
 * The stream is expected to emit `CoreSnapshot` JSON at `streamEndpoint`.
 */

import { useEffect, useRef, useState } from 'react';
import { subscribeSnapshotStream } from './snapshotStreamCache';
import type { Anchor, MotionDescriptor } from './types';

export function useAnchor<T = unknown, M extends MotionDescriptor = MotionDescriptor>(
  channelId: string,
  streamEndpoint: string,
): Anchor<T, M> | null {
  const [anchor, setAnchor] = useState<Anchor<T, M> | null>(null);

  const channelRef = useRef(channelId);
  channelRef.current = channelId;

  useEffect(() => {
    return subscribeSnapshotStream(streamEndpoint, (snapshot) => {
      const next = snapshot.anchors[channelRef.current] ?? null;
      setAnchor(next as Anchor<T, M> | null);
    });
  }, [streamEndpoint, channelId]);

  return anchor;
}
