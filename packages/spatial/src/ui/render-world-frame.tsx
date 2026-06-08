import type { ReactNode } from 'react';
import type { ScreenPose } from '../types';
import type { WorldFrame, WorldShape } from './content-layer';

/** Map preview — SVG rects in world coordinates. */
export function renderWorldFrameAsSvg(frame: WorldFrame): ReactNode {
  return frame.shapes.map((shape, i) => (
    <rect
      key={i}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill}
      opacity={shape.opacity ?? 1}
      stroke="#111"
      strokeWidth={2}
      vectorEffect="non-scaling-stroke"
    />
  ));
}

export interface ScreenShape {
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
}

/** Pose-cropped affine map for display viewports. */
export function mapWorldShapeToScreenPixels(
  shape: Pick<WorldShape, 'x' | 'y' | 'width' | 'height'>,
  pose: ScreenPose,
  viewportWidth: number,
  viewportHeight: number,
): ScreenShape {
  const scaleX = viewportWidth / pose.worldWidth;
  const scaleY = viewportHeight / pose.worldHeight;
  return {
    screenX: (shape.x - pose.worldX) * scaleX,
    screenY: (shape.y - pose.worldY) * scaleY,
    screenW: shape.width * scaleX,
    screenH: shape.height * scaleY,
  };
}
