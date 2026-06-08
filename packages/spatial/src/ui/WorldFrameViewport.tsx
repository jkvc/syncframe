'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScreenPose } from '../types';
import type { WorldEvalContext, WorldFrame } from './content-layer';
import { renderWorldFrameAsViewport } from './render-world-frame';

export interface WorldFrameViewportProps {
  pose: ScreenPose;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  ctx: WorldEvalContext;
  /** Display-only adjustment (offset decay, labels, …) after evaluateFrame. */
  adjustFrame?: (frame: WorldFrame, ctx: WorldEvalContext) => WorldFrame;
  className?: string;
}

/** Display slot — rAF tick + pose-cropped projection from evaluateFrame. */
export default function WorldFrameViewport({
  pose,
  evaluateFrame,
  ctx,
  adjustFrame,
  className,
}: WorldFrameViewportProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [, setTick] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const sync = () =>
      setViewport({ w: wrap.clientWidth, h: wrap.clientHeight });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ctx.snapshot, ctx.clock, ctx.spatial]);

  let frame = evaluateFrame(ctx);
  if (adjustFrame) {
    frame = adjustFrame(frame, ctx);
  }

  const viewportWidth = viewport.w || (typeof window !== 'undefined' ? window.innerWidth : 0);
  const viewportHeight = viewport.h || (typeof window !== 'undefined' ? window.innerHeight : 0);

  return (
    <div ref={wrapRef} className={className}>
      {renderWorldFrameAsViewport(frame, pose, viewportWidth, viewportHeight)}
    </div>
  );
}
