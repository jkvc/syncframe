'use client';

import { useEffect, useRef, useState } from 'react';
import type { SpatialContentLayer, WorldEvalContext, WorldPreviewContext } from '@syncframe/spatial/ui';
import {
  mapWorldShapeToScreenPixels,
  renderWorldFrameAsSvg,
} from '@syncframe/spatial/ui';
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

function evaluateDotFrame(ctx: WorldEvalContext) {
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

function DotMapPreview({ snapshot, clock, spatial }: WorldPreviewContext) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const anchor = getDotAnchor({ snapshot, clock, spatial });
    if (!anchor) return;
    let raf = 0;
    const tick = () => {
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [snapshot, clock, spatial]);

  const frame = evaluateDotFrame({ snapshot, clock, spatial });
  return <>{renderWorldFrameAsSvg(frame)}</>;
}

function DotDisplay({ pose, snapshot, clock, spatial }: ContentLayerDisplayProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const spatialRef = useRef(spatial);
  spatialRef.current = spatial;

  const offsetRef = useRef<{ x: number; y: number; atServerMs: number } | null>(null);
  const prevAnchorKeyRef = useRef<string | null>(null);
  const prevDisplayedRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const ctx = {
        snapshot: snapshotRef.current,
        clock: clockRef.current,
        spatial: spatialRef.current,
      };
      const anchor = getDotAnchor(ctx);
      const p = poseRef.current;
      const box = boxRef.current;

      if (!anchor || !box) {
        if (box) box.style.display = 'none';
        raf = requestAnimationFrame(tick);
        return;
      }

      const serverNow = ctx.clock.serverNow();
      const ideal = evaluateLinear2dBouncing(anchor, serverNow);
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

      const shape = {
        x: dispX,
        y: dispY,
        width: motion.squareWidth,
        height: motion.squareHeight,
      };
      const wrap = wrapRef.current;
      const screenW = wrap?.clientWidth ?? window.innerWidth;
      const screenH = wrap?.clientHeight ?? window.innerHeight;
      const { screenX, screenY, screenW: screenSw, screenH: screenSh } = mapWorldShapeToScreenPixels(
        shape,
        p,
        screenW,
        screenH,
      );

      const fullyOff =
        screenX + screenSw <= 0 ||
        screenY + screenSh <= 0 ||
        screenX >= screenW ||
        screenY >= screenH;

      if (fullyOff) {
        box.style.display = 'none';
      } else {
        box.style.display = '';
        box.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
        box.style.width = `${screenSw}px`;
        box.style.height = `${screenSh}px`;
        box.style.background = DOT_COLORS[ideal.bounceCount % DOT_COLORS.length]!;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="fixed inset-0 overflow-hidden bg-black">
      <div
        ref={boxRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ transform: 'translate3d(0,0,0)', display: 'none' }}
      />
    </div>
  );
}

export const dotLayer: SpatialContentLayer = {
  id: 'dot',
  label: 'Dot (DVD-logo bouncer)',
  evaluateFrame: evaluateDotFrame,
  MapPreview: DotMapPreview,
  Display: DotDisplay,
};

/** Stream endpoint re-export for operator dot controls. */
export { SPATIAL_STREAM_ENDPOINT };
