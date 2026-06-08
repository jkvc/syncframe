/**
 * Pure coordinate projection — no rendering opinions.
 * Consumers (content layers) own how projected shapes are painted.
 */

import type { ScreenPose } from '../types';
import type { WorldFrame, WorldShape, WorldShapePaint } from './content-layer';

export interface ScreenShape {
  screenX: number;
  screenY: number;
  screenW: number;
  screenH: number;
}

export interface ViewportProjectedShape extends ScreenShape {
  paint: WorldShapePaint;
  opacity: number;
  visible: boolean;
}

function isShapeOffViewport(
  screenX: number,
  screenY: number,
  screenW: number,
  screenH: number,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  return (
    screenX + screenW <= 0 ||
    screenY + screenH <= 0 ||
    screenX >= viewportWidth ||
    screenY >= viewportHeight
  );
}

/** Crop to pose bbox, then stretch independently on X/Y to fill a viewport. */
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

/** Project a WorldFrame into pose-cropped viewport pixel coordinates. */
export function projectWorldFrameToViewport(
  frame: WorldFrame,
  pose: ScreenPose,
  viewportWidth: number,
  viewportHeight: number,
): ViewportProjectedShape[] {
  return frame.shapes.map((shape) => {
    const { screenX, screenY, screenW, screenH } = mapWorldShapeToScreenPixels(
      shape,
      pose,
      viewportWidth,
      viewportHeight,
    );
    return {
      screenX,
      screenY,
      screenW,
      screenH,
      paint: shape.paint,
      opacity: shape.opacity ?? 1,
      visible: !isShapeOffViewport(
        screenX,
        screenY,
        screenW,
        screenH,
        viewportWidth,
        viewportHeight,
      ),
    };
  });
}
