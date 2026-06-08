import { describe, expect, it } from 'vitest';
import {
  mapWorldShapeToScreenPixels,
  projectWorldFrameToViewport,
} from '../ui/world-projection';

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
            paint: { kind: 'solid', color: '#ff0000' },
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
      paint: { kind: 'solid', color: '#ff0000' },
      opacity: 0.8,
      visible: true,
    });
  });

  it('passes image paint through projection', () => {
    const projected = projectWorldFrameToViewport(
      {
        shapes: [
          {
            x: 0,
            y: 0,
            width: 6000,
            height: 1080,
            paint: { kind: 'image', url: '/pano.jpg' },
          },
        ],
      },
      pose,
      800,
      600,
    );
    expect(projected[0]!.paint).toEqual({ kind: 'image', url: '/pano.jpg' });
    expect(projected[0]!.visible).toBe(true);
  });

  it('marks shapes fully outside the viewport as not visible', () => {
    const projected = projectWorldFrameToViewport(
      {
        shapes: [{ x: 900, y: 900, width: 10, height: 10, paint: { kind: 'solid', color: '#000' } }],
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
