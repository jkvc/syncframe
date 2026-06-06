/**
 * @syncframe/core — scalar anchor subscription hook.
 *
 * Subscribes to a room's anchor updates via SSE, returns the current
 * scalar value extrapolated at server time. Automatically evaluates at
 * the current server time via requestAnimationFrame.
 */

import { useEffect, useRef, useState } from 'react';
import type { Anchor, CoreSnapshot, ScalarMotion } from './types';
import { evaluateScalar } from './evaluators';

export function useScalarAnchor(
  roomId: string,
  channelId: string,
  streamEndpoint: string,
  getServerNow: () => number,
): number | null {
  const [anchor, setAnchor] = useState<Anchor<number, ScalarMotion> | null>(null);
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    const url = `${streamEndpoint}?roomId=${encodeURIComponent(roomId)}`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      const snapshot = JSON.parse(event.data) as CoreSnapshot;
      const nextAnchor = snapshot.anchors[channelId] ?? null;
      if (nextAnchor && nextAnchor.motion.kind === 'scalar') {
        setAnchor(nextAnchor as Anchor<number, ScalarMotion>);
      }
    };

    return () => es.close();
  }, [roomId, channelId, streamEndpoint]);

  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  useEffect(() => {
    if (!anchor) return;

    let raf: number;
    const tick = () => {
      const current = anchorRef.current;
      if (current) {
        const serverNow = getServerNow();
        const evaluated = evaluateScalar(current, serverNow);
        setValue(evaluated);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getServerNow]);

  return value;
}
