import { describe, expect, it } from 'vitest';
import {
  buildInitialDotAnchor,
  evaluateLinear2dBouncing,
  mapDotToScreenPixels,
  reduceDot,
  triangleFold,
} from '../dot';

describe('triangleFold', () => {
  it('folds at range boundary', () => {
    expect(triangleFold(1500, 1000)).toBe(500);
  });
});

describe('reduceDot', () => {
  it('reset builds fresh anchor', () => {
    const a = reduceDot(null, 'reset', 1920, 1080, 1000);
    expect(a.value).toEqual({ x: 0, y: 0 });
    expect(a.motion.vxUnitsPerMs).toBeGreaterThan(0);
  });

  it('pause zeros velocity', () => {
    const running = buildInitialDotAnchor(1920, 1080, 1000);
    const paused = reduceDot(running, 'pause', 1920, 1080, 2000);
    expect(paused.motion.vxUnitsPerMs).toBe(0);
    expect(paused.motion.vyUnitsPerMs).toBe(0);
  });

  it('start resumes from pause', () => {
    const running = buildInitialDotAnchor(1920, 1080, 1000);
    const paused = reduceDot(running, 'pause', 1920, 1080, 2000);
    const resumed = reduceDot(paused, 'start', 1920, 1080, 3000);
    expect(resumed.motion.vxUnitsPerMs).toBeGreaterThan(0);
  });
});

describe('mapDotToScreenPixels', () => {
  it('maps full-world pose to full viewport', () => {
    const pose = { worldX: 0, worldY: 0, worldWidth: 1920, worldHeight: 1080 };
    const atOrigin = mapDotToScreenPixels(0, 0, 200, 150, pose, 1920, 1080);
    expect(atOrigin.screenX).toBe(0);
    expect(atOrigin.screenY).toBe(0);
    expect(atOrigin.screenSw).toBe(200);
    expect(atOrigin.screenSh).toBe(150);

    const scaled = mapDotToScreenPixels(960, 540, 200, 150, pose, 960, 540);
    expect(scaled.screenX).toBe(480);
    expect(scaled.screenY).toBe(270);
    expect(scaled.screenSw).toBe(100);
    expect(scaled.screenSh).toBe(75);
  });
});

describe('evaluateLinear2dBouncing', () => {
  it('stays within world bounds', () => {
    const anchor = buildInitialDotAnchor(1920, 1080, 0);
    const state = evaluateLinear2dBouncing(anchor, 60_000);
    expect(state.x).toBeGreaterThanOrEqual(0);
    expect(state.y).toBeGreaterThanOrEqual(0);
    expect(state.x).toBeLessThanOrEqual(1920 - 200);
    expect(state.y).toBeLessThanOrEqual(1080 - 150);
  });
});
