'use client';

import { useEffect, useState } from 'react';
import type { WorldEvalContext, WorldFrame, WorldPreviewContext } from './content-layer';
import { renderWorldFrameAsSvg } from './render-world-frame';

export interface WorldFrameWorldViewProps {
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  ctx: WorldPreviewContext;
}

/**
 * World-native view — content at (0,0) in worldWidth×worldHeight units.
 * Parent SVG viewBox should be `0 0 worldWidth worldHeight` with uniform scale (no stretch).
 */
export default function WorldFrameWorldView({ evaluateFrame, ctx }: WorldFrameWorldViewProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ctx.snapshot, ctx.clock, ctx.spatial]);

  const evalCtx: WorldEvalContext = {
    snapshot: ctx.snapshot,
    clock: ctx.clock,
    spatial: ctx.spatial,
  };
  return <>{renderWorldFrameAsSvg(evaluateFrame(evalCtx))}</>;
}
