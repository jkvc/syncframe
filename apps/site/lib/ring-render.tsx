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
import { RING_PETAL_RADIUS } from './ring';

const PETAL_BORDER_COLOR = '#000000';
/** Stroke in world units — scales on displays. */
const PETAL_BORDER_WIDTH_WORLD = 3;

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

function renderPetalCircleAsSvg(shape: WorldShape, key: number): ReactNode {
  const opacity = shape.opacity ?? 1;
  const fill = shape.paint.kind === 'solid' ? shape.paint.color : 'transparent';
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const r = Math.max(0, shape.width / 2 - PETAL_BORDER_WIDTH_WORLD / 2);
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={PETAL_BORDER_COLOR}
      strokeWidth={PETAL_BORDER_WIDTH_WORLD}
      opacity={opacity}
    />
  );
}

function renderWorldShapeAsSvg(shape: WorldShape, key: number): ReactNode {
  const opacity = shape.opacity ?? 1;
  if (shape.label?.startsWith('petal-')) {
    return renderPetalCircleAsSvg(shape, key);
  }
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

function petalViewportStyle(screenSize: number, color: string): CSSProperties {
  const borderPx = Math.max(
    1,
    (PETAL_BORDER_WIDTH_WORLD / (RING_PETAL_RADIUS * 2)) * screenSize,
  );
  return {
    background: color,
    borderRadius: '50%',
    border: `${borderPx}px solid ${PETAL_BORDER_COLOR}`,
    boxSizing: 'border-box',
  };
}

function renderPetalCircleAsDiv(shape: ViewportProjectedShape, key: number): ReactNode {
  if (!shape.visible) return null;
  const solidColor =
    shape.paint.kind === 'solid' ? shape.paint.color : '#ffffff';
  const size = Math.min(shape.screenW, shape.screenH);
  return (
    <div
      key={key}
      className="absolute left-0 top-0 will-change-transform"
      style={{
        transform: `translate3d(${shape.screenX}px, ${shape.screenY}px, 0)`,
        width: shape.screenW,
        height: shape.screenH,
        opacity: shape.opacity,
        ...petalViewportStyle(size, solidColor),
      }}
    />
  );
}

function renderProjectedShapeAsDiv(
  shape: ViewportProjectedShape,
  label: string | undefined,
  key: number,
): ReactNode {
  if (!shape.visible) return null;
  if (label?.startsWith('petal-')) {
    return renderPetalCircleAsDiv(shape, key);
  }
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

export function renderRingFrameAsSvg(frame: WorldFrame): ReactNode {
  return frame.shapes.map((shape, i) => renderWorldShapeAsSvg(shape, i));
}

export function renderRingFrameAsViewport(
  frame: WorldFrame,
  pose: ScreenPose,
  viewportWidth: number,
  viewportHeight: number,
): ReactNode {
  const projected = projectWorldFrameToViewport(
    frame,
    pose,
    viewportWidth,
    viewportHeight,
  );
  return projected.map((shape, i) =>
    renderProjectedShapeAsDiv(shape, frame.shapes[i]?.label, i),
  );
}

export interface RingMapViewProps {
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  ctx: WorldPreviewContext;
}

export function RingMapView({ evaluateFrame, ctx }: RingMapViewProps) {
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
  return <>{renderRingFrameAsSvg(evaluateFrame(evalCtx))}</>;
}

export interface RingViewportProps {
  pose: ScreenPose;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  snapshot: RingMapViewProps['ctx']['snapshot'];
  clock: RingMapViewProps['ctx']['clock'];
  spatial: RingMapViewProps['ctx']['spatial'];
  className?: string;
}

export function RingViewport({
  pose,
  evaluateFrame,
  snapshot,
  clock,
  spatial,
  className,
}: RingViewportProps) {
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
  }, [snapshot, clock, spatial]);

  const ctx: WorldEvalContext = { snapshot, clock, spatial };
  const frame = evaluateFrame(ctx);

  const viewportWidth = viewport.w || (typeof window !== 'undefined' ? window.innerWidth : 0);
  const viewportHeight = viewport.h || (typeof window !== 'undefined' ? window.innerHeight : 0);

  return (
    <div ref={wrapRef} className={className}>
      {renderRingFrameAsViewport(frame, pose, viewportWidth, viewportHeight)}
    </div>
  );
}
