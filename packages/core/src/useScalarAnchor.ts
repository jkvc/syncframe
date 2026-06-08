/**
 * @syncframe/core — scalar anchor subscription hook.
 *
 * Subscribes to anchor updates via SSE (through `useAnchor`) and
 * returns the current scalar value extrapolated at server time, re-evaluated
 * every frame via requestAnimationFrame.
 *
 * This is the number-only convenience. If your UI also needs the motion (e.g.
 * to show play/pause or speed), subscribe with `useAnchor` directly and call
 * `evaluateScalar` yourself.
 */

import { useEffect, useRef, useState } from 'react';
import type { ScalarMotion } from './types';
import { evaluateScalar } from './evaluators';
import { useAnchor } from './useAnchor';

export function useScalarAnchor(
  channelId: string,
  streamEndpoint: string,
  getServerNow: () => number,
): number | null {
  const anchor = useAnchor<number, ScalarMotion>(channelId, streamEndpoint);
  const [value, setValue] = useState<number | null>(null);

  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const current = anchorRef.current;
      if (current && current.motion.kind === 'scalar') {
        setValue(evaluateScalar(current, getServerNow()));
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getServerNow]);

  return value;
}
