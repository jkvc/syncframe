import type { ComponentType } from 'react';
import type { CoreSnapshot } from '@syncframe/core/server';
import type { ServerClock } from '@syncframe/core/react';
import type { ScreenPose, SpatialMeta } from '../types';

/** Solid fill or image texture — geometry stays rect; paint is separate. */
export type WorldShapePaint =
  | { kind: 'solid'; color: string }
  | { kind: 'image'; url: string };

/**
 * Rect in world space. Every content layer models its scene as positioned rects
 * returned from `evaluateFrame` (motion, scroll offset, etc. baked into x/y).
 */
export interface WorldShape {
  x: number;
  y: number;
  width: number;
  height: number;
  paint: WorldShapePaint;
  label?: string;
  opacity?: number;
}

export interface WorldFrame {
  shapes: WorldShape[];
}

/** Context for evaluateFrame (shared by map + display). */
export interface WorldEvalContext {
  snapshot: CoreSnapshot;
  clock: ServerClock;
  spatial: SpatialMeta;
}

/** Top-down map slot — inside TopDownRoomMap's world viewBox. */
export interface WorldPreviewContext extends WorldEvalContext {
  worldWidth: number;
  worldHeight: number;
}

/** Display slot — pose-cropped, stretched to fill the browser window. */
export interface ContentLayerDisplayProps extends WorldEvalContext {
  pose: ScreenPose;
  screenName: string;
}

/**
 * Content layer module.
 *
 * - `evaluateFrame` — required; world-space rects at `clock.serverNow()`.
 * - `MapView` / `Display` — consumer-owned paint (SVG, div, canvas, …).
 * - `projectWorldFrameToViewport` — standard pose-crop math for display slots.
 */
export interface SpatialContentLayer {
  id: string;
  label: string;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  MapView: ComponentType<WorldPreviewContext>;
  Display: ComponentType<ContentLayerDisplayProps>;
}
