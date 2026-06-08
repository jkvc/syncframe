import type { ComponentType } from 'react';
import type { CoreSnapshot } from '@syncframe/core/server';
import type { ServerClock } from '@syncframe/core/react';
import type { ScreenPose, SpatialMeta } from '../types';

/**
 * Rect-shaped world primitive — optional convenience for evaluateFrame.
 * Complex layers may ignore WorldFrame and draw from anchors in MapView/Display.
 * Background, motion, and non-rect geometry are entirely consumer-owned.
 */
export interface WorldShape {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
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
 * - `evaluateFrame` — optional rect-shaped world data; consumers may use or bypass it.
 * - `MapView` / `Display` — consumer-owned renderers (background, shapes, motion).
 *   `projectWorldFrameToViewport` is optional coordinate math for rect layers.
 */
export interface SpatialContentLayer {
  id: string;
  label: string;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  MapView: ComponentType<WorldPreviewContext>;
  Display: ComponentType<ContentLayerDisplayProps>;
}
