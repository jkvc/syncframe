import type { ComponentType } from 'react';
import type { CoreSnapshot } from '@syncframe/core/server';
import type { ServerClock } from '@syncframe/core/react';
import type { ScreenPose, SpatialMeta } from '../types';

/** Evaluated world-space frame — renderer-agnostic. One source of truth for appearance. */
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

/** Top-down map slot — world bbox dimensions passed to WorldFrameWorldView. */
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
 * - `evaluateFrame` — the only place that defines what the content looks like (world coords).
 * - Top-down map (`TopDownRoomMap`) renders that frame at 0,0 in worldW×worldH with uniform
 *   scale (like an inline image), then draws screen pose overlays on top.
 * - Each display (`WorldFrameViewport`) crops to the screen pose bbox and stretches to fill
 *   the window.
 *
 * Override `Display` only when the wall needs a custom shell (offset decay, pano canvas, …).
 * Default display wiring lives in `ChromeFreeDisplay`.
 */
export interface SpatialContentLayer {
  id: string;
  label: string;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  Display?: ComponentType<ContentLayerDisplayProps>;
}
