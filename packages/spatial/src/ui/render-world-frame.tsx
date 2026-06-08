import type { ReactNode } from 'react';
import type { ScreenPose } from '../types';
import type { WorldFrame, WorldShape } from './content-layer';

/**
 * World-native projection — 1 world unit = 1 SVG unit at (0,0)…worldW×worldH.
 * Used by the top-down map; parent scales uniformly (no stretch).
 */
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

export interface ViewportProjectedShape extends ScreenShape {
  fill: string;
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

/**
 * Display projection — crop to pose bbox, then stretch independently on X/Y
 * to fill the browser window.
 */
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

/** Display path — project a WorldFrame into pose-cropped viewport pixels. */
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
      fill: shape.fill,
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

/** Display path — absolutely positioned divs from a projected frame. */
export function renderWorldFrameAsViewport(
  frame: WorldFrame,
  pose: ScreenPose,
  viewportWidth: number,
  viewportHeight: number,
): ReactNode {
  return projectWorldFrameToViewport(frame, pose, viewportWidth, viewportHeight).map(
    (shape, i) =>
      shape.visible ? (
        <div
          key={i}
          className="absolute left-0 top-0 will-change-transform"
          style={{
            transform: `translate3d(${shape.screenX}px, ${shape.screenY}px, 0)`,
            width: shape.screenW,
            height: shape.screenH,
            background: shape.fill,
            opacity: shape.opacity,
          }}
        />
      ) : null,
  );
}
