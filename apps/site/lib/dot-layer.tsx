'use client';

import { useCallback, useRef } from 'react';
import type { SpatialContentLayer, WorldEvalContext, WorldFrame } from '@syncframe/spatial/ui';
import { WorldFrameViewport } from '@syncframe/spatial/ui';
import type { ContentLayerDisplayProps } from '@syncframe/spatial/ui';
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

function getDotAnchor(ctx: WorldEvalContext): DotAnchor | null {
  const raw = ctx.snapshot.anchors[DOT_CHANNEL_ID];
  if (!raw || typeof raw !== 'object') return null;
  const motion = (raw as DotAnchor).motion;
  if (!motion || motion.kind !== 'linear2dBouncing') return null;
  return raw as DotAnchor;
}

/** Single source of truth for dot appearance — map and displays both call this. */
function evaluateDotFrame(ctx: WorldEvalContext): WorldFrame {
  const anchor = getDotAnchor(ctx);
  if (!anchor) return { shapes: [] };
  const pos = evaluateLinear2dBouncing(anchor, ctx.clock.serverNow());
  const active =
    anchor.motion.vxUnitsPerMs !== 0 || anchor.motion.vyUnitsPerMs !== 0;
  return {
    shapes: [
      {
        x: pos.x,
        y: pos.y,
        width: anchor.motion.squareWidth,
        height: anchor.motion.squareHeight,
        fill: DOT_COLORS[pos.bounceCount % DOT_COLORS.length]!,
        opacity: active ? 0.85 : 0.45,
        label: `${Math.round(pos.x)}, ${Math.round(pos.y)}`,
      },
    ],
  };
}

/** Display-only offset decay — not part of evaluateFrame. */
function DotDisplay({ pose, snapshot, clock, spatial }: ContentLayerDisplayProps) {
  const offsetRef = useRef<{ x: number; y: number; atServerMs: number } | null>(null);
  const prevAnchorKeyRef = useRef<string | null>(null);
  const prevDisplayedRef = useRef<{ x: number; y: number } | null>(null);

  const adjustFrame = useCallback((frame: WorldFrame, ctx: WorldEvalContext): WorldFrame => {
    const anchor = getDotAnchor(ctx);
    if (!anchor || frame.shapes.length === 0) return frame;

    const serverNow = ctx.clock.serverNow();
    const shape = frame.shapes[0]!;
    const ideal = { x: shape.x, y: shape.y };
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
      shapes: [{ ...shape, x: dispX, y: dispY }],
    };
  }, []);

  return (
    <WorldFrameViewport
      pose={pose}
      evaluateFrame={evaluateDotFrame}
      adjustFrame={adjustFrame}
      ctx={{ snapshot, clock, spatial }}
      className="fixed inset-0 overflow-hidden bg-black"
    />
  );
}

export const dotLayer: SpatialContentLayer = {
  id: 'dot',
  label: 'Dot (DVD-logo bouncer)',
  evaluateFrame: evaluateDotFrame,
  Display: DotDisplay,
};

/** Stream endpoint re-export for operator dot controls. */
export { SPATIAL_STREAM_ENDPOINT };
