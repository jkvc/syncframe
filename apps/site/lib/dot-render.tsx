'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ScreenPose } from '@syncframe/spatial/react';
import {
  projectWorldFrameToViewport,
  type WorldEvalContext,
  type WorldFrame,
  type WorldPreviewContext,
} from '@syncframe/spatial/ui';

/** Dot demo — world-native SVG (fill only, matches presentation). */
export function renderDotFrameAsSvg(frame: WorldFrame): ReactNode {
  return frame.shapes.map((shape, i) => (
    <rect
      key={i}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill}
      opacity={shape.opacity ?? 1}
    />
  ));
}

/** Dot demo — pose-cropped viewport divs. */
export function renderDotFrameAsViewport(
  frame: WorldFrame,
  pose: ScreenPose,
  viewportWidth: number,
  viewportHeight: number,
): ReactNode {
  return projectWorldFrameToViewport(frame, pose, viewportWidth, viewportHeight).map(
    (shape, i) =>
      shape.visible ? (
        <div
          key={i}
          className="absolute left-0 top-0 will-change-transform"
          style={{
            transform: `translate3d(${shape.screenX}px, ${shape.screenY}px, 0)`,
            width: shape.screenW,
            height: shape.screenH,
            background: shape.fill,
            opacity: shape.opacity,
          }}
        />
      ) : null,
  );
}

export interface DotMapViewProps {
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  ctx: WorldPreviewContext;
}

export function DotMapView({ evaluateFrame, ctx }: DotMapViewProps) {
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
  return <>{renderDotFrameAsSvg(evaluateFrame(evalCtx))}</>;
}

export interface DotViewportProps {
  pose: ScreenPose;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  ctx: WorldEvalContext;
  adjustFrame?: (frame: WorldFrame, ctx: WorldEvalContext) => WorldFrame;
  className?: string;
}

export function DotViewport({
  pose,
  evaluateFrame,
  ctx,
  adjustFrame,
  className,
}: DotViewportProps) {
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
      {renderDotFrameAsViewport(frame, pose, viewportWidth, viewportHeight)}
    </div>
  );
}
