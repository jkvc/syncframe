import type { ComponentType } from 'react';
import type { CoreSnapshot } from '@syncframe/core/server';
import type { ServerClock } from '@syncframe/core/react';
import type { ScreenPose, SpatialMeta } from '../types';

/** Evaluated world-space frame — renderer-agnostic. */
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

/** Context for pure evaluation (shared by Display + MapPreview). */
export interface WorldEvalContext {
  snapshot: CoreSnapshot;
  clock: ServerClock;
  spatial: SpatialMeta;
}

/** Map slot — SVG children in world coords (TopDownRoomMap clips). */
export interface WorldPreviewContext extends WorldEvalContext {
  worldWidth: number;
  worldHeight: number;
}

/** Display slot — pose-cropped fullscreen. */
export interface ContentLayerDisplayProps extends WorldEvalContext {
  pose: ScreenPose;
  screenName: string;
}

/**
 * Content layer module. MapPreview and Display must use the same evaluateFrame.
 * Complex layers (e.g. pano) may use heavyweight Display renderers; evaluateFrame
 * still returns the shared sync state (scroll offset, rects, …).
 */
export interface SpatialContentLayer {
  id: string;
  label: string;
  evaluateFrame: (ctx: WorldEvalContext) => WorldFrame;
  MapPreview: ComponentType<WorldPreviewContext>;
  Display: ComponentType<ContentLayerDisplayProps>;
}
