import { describe, it, expect } from 'vitest';
import {
  defaultAnchor,
  reduceTimer,
  currentValue,
  speedMultiplier,
  isRunning,
  isTimerAction,
  RATE_1X,
  TIMER_DEFAULT_SECONDS,
  type TimerAnchor,
} from '../timer';

describe('timer reducer', () => {
  describe('defaultAnchor', () => {
    it('starts paused at 60s', () => {
      const a = defaultAnchor(1000);
      expect(a).toEqual({
        at: 1000,
        value: TIMER_DEFAULT_SECONDS,
        motion: { kind: 'scalar', ratePerMs: 0 },
      });
      expect(isRunning(a)).toBe(false);
      expect(speedMultiplier(a)).toBe(0);
    });
  });

  describe('currentValue', () => {
    it('counts down at the right wall-clock rate (1s per second at 1x)', () => {
      const a: TimerAnchor = { at: 0, value: 60, motion: { kind: 'scalar', ratePerMs: -RATE_1X } };
      // 1000ms later → 59.0, not 0. (Regression guard for the -1 rate bug.)
      expect(currentValue(a, 1000)).toBeCloseTo(59, 10);
      expect(currentValue(a, 10_000)).toBeCloseTo(50, 10);
    });

    it('clamps at zero instead of going negative', () => {
      const a: TimerAnchor = { at: 0, value: 60, motion: { kind: 'scalar', ratePerMs: -RATE_1X } };
      expect(currentValue(a, 120_000)).toBe(0);
    });

    it('holds steady while paused', () => {
      const a: TimerAnchor = { at: 0, value: 42.5, motion: { kind: 'scalar', ratePerMs: 0 } };
      expect(currentValue(a, 9_999)).toBe(42.5);
    });
  });

  describe('reset', () => {
    it('returns a fresh paused 60s anchor re-anchored at now', () => {
      const running: TimerAnchor = { at: 0, value: 12, motion: { kind: 'scalar', ratePerMs: -RATE_1X } };
      expect(reduceTimer(running, 'reset', 5000)).toEqual(defaultAnchor(5000));
    });
  });

  describe('toggle (pause/resume)', () => {
    it('resume from paused starts a 1x countdown at the frozen value', () => {
      const paused: TimerAnchor = { at: 0, value: 30, motion: { kind: 'scalar', ratePerMs: 0 } };
      const next = reduceTimer(paused, 'toggle', 2000);
      expect(next).toEqual({ at: 2000, value: 30, motion: { kind: 'scalar', ratePerMs: -RATE_1X } });
      expect(speedMultiplier(next)).toBe(1);
    });

    it('pause freezes the evaluated value at the moment of pausing', () => {
      // Running from 60 at 1x; 10s later it is at 50. Pausing should snapshot 50.
      const running: TimerAnchor = { at: 0, value: 60, motion: { kind: 'scalar', ratePerMs: -RATE_1X } };
      const next = reduceTimer(running, 'toggle', 10_000);
      expect(next.motion.ratePerMs).toBe(0);
      expect(next.value).toBeCloseTo(50, 10);
      expect(next.at).toBe(10_000);
    });

    it('pause clamps a value that has already run past zero', () => {
      const running: TimerAnchor = { at: 0, value: 60, motion: { kind: 'scalar', ratePerMs: -RATE_1X } };
      const next = reduceTimer(running, 'toggle', 200_000);
      expect(next.value).toBe(0);
    });
  });

  describe('speed', () => {
    it('cycles 1x → 2x → 4x → 1x preserving the current value', () => {
      let a: TimerAnchor = { at: 0, value: 40, motion: { kind: 'scalar', ratePerMs: -RATE_1X } };

      a = reduceTimer(a, 'speed', 0);
      expect(speedMultiplier(a)).toBe(2);
      expect(a.motion.ratePerMs).toBe(-RATE_1X * 2);
      expect(a.value).toBeCloseTo(40, 10);

      a = reduceTimer(a, 'speed', 0);
      expect(speedMultiplier(a)).toBe(4);

      a = reduceTimer(a, 'speed', 0);
      expect(speedMultiplier(a)).toBe(1);
    });

    it('advances the value correctly across a speed change', () => {
      // 60 at 1x; after 10s → 50, then switch to 2x; 10s more → 30.
      let a: TimerAnchor = { at: 0, value: 60, motion: { kind: 'scalar', ratePerMs: -RATE_1X } };
      a = reduceTimer(a, 'speed', 10_000); // now 2x, value 50, at 10_000
      expect(a.value).toBeCloseTo(50, 10);
      expect(currentValue(a, 20_000)).toBeCloseTo(30, 10);
    });
  });

  describe('isTimerAction', () => {
    it('accepts known actions and rejects everything else', () => {
      expect(isTimerAction('reset')).toBe(true);
      expect(isTimerAction('toggle')).toBe(true);
      expect(isTimerAction('speed')).toBe(true);
      expect(isTimerAction('set')).toBe(false);
      expect(isTimerAction(42)).toBe(false);
      expect(isTimerAction(undefined)).toBe(false);
    });
  });
});
