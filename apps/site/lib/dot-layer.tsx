'use client';

import { useCallback, useMemo, useRef } from 'react';
import type {
  SpatialContentLayer,
  WorldEvalContext,
  WorldFrame,
  WorldShape,
} from '@syncframe/spatial/ui';
import type { ContentLayerDisplayProps, WorldPreviewContext } from '@syncframe/spatial/ui';
import { DotMapView, DotViewport } from './dot-render';
import { DOT_CHANNEL_ID, evaluateLinear2dBouncing, type DotAnchor } from './dot';
import { SPATIAL_STREAM_ENDPOINT } from './spatial-config';

export const DOT_COLORS = [
  '#ff5277',
  '#ffb52e',
  '#33d27e',
  '#26b3ff',
  '#a466ff',
  '#ff6a3c',
  '#e8e44b',
  '#ff4ec3',
] as const;

const OFFSET_DECAY_TC_MS = 250;
const OFFSET_SNAP_THRESHOLD_PX = 300;
const RIPPLE_DURATION_MS = 900;
const RIPPLE_MAX_RADIUS = 420;

export interface Ripple {
  cx: number;
  cy: number;
  color: string;
  atServerMs: number;
}

export interface DotEffectState {
  ripples: Ripple[];
  prevBounceCount: number;
}

function getDotAnchor(ctx: WorldEvalContext): DotAnchor | null {
  const raw = ctx.snapshot.anchors[DOT_CHANNEL_ID];
  if (!raw || typeof raw !== 'object') return null;
  const motion = (raw as DotAnchor).motion;
  if (!motion || motion.kind !== 'linear2dBouncing') return null;
  return raw as DotAnchor;
}

/** RGB complement — dot-specific palette helper. */
export function complementColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (255 - ((n >> 16) & 0xff)) & 0xff;
  const g = (255 - ((n >> 8) & 0xff)) & 0xff;
  const b = (255 - (n & 0xff)) & 0xff;
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function rippleShapes(ripples: Ripple[], serverNow: number): WorldShape[] {
  const out: WorldShape[] = [];
  for (const ripple of ripples) {
    const elapsed = serverNow - ripple.atServerMs;
    if (elapsed < 0 || elapsed > RIPPLE_DURATION_MS) continue;
    const t = elapsed / RIPPLE_DURATION_MS;
    const radius = t * RIPPLE_MAX_RADIUS;
    const opacity = (1 - t) * 0.55;
    out.push({
      x: ripple.cx - radius,
      y: ripple.cy - radius,
      width: radius * 2,
      height: radius * 2,
      fill: ripple.color,
      opacity,
      label: 'ripple',
    });
  }
  return out;
}

function recordBounceRipples(
  effects: DotEffectState,
  pos: { x: number; y: number; bounceCount: number },
  size: number,
  serverNow: number,
): void {
  if (effects.prevBounceCount < 0) {
    effects.prevBounceCount = pos.bounceCount;
    return;
  }
  if (pos.bounceCount <= effects.prevBounceCount) return;

  const cx = pos.x + size / 2;
  const cy = pos.y + size / 2;
  for (let b = effects.prevBounceCount + 1; b <= pos.bounceCount; b++) {
    effects.ripples.push({
      cx,
      cy,
      color: DOT_COLORS[b % DOT_COLORS.length]!,
      atServerMs: serverNow,
    });
  }
  effects.prevBounceCount = pos.bounceCount;
}

function pruneRipples(effects: DotEffectState, serverNow: number): void {
  effects.ripples = effects.ripples.filter(
    (r) => serverNow - r.atServerMs <= RIPPLE_DURATION_MS,
  );
}

/**
 * Single source of truth for dot appearance — map and displays both call this.
 * Pass shared `effects` state (via useDotContentLayer) for bounce ripples + bg complement.
 */
export function evaluateDotFrame(
  ctx: WorldEvalContext,
  effects: DotEffectState,
): WorldFrame {
  const anchor = getDotAnchor(ctx);
  if (!anchor) return { shapes: [] };

  const serverNow = ctx.clock.serverNow();
  const pos = evaluateLinear2dBouncing(anchor, serverNow);
  const size = anchor.motion.squareWidth;
  const active =
    anchor.motion.vxUnitsPerMs !== 0 || anchor.motion.vyUnitsPerMs !== 0;
  const dotColor = DOT_COLORS[pos.bounceCount % DOT_COLORS.length]!;
  const bgColor = complementColor(dotColor);

  recordBounceRipples(effects, pos, size, serverNow);
  pruneRipples(effects, serverNow);

  const worldW = ctx.spatial.worldBbox.width;
  const worldH = ctx.spatial.worldBbox.height;

  return {
    shapes: [
      {
        x: 0,
        y: 0,
        width: worldW,
        height: worldH,
        fill: bgColor,
        opacity: 1,
        label: 'bg',
      },
      ...rippleShapes(effects.ripples, serverNow),
      {
        x: pos.x,
        y: pos.y,
        width: size,
        height: size,
        fill: dotColor,
        opacity: active ? 0.85 : 0.45,
        label: 'dot',
      },
    ],
  };
}

function createInitialEffectState(): DotEffectState {
  return { ripples: [], prevBounceCount: -1 };
}

/** Client hook — shared ripple/bounce state for operator map + display windows. */
export function useDotContentLayer(): SpatialContentLayer {
  const effectsRef = useRef<DotEffectState>(createInitialEffectState());

  const evaluateFrame = useCallback(
    (ctx: WorldEvalContext) => evaluateDotFrame(ctx, effectsRef.current),
    [],
  );

  const MapView = useMemo(
    () =>
      function DotMapViewSlot(ctx: WorldPreviewContext) {
        return <DotMapView evaluateFrame={evaluateFrame} ctx={ctx} />;
      },
    [evaluateFrame],
  );

  const Display = useMemo(
    () =>
      function DotDisplayWithEffects(props: ContentLayerDisplayProps) {
        return <DotDisplay {...props} evaluateFrame={evaluateFrame} />;
      },
    [evaluateFrame],
  );

  return useMemo(
    () => ({
      id: 'dot',
      label: 'Dot (DVD-logo bouncer)',
      evaluateFrame,
      MapView,
      Display,
    }),
    [evaluateFrame, MapView, Display],
  );
}

interface DotDisplayProps extends ContentLayerDisplayProps {
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
}

/** Display-only offset decay — adjusts the dot shape, preserves bg + ripples. */
function DotDisplay({ pose, snapshot, clock, spatial, evaluateFrame }: DotDisplayProps) {
  const offsetRef = useRef<{ x: number; y: number; atServerMs: number } | null>(null);
  const prevAnchorKeyRef = useRef<string | null>(null);
  const prevDisplayedRef = useRef<{ x: number; y: number } | null>(null);

  const adjustFrame = useCallback((frame: WorldFrame, ctx: WorldEvalContext): WorldFrame => {
    const anchor = getDotAnchor(ctx);
    const dot = frame.shapes.find((s) => s.label === 'dot');
    if (!anchor || !dot) return frame;

    const serverNow = ctx.clock.serverNow();
    const ideal = { x: dot.x, y: dot.y };
    const motion = anchor.motion;
    const anchorKey = `${anchor.at}:${anchor.value.x},${anchor.value.y}:${motion.vxUnitsPerMs}:${motion.vyUnitsPerMs}:${motion.worldWidth}:${motion.worldHeight}`;

    if (anchorKey !== prevAnchorKeyRef.current) {
      if (prevDisplayedRef.current && prevAnchorKeyRef.current !== null) {
        const dx = prevDisplayedRef.current.x - ideal.x;
        const dy = prevDisplayedRef.current.y - ideal.y;
        const mag = Math.hypot(dx, dy);
        if (mag > OFFSET_SNAP_THRESHOLD_PX) {
          offsetRef.current = null;
        } else {
          offsetRef.current = { x: dx, y: dy, atServerMs: serverNow };
        }
      } else {
        offsetRef.current = null;
      }
      prevAnchorKeyRef.current = anchorKey;
    }

    let dispX = ideal.x;
    let dispY = ideal.y;
    if (offsetRef.current) {
      const elapsed = serverNow - offsetRef.current.atServerMs;
      const decay = Math.exp(-elapsed / OFFSET_DECAY_TC_MS);
      if (decay < 0.01) {
        offsetRef.current = null;
      } else {
        dispX = ideal.x + offsetRef.current.x * decay;
        dispY = ideal.y + offsetRef.current.y * decay;
      }
    }
    prevDisplayedRef.current = { x: dispX, y: dispY };

    return {
      shapes: frame.shapes.map((shape) =>
        shape.label === 'dot' ? { ...shape, x: dispX, y: dispY } : shape,
      ),
    };
  }, []);

  return (
    <DotViewport
      pose={pose}
      evaluateFrame={evaluateFrame}
      adjustFrame={adjustFrame}
      ctx={{ snapshot, clock, spatial }}
      className="fixed inset-0 overflow-hidden"
    />
  );
}

function NullMapView() {
  return null;
}

function NullDisplay() {
  return null;
}

/** Static layer for tests — fresh effect state per evaluateFrame call. */
export const dotLayer: SpatialContentLayer = {
  id: 'dot',
  label: 'Dot (DVD-logo bouncer)',
  evaluateFrame: (ctx) => evaluateDotFrame(ctx, createInitialEffectState()),
  MapView: NullMapView,
  Display: NullDisplay,
};

export { SPATIAL_STREAM_ENDPOINT };
