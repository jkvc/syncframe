import { describe, expect, it } from 'vitest';
import {
  screenToWorld,
  sliceWorldRegion,
  worldToScreen,
  type ScreenPose,
} from '../coords';

const pose: ScreenPose = {
  worldX: 100,
  worldY: 200,
  worldWidth: 400,
  worldHeight: 300,
};

describe('sliceWorldRegion', () => {
  it('maps pose bbox to viewport scale factors', () => {
    const slice = sliceWorldRegion(pose);
    expect(slice.worldX).toBe(100);
    expect(slice.worldY).toBe(200);
    expect(slice.worldWidth).toBe(400);
    expect(slice.worldHeight).toBe(300);
    expect(slice.scaleX).toBeCloseTo(1 / 400);
    expect(slice.scaleY).toBeCloseTo(1 / 300);
  });
});

describe('worldToScreen / screenToWorld', () => {
  it('maps world origin of pose to screen (0,0)', () => {
    expect(worldToScreen({ x: 100, y: 200 }, pose)).toEqual({ x: 0, y: 0 });
  });

  it('maps world point inside pose to normalized 0..1 coords', () => {
    const screen = worldToScreen({ x: 300, y: 350 }, pose);
    expect(screen.x).toBeCloseTo(0.5);
    expect(screen.y).toBeCloseTo(0.5);
  });

  it('inverts screenToWorld', () => {
    const world = { x: 250, y: 275 };
    const screen = worldToScreen(world, pose);
    const back = screenToWorld(screen, pose);
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });
});
