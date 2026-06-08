'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ScreenPose } from '@syncframe/spatial/react';
import {
  projectWorldFrameToViewport,
  type ViewportProjectedShape,
  type WorldEvalContext,
  type WorldFrame,
  type WorldPreviewContext,
  type WorldShape,
  type WorldShapePaint,
} from '@syncframe/spatial/ui';

function viewportPaintStyle(paint: WorldShapePaint): CSSProperties {
  if (paint.kind === 'solid') {
    return { background: paint.color };
  }
  return {
    backgroundImage: `url(${paint.url})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
  };
}

function renderWorldShapeAsSvg(shape: WorldShape, key: number): ReactNode {
  const opacity = shape.opacity ?? 1;
  if (shape.paint.kind === 'image') {
    return (
      <image
        key={key}
        href={shape.paint.url}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        opacity={opacity}
        preserveAspectRatio="none"
      />
    );
  }
  return (
    <rect
      key={key}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.paint.color}
      opacity={opacity}
    />
  );
}

function renderProjectedShapeAsDiv(shape: ViewportProjectedShape, key: number): ReactNode {
  if (!shape.visible) return null;
  return (
    <div
      key={key}
      className="absolute left-0 top-0 will-change-transform"
      style={{
        transform: `translate3d(${shape.screenX}px, ${shape.screenY}px, 0)`,
        width: shape.screenW,
        height: shape.screenH,
        opacity: shape.opacity,
        ...viewportPaintStyle(shape.paint),
      }}
    />
  );
}

/** Dot demo — world-native SVG at uniform world scale. */
export function renderDotFrameAsSvg(frame: WorldFrame): ReactNode {
  return frame.shapes.map((shape, i) => renderWorldShapeAsSvg(shape, i));
}

/** Dot demo — pose-cropped viewport divs via lib projection. */
export function renderDotFrameAsViewport(
  frame: WorldFrame,
  pose: ScreenPose,
  viewportWidth: number,
  viewportHeight: number,
): ReactNode {
  return projectWorldFrameToViewport(frame, pose, viewportWidth, viewportHeight).map(
    (shape, i) => renderProjectedShapeAsDiv(shape, i),
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
