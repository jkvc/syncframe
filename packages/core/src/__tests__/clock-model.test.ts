/**
 * @syncframe/core — clock offset+skew model tests.
 *
 * fitClockModel recovers both the offset and the drift slope (skew) from a set
 * of (localMid, offset) samples, degrading to offset-only when there isn't
 * enough leverage. projectServerNow applies the model to a local time.
 */

import { describe, it, expect } from 'vitest';
import {
  fitClockModel,
  projectServerNow,
  effectiveOffset,
  IDENTITY_CLOCK_MODEL,
  type ClockSample,
} from '../clock-model';

describe('fitClockModel', () => {
  it('returns the identity model for no samples', () => {
    expect(fitClockModel([])).toEqual(IDENTITY_CLOCK_MODEL);
  });

  it('returns offset-only (skew 0) for a single sample', () => {
    const model = fitClockModel([{ localMidMs: 5_000, offsetMs: 42 }]);
    expect(model.skew).toBe(0);
    expect(model.refLocalMs).toBe(5_000);
    expect(model.offsetMs).toBe(42);
  });

  it('does not trust a slope when the time span is too short', () => {
    // Three samples within 200ms — nowhere near the 10s span needed for skew.
    const samples: ClockSample[] = [
      { localMidMs: 0, offsetMs: 100 },
      { localMidMs: 100, offsetMs: 120 },
      { localMidMs: 200, offsetMs: 140 },
    ];
    const model = fitClockModel(samples);
    expect(model.skew).toBe(0);
    // Falls back to the (weighted) mean offset.
    expect(model.offsetMs).toBeCloseTo(120, 6);
  });

  it('recovers a linear drift over a long baseline', () => {
    const trueSkew = 5e-5; // 50 ppm
    const ref = 30_000;
    const baseOffset = 100;
    const samples: ClockSample[] = [0, 15_000, 30_000, 45_000, 60_000].map((x) => ({
      localMidMs: x,
      offsetMs: baseOffset + trueSkew * (x - ref),
    }));

    const model = fitClockModel(samples);
    expect(model.skew).toBeCloseTo(trueSkew, 9);
    // Offset at the model's reference (weighted-mean local time = 30_000).
    expect(projectServerNow(model, 30_000)).toBeCloseTo(30_000 + baseOffset, 6);
    // Effective offset grows linearly with the drift away from the reference.
    expect(effectiveOffset(model, 60_000)).toBeCloseTo(baseOffset + trueSkew * 30_000, 6);
  });

  it('stays ~zero skew for a constant offset across a long baseline', () => {
    const samples: ClockSample[] = [0, 20_000, 40_000, 60_000].map((x) => ({
      localMidMs: x,
      offsetMs: 250,
    }));
    const model = fitClockModel(samples);
    expect(model.skew).toBeCloseTo(0, 9);
    expect(model.offsetMs).toBeCloseTo(250, 6);
  });

  it('clamps an implausibly large slope to the max skew (1000 ppm)', () => {
    // Offsets jump 10s of seconds across a 30s span → slope far beyond any real
    // crystal drift. Must be clamped rather than trusted.
    const samples: ClockSample[] = [
      { localMidMs: 0, offsetMs: 0 },
      { localMidMs: 15_000, offsetMs: 30_000 },
      { localMidMs: 30_000, offsetMs: 60_000 },
    ];
    const model = fitClockModel(samples);
    expect(Math.abs(model.skew)).toBeLessThanOrEqual(1e-3);
    expect(model.skew).toBeCloseTo(1e-3, 12);
  });

  it('weights low-RTT samples more heavily than noisy ones', () => {
    // Two trustworthy samples near offset 100 and one noisy, down-weighted
    // outlier. The fit should stay close to the trusted value.
    const samples: ClockSample[] = [
      { localMidMs: 0, offsetMs: 100, weight: 1 },
      { localMidMs: 100, offsetMs: 100, weight: 1 },
      { localMidMs: 200, offsetMs: 5_000, weight: 0.001 },
    ];
    const model = fitClockModel(samples);
    expect(model.offsetMs).toBeLessThan(110);
  });
});

describe('projectServerNow', () => {
  it('returns local time unchanged for the identity model', () => {
    expect(projectServerNow(IDENTITY_CLOCK_MODEL, 1_780_000_000_000)).toBe(1_780_000_000_000);
  });

  it('adds a constant offset when skew is zero', () => {
    const model = { refLocalMs: 0, offsetMs: 200, skew: 0 };
    expect(projectServerNow(model, 1_000)).toBe(1_200);
  });

  it('applies offset and skew relative to the reference', () => {
    const model = { refLocalMs: 1_000, offsetMs: 50, skew: 1e-4 };
    // At the reference: just the offset.
    expect(projectServerNow(model, 1_000)).toBeCloseTo(1_050, 9);
    // 10_000ms past the reference: offset + skew*10_000 = 50 + 1 = 51.
    expect(projectServerNow(model, 11_000)).toBeCloseTo(11_000 + 51, 9);
  });
});
