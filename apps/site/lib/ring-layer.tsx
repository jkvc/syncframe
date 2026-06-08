'use client';

import { useCallback, useMemo, useRef } from 'react';
import type {
  SpatialContentLayer,
  WorldEvalContext,
  WorldFrame,
} from '@syncframe/spatial/ui';
import type { ContentLayerDisplayProps, WorldPreviewContext } from '@syncframe/spatial/ui';
import { RingMapView, RingViewport } from './ring-render';
import {
  RING_BG_COLOR,
  RING_SPIN_CHANNEL,
  layoutRingPetals,
  ringSpinAngle,
  type RingSpinAnchor,
} from './ring';

const SPIN_OFFSET_DECAY_TC_MS = 250;

function getRingSpinAnchor(ctx: WorldEvalContext): RingSpinAnchor | null {
  const raw = ctx.snapshot.anchors[RING_SPIN_CHANNEL];
  if (!raw || typeof raw !== 'object') return null;
  const motion = (raw as RingSpinAnchor).motion;
  if (!motion || motion.kind !== 'scalar') return null;
  return raw as RingSpinAnchor;
}

export function buildRingFrame(ctx: WorldEvalContext, spinAngle: number): WorldFrame {
  const worldW = ctx.spatial.worldBbox.width;
  const worldH = ctx.spatial.worldBbox.height;
  const petals = layoutRingPetals(spinAngle, worldW);

  return {
    shapes: [
      {
        x: 0,
        y: 0,
        width: worldW,
        height: worldH,
        paint: { kind: 'solid', color: RING_BG_COLOR },
        opacity: 1,
        label: 'bg',
      },
      ...petals.map((petal) => ({
        x: petal.x,
        y: petal.y,
        width: petal.diameter,
        height: petal.diameter,
        paint: { kind: 'solid', color: petal.color } as const,
        opacity: 1,
        label: `petal-${petal.index}`,
      })),
    ],
  };
}

export function evaluateRingFrame(ctx: WorldEvalContext): WorldFrame {
  const anchor = getRingSpinAnchor(ctx);
  if (!anchor) return { shapes: [] };
  return buildRingFrame(ctx, ringSpinAngle(anchor, ctx.clock.serverNow()));
}

/** Absorbs SSE latency jump when resuming from pause (rate 0 → spinning). */
function useSmoothedRingEvaluateFrame(): (ctx: WorldEvalContext) => WorldFrame {
  const offsetRef = useRef(0);
  const offsetAtRef = useRef(0);
  const prevAnchorKeyRef = useRef<string | null>(null);
  const prevRateRef = useRef<number | null>(null);

  return useCallback((ctx: WorldEvalContext) => {
    const anchor = getRingSpinAnchor(ctx);
    if (!anchor) return { shapes: [] };

    const serverNow = ctx.clock.serverNow();
    const ideal = ringSpinAngle(anchor, serverNow);
    const rate = anchor.motion.ratePerMs;
    const anchorKey = `${anchor.at}:${anchor.value}:${rate}`;

    if (anchorKey !== prevAnchorKeyRef.current) {
      if (prevRateRef.current === 0 && rate !== 0 && prevAnchorKeyRef.current !== null) {
        offsetRef.current = anchor.value - ideal;
        offsetAtRef.current = serverNow;
      } else if (rate === 0) {
        offsetRef.current = 0;
      }
      prevAnchorKeyRef.current = anchorKey;
    }
    prevRateRef.current = rate;

    let offset = offsetRef.current;
    if (offset !== 0) {
      const elapsed = serverNow - offsetAtRef.current;
      const decay = Math.exp(-elapsed / SPIN_OFFSET_DECAY_TC_MS);
      if (decay < 0.01) {
        offsetRef.current = 0;
        offset = 0;
      } else {
        offset *= decay;
        offsetRef.current = offset;
      }
    }

    return buildRingFrame(ctx, ideal + offset);
  }, []);
}

export function useRingContentLayer(): SpatialContentLayer {
  const evaluateFrame = useSmoothedRingEvaluateFrame();

  const MapView = useMemo(
    () =>
      function RingMapViewSlot(ctx: WorldPreviewContext) {
        return <RingMapView evaluateFrame={evaluateFrame} ctx={ctx} />;
      },
    [evaluateFrame],
  );

  const Display = useMemo(
    () =>
      function RingDisplaySlot(props: ContentLayerDisplayProps) {
        return <RingViewport {...props} evaluateFrame={evaluateFrame} />;
      },
    [evaluateFrame],
  );

  return useMemo(
    () => ({
      id: 'ring',
      label: 'Color ring (spinning donut)',
      evaluateFrame,
      MapView,
      Display,
    }),
    [evaluateFrame, MapView, Display],
  );
}

function NullMapView() {
  return null;
}

function NullDisplay() {
  return null;
}

export const ringLayer: SpatialContentLayer = {
  id: 'ring',
  label: 'Color ring (spinning donut)',
  evaluateFrame: evaluateRingFrame,
  MapView: NullMapView,
  Display: NullDisplay,
};
