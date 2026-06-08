import { describe, expect, it } from 'vitest';
import type { ServerClock } from '@syncframe/core/react';
import { buildRingInitialMeta } from '../ring-initial-meta';
import {
  RING_PETAL_COUNT,
  RING_SPIN_RATE_PER_MS,
  buildInitialRingSpinAnchor,
  layoutRingPetals,
  reduceRingSpin,
  ringSpinAngle,
} from '../ring';
import { evaluateRingFrame } from '../ring-layer';
import { RING_SPIN_CHANNEL } from '../ring-config';

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

describe('buildRingInitialMeta', () => {
  it('seeds four quadrant screens in a 500×500 world', () => {
    const meta = buildRingInitialMeta();
    expect(meta.worldBbox).toEqual({ width: 500, height: 500 });
    expect(Object.keys(meta.screens).sort()).toEqual(['ne', 'nw', 'se', 'sw']);
    expect(meta.screens.nw!.pose).toEqual({
      worldX: 0,
      worldY: 0,
      worldWidth: 250,
      worldHeight: 250,
    });
    expect(meta.screens.se!.pose).toEqual({
      worldX: 250,
      worldY: 250,
      worldWidth: 250,
      worldHeight: 250,
    });
  });
});

describe('layoutRingPetals', () => {
  it('places twelve petals on the orbit', () => {
    const petals = layoutRingPetals(0);
    expect(petals).toHaveLength(RING_PETAL_COUNT);
    expect(petals[0]!.diameter).toBe(44);
  });
});

describe('reduceRingSpin', () => {
  it('starts paused and resumes from frozen angle', () => {
    const initial = buildInitialRingSpinAnchor(1_000);
    expect(initial.motion.ratePerMs).toBe(0);

    const running = reduceRingSpin(initial, 'start', 1_000);
    expect(running.motion.ratePerMs).toBe(RING_SPIN_RATE_PER_MS);

    const atAngle = reduceRingSpin(running, 'pause', 3_000);
    expect(atAngle.motion.ratePerMs).toBe(0);
    expect(atAngle.value).not.toBe(0);

    const resumed = reduceRingSpin(atAngle, 'start', 4_000);
    expect(resumed.motion.ratePerMs).toBe(RING_SPIN_RATE_PER_MS);
    expect(resumed.value).toBe(atAngle.value);
    expect(resumed.at).toBe(4_000);
  });

  it('resume preserves frozen value without re-evaluating paused anchor', () => {
    const paused = {
      at: 2_000,
      value: 1.25,
      motion: { kind: 'scalar' as const, ratePerMs: 0 },
    };
    const resumed = reduceRingSpin(paused, 'start', 5_000);
    expect(resumed.value).toBe(1.25);
    expect(resumed.at).toBe(5_000);
  });
});

describe('evaluateRingFrame', () => {
  it('returns background and twelve petal shapes', () => {
    const at = 1_000;
    const frame = evaluateRingFrame({
      snapshot: {
        anchors: { [RING_SPIN_CHANNEL]: buildInitialRingSpinAnchor(at) },
        meta: {},
        contentData: null,
      },
      clock: mockClock(at + 250),
      spatial: buildRingInitialMeta(),
    });

    expect(frame.shapes.find((s) => s.label === 'bg')).toBeDefined();
    expect(frame.shapes.filter((s) => s.label?.startsWith('petal-'))).toHaveLength(12);
  });

  it('advances spin angle counter-clockwise while running', () => {
    const anchor = reduceRingSpin(null, 'start', 0);
    const early = ringSpinAngle(anchor, 1_000);
    const later = ringSpinAngle(anchor, 2_000);
    expect(later).toBeLessThan(early);
  });
});
