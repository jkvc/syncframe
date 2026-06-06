/**
 * @syncframe/core — evaluateScalar tests.
 *
 * Pure functions: no Date.now(), no Math.random(), no DOM. Same inputs always
 * produce bit-identical outputs. These tests validate that contract.
 */

import { describe, it, expect } from 'vitest';
import { evaluateScalar } from '../evaluators';
import type { Anchor, ScalarMotion } from '../types';

describe('evaluateScalar', () => {
  describe('basic rate extrapolation', () => {
    it('returns anchor value when dt is zero', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 42,
        motion: { kind: 'scalar', ratePerMs: 0.5 },
      };
      expect(evaluateScalar(anchor, 1000)).toBe(42);
    });

    it('extrapolates forward in time with positive rate', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 10,
        motion: { kind: 'scalar', ratePerMs: 0.01 }, // 10 units per second
      };
      // 100ms forward: 10 + 0.01 * 100 = 11
      expect(evaluateScalar(anchor, 1100)).toBe(11);
    });

    it('extrapolates forward with larger dt', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 0,
        motion: { kind: 'scalar', ratePerMs: 0.001 }, // 1 unit per second
      };
      // 5000ms forward: 0 + 0.001 * 5000 = 5
      expect(evaluateScalar(anchor, 5000)).toBe(5);
    });

    it('extrapolates backward in time (negative dt)', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 2000,
        value: 100,
        motion: { kind: 'scalar', ratePerMs: 0.1 },
      };
      // 500ms backward: 100 + 0.1 * -500 = 50
      expect(evaluateScalar(anchor, 1500)).toBe(50);
    });

    it('handles zero rate (paused state)', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 42,
        motion: { kind: 'scalar', ratePerMs: 0 },
      };
      expect(evaluateScalar(anchor, 2000)).toBe(42);
      expect(evaluateScalar(anchor, 5000)).toBe(42);
    });

    it('handles negative rate (countdown or reverse)', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 100,
        motion: { kind: 'scalar', ratePerMs: -0.01 }, // counting down
      };
      // 1000ms forward: 100 + (-0.01) * 1000 = 90
      expect(evaluateScalar(anchor, 2000)).toBe(90);
      // 5000ms forward: 100 + (-0.01) * 5000 = 50
      expect(evaluateScalar(anchor, 6000)).toBe(50);
    });

    it('handles high rates (2x, 4x speed)', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 0,
        motion: { kind: 'scalar', ratePerMs: 0.002 }, // 2x speed
      };
      // 1000ms forward: 0 + 0.002 * 1000 = 2
      expect(evaluateScalar(anchor, 1000)).toBe(2);

      const fastAnchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 0,
        motion: { kind: 'scalar', ratePerMs: 0.004 }, // 4x speed
      };
      expect(evaluateScalar(fastAnchor, 1000)).toBe(4);
    });
  });

  describe('fractional rates and precision', () => {
    it('handles very small rates', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 0,
        motion: { kind: 'scalar', ratePerMs: 0.000001 }, // 1 unit per 1000 seconds
      };
      // 10000ms forward: 0 + 0.000001 * 10000 = 0.01
      expect(evaluateScalar(anchor, 10000)).toBeCloseTo(0.01, 10);
    });

    it('handles floating point arithmetic correctly', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 10.5,
        motion: { kind: 'scalar', ratePerMs: 0.0015 },
      };
      // 200ms forward: 10.5 + 0.0015 * 200 = 10.8
      expect(evaluateScalar(anchor, 1200)).toBeCloseTo(10.8, 10);
    });

    it('preserves precision across large time deltas', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 0,
        motion: { kind: 'scalar', ratePerMs: 0.001 },
      };
      // 1 hour = 3,600,000ms: 0 + 0.001 * 3600000 = 3600
      expect(evaluateScalar(anchor, 3600000)).toBe(3600);
    });
  });

  describe('determinism', () => {
    it('produces identical results for identical inputs', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1234,
        value: 56.78,
        motion: { kind: 'scalar', ratePerMs: 0.00123 },
      };
      const result1 = evaluateScalar(anchor, 5678);
      const result2 = evaluateScalar(anchor, 5678);
      expect(result1).toBe(result2);
    });

    it('produces different results for different server times', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 10,
        motion: { kind: 'scalar', ratePerMs: 0.01 },
      };
      const result1 = evaluateScalar(anchor, 2000);
      const result2 = evaluateScalar(anchor, 3000);
      expect(result1).not.toBe(result2);
    });
  });

  describe('consumer-defined use cases', () => {
    it('video playback: 1 second per second', () => {
      // Anchor at server time 1000, video at 10 seconds, playing at 1x
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 10, // 10 seconds into video
        motion: { kind: 'scalar', ratePerMs: 0.001 }, // 1 second per 1000ms
      };
      // 5 seconds of server time later: video should be at 15 seconds
      expect(evaluateScalar(anchor, 6000)).toBe(15);
    });

    it('video paused: rate = 0', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 45.5, // paused at 45.5 seconds
        motion: { kind: 'scalar', ratePerMs: 0 },
      };
      // No matter how much time passes, stays at 45.5
      expect(evaluateScalar(anchor, 2000)).toBe(45.5);
      expect(evaluateScalar(anchor, 10000)).toBe(45.5);
    });

    it('video 2x speed: rate = 0.002', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 10,
        motion: { kind: 'scalar', ratePerMs: 0.002 }, // 2 seconds per 1000ms
      };
      // 2 seconds of server time: video advances 4 seconds
      expect(evaluateScalar(anchor, 3000)).toBe(14);
    });

    it('audio playback: high precision sample rate', () => {
      // 44.1kHz audio, value = sample position
      const sampleRate = 44100;
      const ratePerMs = sampleRate / 1000; // 44.1 samples per ms
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 0,
        motion: { kind: 'scalar', ratePerMs },
      };
      // 1000ms = 44100 samples
      expect(evaluateScalar(anchor, 1000)).toBe(44100);
    });

    it('countdown timer: negative rate', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 60, // 60 second countdown
        motion: { kind: 'scalar', ratePerMs: -0.001 }, // -1 per second
      };
      expect(evaluateScalar(anchor, 10000)).toBe(50); // 50 seconds left
      expect(evaluateScalar(anchor, 60000)).toBe(0);  // time's up
      expect(evaluateScalar(anchor, 70000)).toBe(-10); // overtime
    });

    it('progress bar: rate from 0 to 1', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 0.25, // 25% complete
        motion: { kind: 'scalar', ratePerMs: 0.0001 }, // 10% per second
      };
      // 5 seconds later: 25% + 50% = 75%
      expect(evaluateScalar(anchor, 5000)).toBeCloseTo(0.75, 10);
    });
  });

  describe('edge cases', () => {
    it('handles negative anchor times', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: -1000,
        value: 10,
        motion: { kind: 'scalar', ratePerMs: 0.01 },
      };
      expect(evaluateScalar(anchor, 0)).toBe(20);
    });

    it('handles negative values', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: -50,
        motion: { kind: 'scalar', ratePerMs: 0.1 },
      };
      expect(evaluateScalar(anchor, 1000)).toBe(50);
    });

    it('handles very large time values', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1e12,
        value: 0,
        motion: { kind: 'scalar', ratePerMs: 0.001 },
      };
      expect(evaluateScalar(anchor, 1e12 + 1000)).toBe(1);
    });

    it('handles zero anchor time', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 100,
        motion: { kind: 'scalar', ratePerMs: -0.01 },
      };
      expect(evaluateScalar(anchor, 0)).toBe(100);
      expect(evaluateScalar(anchor, 1000)).toBe(90);
    });
  });
});
