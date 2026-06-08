/**
 * Color ring demo — scalar spin anchor + layout math.
 */

import type { Anchor, ScalarMotion } from '@syncframe/core/server';
import { evaluateScalar } from '@syncframe/core/server';
import { RING_SPIN_CHANNEL, RING_WORLD_SIZE } from './ring-config';

export { RING_SPIN_CHANNEL };

export type RingSpinAnchor = Anchor<number, ScalarMotion>;

/** One full counter-clockwise rotation every eight seconds (screen Y-down). */
export const RING_SPIN_PERIOD_MS = 8_000;
export const RING_SPIN_RATE_PER_MS = -(2 * Math.PI) / RING_SPIN_PERIOD_MS;

export const RING_PETAL_COUNT = 12;
export const RING_ORBIT_RADIUS = 120;
/** Smaller than arc spacing (~63px) so petals don't touch. */
export const RING_PETAL_RADIUS = 22;

export const RING_BG_COLOR = '#ffffff';

export const RING_PETAL_COLORS = [
  '#ff5277',
  '#ff6a3c',
  '#ffb52e',
  '#e8e44b',
  '#33d27e',
  '#26b3ff',
  '#4a6cf7',
  '#a466ff',
  '#ff4ec3',
  '#ff85c0',
  '#00d4aa',
  '#7c4dff',
] as const;

export type RingSpinAction = 'start' | 'pause';

const RING_SPIN_ACTIONS: ReadonlySet<string> = new Set(['start', 'pause']);

export function isRingSpinAction(v: unknown): v is RingSpinAction {
  return typeof v === 'string' && RING_SPIN_ACTIONS.has(v);
}

/** Paused at angle zero — operator starts spin explicitly. */
export function buildInitialRingSpinAnchor(now: number = Date.now()): RingSpinAnchor {
  return {
    at: now,
    value: 0,
    motion: { kind: 'scalar', ratePerMs: 0 },
  };
}

export function reduceRingSpin(
  existing: RingSpinAnchor | null,
  action: RingSpinAction,
  now: number,
): RingSpinAnchor {
  if (action === 'pause') {
    if (!existing) {
      return buildInitialRingSpinAnchor(now);
    }
    return {
      at: now,
      value: evaluateScalar(existing, now),
      motion: { kind: 'scalar', ratePerMs: 0 },
    };
  }

  if (!existing) {
    return {
      at: now,
      value: 0,
      motion: { kind: 'scalar', ratePerMs: RING_SPIN_RATE_PER_MS },
    };
  }
  if (existing.motion.ratePerMs === 0) {
    return {
      at: now,
      value: existing.value,
      motion: { kind: 'scalar', ratePerMs: RING_SPIN_RATE_PER_MS },
    };
  }
  return existing;
}

export function isRingSpinning(anchor: RingSpinAnchor | null): boolean {
  return !!anchor && anchor.motion.ratePerMs !== 0;
}

export function ringSpinAngle(anchor: RingSpinAnchor, serverNowMs: number): number {
  return evaluateScalar(anchor, serverNowMs);
}

export interface RingPetalLayout {
  x: number;
  y: number;
  diameter: number;
  color: string;
  index: number;
}

export function layoutRingPetals(
  spinAngle: number,
  worldSize: number = RING_WORLD_SIZE,
): RingPetalLayout[] {
  const cx = worldSize / 2;
  const cy = worldSize / 2;
  const step = (2 * Math.PI) / RING_PETAL_COUNT;

  return RING_PETAL_COLORS.map((color, index) => {
    const a = spinAngle + index * step;
    const px = cx + RING_ORBIT_RADIUS * Math.cos(a);
    const py = cy + RING_ORBIT_RADIUS * Math.sin(a);
    const d = RING_PETAL_RADIUS * 2;
    return {
      x: px - RING_PETAL_RADIUS,
      y: py - RING_PETAL_RADIUS,
      diameter: d,
      color,
      index,
    };
  });
}
