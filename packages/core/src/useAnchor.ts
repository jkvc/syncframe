/**
 * @syncframe/core — anchor subscription hook.
 *
 * Subscribes to a room's snapshot stream (SSE) and returns the latest anchor
 * for a single channel. This is the transport-facing building block: it gives
 * you the raw `Anchor` (including its motion descriptor), which you need when
 * the UI depends on *how* the value is moving (play/pause, speed) and not just
 * the evaluated number. `useScalarAnchor` builds on this for the number-only
 * case.
 *
 * The stream is expected to emit `CoreSnapshot` JSON. The endpoint is called
 * as `${streamEndpoint}?roomId=<roomId>`.
 */

import { useEffect, useRef, useState } from 'react';
import type { Anchor, CoreSnapshot, MotionDescriptor } from './types';

export function useAnchor<T = unknown, M extends MotionDescriptor = MotionDescriptor>(
  roomId: string,
  channelId: string,
  streamEndpoint: string,
): Anchor<T, M> | null {
  const [anchor, setAnchor] = useState<Anchor<T, M> | null>(null);

  // Keep latest channelId without resubscribing on every render.
  const channelRef = useRef(channelId);
  channelRef.current = channelId;

  useEffect(() => {
    const url = `${streamEndpoint}?roomId=${encodeURIComponent(roomId)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      const snapshot = JSON.parse(event.data) as CoreSnapshot;
      const next = snapshot.anchors[channelRef.current] ?? null;
      setAnchor((next as Anchor<T, M> | null));
    };

    return () => es.close();
  }, [roomId, streamEndpoint]);

  return anchor;
}
