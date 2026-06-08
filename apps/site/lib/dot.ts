/**
 * Dot demo — consumer motion + evaluator on top of @syncframe/core.
 */

import type { Anchor, MotionDescriptor } from '@syncframe/core/server';
import { DEFAULT_WORLD_HEIGHT, DEFAULT_WORLD_WIDTH } from '@syncframe/spatial/server';
import { DOT_CHANNEL_ID } from './dot-config';

export { DOT_CHANNEL_ID };

export interface Vec2 {
  x: number;
  y: number;
}

export interface Linear2dBouncingMotion extends MotionDescriptor {
  kind: 'linear2dBouncing';
  vxUnitsPerMs: number;
  vyUnitsPerMs: number;
  worldWidth: number;
  worldHeight: number;
  squareWidth: number;
  squareHeight: number;
}

export type DotAnchor = Anchor<Vec2, Linear2dBouncingMotion>;

export const DOT_SQUARE_SIZE = 200;
export const DOT_SQUARE_WIDTH = DOT_SQUARE_SIZE;
export const DOT_SQUARE_HEIGHT = DOT_SQUARE_SIZE;
export const DOT_DEFAULT_SPEED_PX_PER_MS = 400 / 1000 / Math.SQRT2;

export type DotAction = 'start' | 'pause' | 'reset';

const VALID: ReadonlySet<string> = new Set(['start', 'pause', 'reset']);

export function isDotAction(v: unknown): v is DotAction {
  return typeof v === 'string' && VALID.has(v);
}

export function triangleFold(v: number, range: number): number {
  if (range <= 0) return 0;
  const twoR = 2 * range;
  const mod = ((v % twoR) + twoR) % twoR;
  return mod <= range ? mod : twoR - mod;
}

function bouncesAlong(rawDelta: number, range: number): number {
  if (range <= 0) return 0;
  return Math.abs(Math.floor(rawDelta / range));
}

export interface BouncingState extends Vec2 {
  bounceCount: number;
}

export function evaluateLinear2dBouncing(
  anchor: DotAnchor,
  serverNowMs: number,
): BouncingState {
  const dt = serverNowMs - anchor.at;
  const {
    vxUnitsPerMs,
    vyUnitsPerMs,
    worldWidth,
    worldHeight,
    squareWidth,
    squareHeight,
  } = anchor.motion;

  const xRange = Math.max(0, worldWidth - squareWidth);
  const yRange = Math.max(0, worldHeight - squareHeight);
  const rawDeltaX = vxUnitsPerMs * dt;
  const rawDeltaY = vyUnitsPerMs * dt;

  const x = triangleFold(anchor.value.x + rawDeltaX, xRange);
  const y = triangleFold(anchor.value.y + rawDeltaY, yRange);
  const bounceCount =
    bouncesAlong(anchor.value.x + rawDeltaX, xRange) +
    bouncesAlong(anchor.value.y + rawDeltaY, yRange);

  return { x, y, bounceCount };
}

/** Map world-space dot top-left + size into screen pixels for a pose viewport. */
export function mapDotToScreenPixels(
  worldX: number,
  worldY: number,
  squareWidth: number,
  squareHeight: number,
  pose: { worldX: number; worldY: number; worldWidth: number; worldHeight: number },
  viewportWidth: number,
  viewportHeight: number,
): { screenX: number; screenY: number; screenSw: number; screenSh: number } {
  const scaleX = viewportWidth / pose.worldWidth;
  const scaleY = viewportHeight / pose.worldHeight;
  return {
    screenX: (worldX - pose.worldX) * scaleX,
    screenY: (worldY - pose.worldY) * scaleY,
    screenSw: squareWidth * scaleX,
    screenSh: squareHeight * scaleY,
  };
}

export function buildInitialDotAnchor(
  worldWidth: number = DEFAULT_WORLD_WIDTH,
  worldHeight: number = DEFAULT_WORLD_HEIGHT,
  now: number = Date.now(),
): DotAnchor {
  return {
    at: now,
    value: { x: 0, y: 0 },
    motion: {
      kind: 'linear2dBouncing',
      vxUnitsPerMs: DOT_DEFAULT_SPEED_PX_PER_MS,
      vyUnitsPerMs: DOT_DEFAULT_SPEED_PX_PER_MS,
      worldWidth,
      worldHeight,
      squareWidth: DOT_SQUARE_WIDTH,
      squareHeight: DOT_SQUARE_HEIGHT,
    },
  };
}

export function reduceDot(
  existing: DotAnchor | null,
  action: DotAction,
  worldWidth: number,
  worldHeight: number,
  now: number,
): DotAnchor {
  if (action === 'reset') {
    return buildInitialDotAnchor(worldWidth, worldHeight, now);
  }

  if (action === 'pause') {
    if (!existing) {
      const a = buildInitialDotAnchor(worldWidth, worldHeight, now);
      a.motion.vxUnitsPerMs = 0;
      a.motion.vyUnitsPerMs = 0;
      return a;
    }
    const { x, y } = evaluateLinear2dBouncing(existing, now);
    return {
      at: now,
      value: { x, y },
      motion: { ...existing.motion, vxUnitsPerMs: 0, vyUnitsPerMs: 0 },
    };
  }

  // start
  if (!existing) {
    return buildInitialDotAnchor(worldWidth, worldHeight, now);
  }
  const paused =
    existing.motion.vxUnitsPerMs === 0 && existing.motion.vyUnitsPerMs === 0;
  if (paused) {
    return {
      at: now,
      value: { ...existing.value },
      motion: {
        ...existing.motion,
        vxUnitsPerMs: DOT_DEFAULT_SPEED_PX_PER_MS,
        vyUnitsPerMs: DOT_DEFAULT_SPEED_PX_PER_MS,
        worldWidth,
        worldHeight,
      },
    };
  }
  return existing;
}
