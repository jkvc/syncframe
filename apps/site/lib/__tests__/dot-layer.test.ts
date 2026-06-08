import { describe, expect, it } from 'vitest';
import type { ServerClock } from '@syncframe/core/react';
import type { CoreSnapshot } from '@syncframe/core/server';
import { defaultSpatialMeta } from '@syncframe/spatial/server';
import {
  complementColor,
  dotLayer,
  evaluateDotFrame,
  maxRippleRadius,
} from '../dot-layer';
import { buildInitialDotAnchor, DOT_SQUARE_SIZE } from '../dot';
import { DOT_CHANNEL_ID } from '../dot-config';

function mockClock(now: number): ServerClock {
  return {
    serverNowMs: now,
    offsetMs: 0,
    skewPpm: 0,
    rttMs: 10,
    sampleCount: 1,
    serverNow: () => now,
  };
}

describe('complementColor', () => {
  it('inverts RGB channels', () => {
    expect(complementColor('#ff0000')).toBe('#00ffff');
    expect(complementColor('#00ff00')).toBe('#ff00ff');
  });
});

describe('maxRippleRadius', () => {
  it('reaches the farthest world corner from the bounce center', () => {
    expect(maxRippleRadius(960, 540, 1920, 1080)).toBeCloseTo(
      Math.hypot(960, 540),
      5,
    );
    expect(maxRippleRadius(0, 0, 1920, 1080)).toBeCloseTo(Math.hypot(1920, 1080), 5);
  });
});

describe('evaluateDotFrame', () => {
  it('returns empty shapes when dot anchor missing', () => {
    const frame = dotLayer.evaluateFrame({
      snapshot: { anchors: {}, meta: {}, contentData: null },
      clock: mockClock(1000),
      spatial: defaultSpatialMeta(),
    });
    expect(frame.shapes).toEqual([]);
  });

  it('evaluates circular dot bbox, complement background, and labels', () => {
    const at = 1000;
    const anchor = buildInitialDotAnchor(1920, 1080, at);
    const snapshot: CoreSnapshot = {
      anchors: { [DOT_CHANNEL_ID]: anchor },
      meta: {},
      contentData: null,
    };
    const spatial = defaultSpatialMeta();
    const frame = evaluateDotFrame(
      { snapshot, clock: mockClock(at + 500), spatial },
      { ripples: [], prevBounceCount: -1 },
    );

    const bg = frame.shapes.find((s) => s.label === 'bg');
    const dot = frame.shapes.find((s) => s.label === 'dot');
    expect(bg).toBeDefined();
    expect(dot).toBeDefined();
    expect(dot!.width).toBe(DOT_SQUARE_SIZE);
    expect(dot!.height).toBe(DOT_SQUARE_SIZE);
    expect(bg!.paint).toEqual({
      kind: 'solid',
      color: complementColor(
        dot!.paint.kind === 'solid' ? dot!.paint.color : '#000000',
      ),
    });
    expect(dot!.x).toBeGreaterThanOrEqual(0);
    expect(dot!.y).toBeGreaterThanOrEqual(0);
  });
});
