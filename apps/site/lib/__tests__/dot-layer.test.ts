import { describe, expect, it } from 'vitest';
import type { ServerClock } from '@syncframe/core/react';
import type { CoreSnapshot } from '@syncframe/core/server';
import { defaultSpatialMeta } from '@syncframe/spatial/server';
import { dotLayer } from '../dot-layer';
import { buildInitialDotAnchor } from '../dot';
import { DOT_CHANNEL_ID } from '../spatial-config';

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

describe('dotLayer.evaluateFrame', () => {
  it('returns empty shapes when dot anchor missing', () => {
    const frame = dotLayer.evaluateFrame({
      snapshot: { anchors: {}, meta: {}, contentData: null },
      clock: mockClock(1000),
      spatial: defaultSpatialMeta(),
    });
    expect(frame.shapes).toEqual([]);
  });

  it('evaluates dot position from anchor at serverNow', () => {
    const at = 1000;
    const anchor = buildInitialDotAnchor(1920, 1080, at);
    const snapshot: CoreSnapshot = {
      anchors: { [DOT_CHANNEL_ID]: anchor },
      meta: {},
      contentData: null,
    };
    const frame = dotLayer.evaluateFrame({
      snapshot,
      clock: mockClock(at + 500),
      spatial: defaultSpatialMeta(),
    });
    expect(frame.shapes).toHaveLength(1);
    expect(frame.shapes[0]!.width).toBe(200);
    expect(frame.shapes[0]!.height).toBe(150);
    expect(frame.shapes[0]!.x).toBeGreaterThanOrEqual(0);
    expect(frame.shapes[0]!.y).toBeGreaterThanOrEqual(0);
  });
});
