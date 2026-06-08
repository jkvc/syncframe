import { describe, expect, it } from 'vitest';
import {
  mapWorldShapeToScreenPixels,
  projectWorldFrameToViewport,
} from '../ui/render-world-frame';

const pose = {
  worldX: 100,
  worldY: 200,
  worldWidth: 400,
  worldHeight: 300,
};

describe('projectWorldFrameToViewport', () => {
  it('maps world shapes into pose-cropped viewport pixels', () => {
    const projected = projectWorldFrameToViewport(
      {
        shapes: [
          {
            x: 200,
            y: 350,
            width: 40,
            height: 30,
            fill: '#ff0000',
            opacity: 0.8,
          },
        ],
      },
      pose,
      800,
      600,
    );
    expect(projected).toHaveLength(1);
    expect(projected[0]).toMatchObject({
      screenX: 200,
      screenY: 300,
      screenW: 80,
      screenH: 60,
      fill: '#ff0000',
      opacity: 0.8,
      visible: true,
    });
  });

  it('marks shapes fully outside the viewport as not visible', () => {
    const projected = projectWorldFrameToViewport(
      {
        shapes: [{ x: 900, y: 900, width: 10, height: 10, fill: '#000' }],
      },
      pose,
      800,
      600,
    );
    expect(projected[0]!.visible).toBe(false);
  });
});

describe('mapWorldShapeToScreenPixels', () => {
  it('centers world origin offset by pose', () => {
    const center = mapWorldShapeToScreenPixels(
      { x: 300, y: 350, width: 0, height: 0 },
      pose,
      800,
      600,
    );
    expect(center.screenX).toBe(400);
    expect(center.screenY).toBe(300);
  });
});
