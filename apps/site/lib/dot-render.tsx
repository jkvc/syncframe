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
import { DOT_SQUARE_SIZE } from './dot';

const DOT_BORDER_COLOR = '#000000';
/** Border width in world units — scales with projected dot size on displays. */
const DOT_BORDER_WIDTH_WORLD = 4;
/** Ripple ring stroke in world units — scales on displays. */
const RIPPLE_STROKE_WORLD = 8;

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

function renderRippleRingAsSvg(shape: WorldShape, key: number): ReactNode {
  const opacity = shape.opacity ?? 1;
  const stroke = shape.paint.kind === 'solid' ? shape.paint.color : '#ffffff';
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const r = Math.max(0, shape.width / 2 - RIPPLE_STROKE_WORLD / 2);
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={stroke}
      strokeWidth={RIPPLE_STROKE_WORLD}
      opacity={opacity}
    />
  );
}

function renderDotCircleAsSvg(shape: WorldShape, key: number): ReactNode {
  const opacity = shape.opacity ?? 1;
  const fill = shape.paint.kind === 'solid' ? shape.paint.color : 'transparent';
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const r = shape.width / 2;
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={DOT_BORDER_COLOR}
      strokeWidth={DOT_BORDER_WIDTH_WORLD}
      opacity={opacity}
    />
  );
}

function renderWorldShapeAsSvg(shape: WorldShape, key: number): ReactNode {
  const opacity = shape.opacity ?? 1;
  if (shape.label === 'ripple') {
    return renderRippleRingAsSvg(shape, key);
  }
  if (shape.label === 'dot') {
    return renderDotCircleAsSvg(shape, key);
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

function rippleViewportStyle(screenSize: number, color: string): CSSProperties {
  const borderPx = Math.max(
    2,
    (RIPPLE_STROKE_WORLD / DOT_SQUARE_SIZE) * screenSize,
  );
  return {
    borderRadius: '50%',
    background: 'transparent',
    border: `${borderPx}px solid ${color}`,
    boxSizing: 'border-box',
  };
}

function dotViewportStyle(screenSize: number): CSSProperties {
  const borderPx = Math.max(
    2,
    (DOT_BORDER_WIDTH_WORLD / DOT_SQUARE_SIZE) * screenSize,
  );
  return {
    borderRadius: '50%',
    border: `${borderPx}px solid ${DOT_BORDER_COLOR}`,
    boxSizing: 'border-box',
  };
}

function renderProjectedShapeAsDiv(
  shape: ViewportProjectedShape,
  label: string | undefined,
  key: number,
): ReactNode {
  if (!shape.visible) return null;
  const size = Math.min(shape.screenW, shape.screenH);
  const solidColor =
    shape.paint.kind === 'solid' ? shape.paint.color : '#ffffff';
  return (
    <div
      key={key}
      className="absolute left-0 top-0 will-change-transform"
      style={{
        transform: `translate3d(${shape.screenX}px, ${shape.screenY}px, 0)`,
        width: shape.screenW,
        height: shape.screenH,
        opacity: shape.opacity,
        ...(label === 'ripple'
          ? rippleViewportStyle(size, solidColor)
          : label === 'dot'
            ? { ...viewportPaintStyle(shape.paint), ...dotViewportStyle(size) }
            : viewportPaintStyle(shape.paint)),
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
