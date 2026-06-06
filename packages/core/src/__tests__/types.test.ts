/**
 * @syncframe/core — type system tests.
 *
 * Validates the minimal protocol: consumers own all domain semantics,
 * core only stores opaque anchors dispatched by motion.kind.
 */

import { describe, it, expect } from 'vitest';
import type { Anchor, AnyAnchor, ScalarMotion } from '../types';
import { evaluateScalar } from '../evaluators';

describe('types', () => {
  describe('ScalarMotion', () => {
    it('accepts positive rate', () => {
      const m: ScalarMotion = { kind: 'scalar', ratePerMs: 0.001 };
      expect(m.ratePerMs).toBe(0.001);
    });

    it('accepts zero rate (paused)', () => {
      const m: ScalarMotion = { kind: 'scalar', ratePerMs: 0 };
      expect(m.ratePerMs).toBe(0);
    });

    it('accepts negative rate (countdown)', () => {
      const m: ScalarMotion = { kind: 'scalar', ratePerMs: -0.001 };
      expect(m.ratePerMs).toBe(-0.001);
    });
  });

  describe('AnyAnchor is opaque to core', () => {
    it('accepts any motion.kind string', () => {
      const anchors: AnyAnchor[] = [
        { at: 0, value: 0, motion: { kind: 'scalar' } },
        { at: 0, value: 0, motion: { kind: 'position2d' } },
        { at: 0, value: 0, motion: { kind: 'playback' } },
        { at: 0, value: 0, motion: { kind: 'color' } },
        { at: 0, value: 0, motion: { kind: 'completely-made-up' } },
      ];
      const kinds = anchors.map((a) => a.motion.kind);
      expect(new Set(kinds).size).toBe(5);
    });

    it('core stores anchor values without inspection', () => {
      const anchors: AnyAnchor[] = [
        { at: 0, value: 42, motion: { kind: 'number' } },
        { at: 0, value: 'hello', motion: { kind: 'string' } },
        { at: 0, value: [1, 2, 3], motion: { kind: 'array' } },
        { at: 0, value: { nested: true }, motion: { kind: 'object' } },
        { at: 0, value: null, motion: { kind: 'null' } },
      ];
      expect(anchors).toHaveLength(5);
    });

    it('consumers define their own anchor shapes', () => {
      // Video playback
      const video: AnyAnchor = {
        at: 1000,
        value: 45.5,
        motion: { kind: 'scalar' },
      };
      expect(video.motion.kind).toBe('scalar');

      // 2D position (spatial's concern, not core's)
      const position: AnyAnchor = {
        at: 2000,
        value: { x: 100, y: 200 },
        motion: { kind: 'linear2d' },
      };
      expect(position.motion.kind).toBe('linear2d');

      // Color
      const color: AnyAnchor = {
        at: 3000,
        value: [255, 0, 0],
        motion: { kind: 'color-lerp' },
      };
      expect(color.motion.kind).toBe('color-lerp');
    });
  });

  describe('Anchor<T, M> type safety with evaluateScalar', () => {
    it('strongly typed scalar anchor evaluates correctly', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 10,
        motion: { kind: 'scalar', ratePerMs: 0.001 },
      };
      // 1 second later: 10 + 0.001 * 1000 = 11
      expect(evaluateScalar(anchor, 2000)).toBe(11);
    });

    it('paused anchor stays fixed', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 1000,
        value: 45.5,
        motion: { kind: 'scalar', ratePerMs: 0 },
      };
      expect(evaluateScalar(anchor, 99999)).toBe(45.5);
    });

    it('negative rate counts down', () => {
      const anchor: Anchor<number, ScalarMotion> = {
        at: 0,
        value: 60,
        motion: { kind: 'scalar', ratePerMs: -0.001 },
      };
      expect(evaluateScalar(anchor, 10000)).toBe(50);
    });
  });

  describe('structural contracts', () => {
    it('anchor.at is always a number', () => {
      const anchors: AnyAnchor[] = [
        { at: 0, value: 1, motion: { kind: 'a' } },
        { at: -1000, value: 1, motion: { kind: 'b' } },
        { at: 1e12, value: 1, motion: { kind: 'c' } },
        { at: 0.5, value: 1, motion: { kind: 'd' } },
      ];
      anchors.forEach((a) => expect(typeof a.at).toBe('number'));
    });

    it('motion.kind is always a string', () => {
      const anchors: AnyAnchor[] = [
        { at: 0, value: 1, motion: { kind: 'a' } },
        { at: 0, value: 1, motion: { kind: '' } },
        { at: 0, value: 1, motion: { kind: 'very-long-kind-name-with-dashes' } },
      ];
      anchors.forEach((a) => expect(typeof a.motion.kind).toBe('string'));
    });
  });
});
