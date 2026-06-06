/**
 * @syncframe/core — smoothStep and createSmoother tests.
 *
 * Key insight: smoothStep snaps to ideal when |error| > snapThreshold.
 * Tests below use snapThreshold values carefully to exercise both paths.
 */

import { describe, it, expect } from 'vitest';
import { smoothStep, createSmoother } from '../smoother';
import type { SmootherOptions } from '../types';

describe('smoothStep', () => {
    describe('snapping behavior (|error| > snapThreshold)', () => {
        it('snaps to ideal when error exceeds snapThreshold', () => {
            // error = 100 > threshold 10 → snap
            expect(smoothStep(100, 0, 16, { snapThreshold: 10 })).toBe(100);
        });

        it('snaps for large negative errors', () => {
            expect(smoothStep(-100, 0, 16, { snapThreshold: 10 })).toBe(-100);
        });

        it('uses default snapThreshold of 2 (error > 2 snaps)', () => {
            // error = 10 > default 2 → snap
            expect(smoothStep(12, 2, 16)).toBe(12);
        });
    });

    describe('smoothing behavior (|error| <= snapThreshold)', () => {
        // Use large snapThreshold so smoothing is exercised
        const THRESHOLD = 200;

        it('does not snap when error is within threshold', () => {
            const result = smoothStep(5, 0, 16, { snapThreshold: THRESHOLD });
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(5);
        });

        it('converges toward ideal over multiple steps', () => {
            let current = 0;
            const ideal = 100;
            const opts: SmootherOptions = { timeConstantMs: 100, snapThreshold: THRESHOLD };

            current = smoothStep(ideal, current, 16, opts);
            expect(current).toBeGreaterThan(0);
            expect(current).toBeLessThan(100);

            for (let i = 0; i < 50; i++) {
                current = smoothStep(ideal, current, 16, opts);
            }
            // After 50 steps, should be very close (within 0.5 of target)
            expect(current).toBeCloseTo(100, 0);
        });

        it('moves faster with smaller timeConstant', () => {
            const fast = smoothStep(100, 0, 100, { timeConstantMs: 50, snapThreshold: THRESHOLD });
            const slow = smoothStep(100, 0, 100, { timeConstantMs: 500, snapThreshold: THRESHOLD });
            expect(fast).toBeGreaterThan(slow);
        });

        it('moves faster with larger dt', () => {
            const opts = { timeConstantMs: 100, snapThreshold: THRESHOLD };
            const small = smoothStep(100, 0, 10, opts);
            const large = smoothStep(100, 0, 100, opts);
            expect(small).toBeLessThan(large);
        });

        it('handles zero dt (no movement)', () => {
            // error=0.5 < 200, k=1-exp(0)=0, so no change
            const result = smoothStep(1, 0.5, 0, { snapThreshold: THRESHOLD });
            expect(result).toBe(0.5);
        });

        it('chases in positive direction', () => {
            const result = smoothStep(100, 50, 16, { snapThreshold: THRESHOLD });
            expect(result).toBeGreaterThan(50);
            expect(result).toBeLessThan(100);
        });

        it('chases in negative direction', () => {
            const result = smoothStep(-100, -50, 16, { snapThreshold: THRESHOLD });
            expect(result).toBeLessThan(-50);
            expect(result).toBeGreaterThan(-100);
        });
    });

    describe('edge cases', () => {
        it('returns current when already at ideal (zero error)', () => {
            expect(smoothStep(42, 42, 16)).toBe(42);
        });

        it('handles very small errors within threshold', () => {
            const result = smoothStep(0.5, 0, 16, { snapThreshold: 1 });
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(0.5);
        });

        it('handles negative current with positive ideal', () => {
            const result = smoothStep(50, -10, 16, { snapThreshold: 200 });
            expect(result).toBeGreaterThan(-10);
        });
    });
});

describe('createSmoother', () => {
    it('initializes with given value', () => {
        expect(createSmoother(42).value).toBe(42);
    });

    it('snaps when error exceeds threshold', () => {
        const smoother = createSmoother(0, { snapThreshold: 2 });
        smoother.update(100, 16);
        expect(smoother.value).toBe(100);
    });

    it('smooths when error is within threshold', () => {
        const smoother = createSmoother(0, { snapThreshold: 200 });
        smoother.update(100, 16);
        expect(smoother.value).toBeGreaterThan(0);
        expect(smoother.value).toBeLessThan(100);
    });

    it('converges toward target over many steps', () => {
        const smoother = createSmoother(0, { snapThreshold: 200, timeConstantMs: 100 });
        // First update will be within the smooth threshold
        for (let i = 0; i < 60; i++) {
            smoother.update(100, 16);
        }
        // After 60 steps of smoothing, should be very close (within 0.5 of target)
        expect(smoother.value).toBeCloseTo(100, 0);
    });

    it('reset changes value immediately', () => {
        const smoother = createSmoother(50);
        smoother.update(100, 16);
        smoother.reset(0);
        expect(smoother.value).toBe(0);
    });

    it('set changes value directly', () => {
        const smoother = createSmoother(0);
        smoother.set(42);
        expect(smoother.value).toBe(42);
    });

    it('respects timeConstantMs', () => {
        const fast = createSmoother(0, { timeConstantMs: 50, snapThreshold: 200 });
        const slow = createSmoother(0, { timeConstantMs: 500, snapThreshold: 200 });

        fast.update(100, 100); // smooth
        slow.update(100, 100); // smooth
        expect(fast.value).toBeGreaterThan(slow.value);
    });

    it('maintains separate state for each instance', () => {
        const THRESHOLD = 200; // large enough to smooth
        const a = createSmoother(0, { snapThreshold: THRESHOLD });
        const b = createSmoother(0, { snapThreshold: THRESHOLD });

        a.update(100, 16);
        b.update(-100, 16);

        expect(a.value).toBeGreaterThan(0);
        expect(b.value).toBeLessThan(0);
    });

    it('maintains state across updates', () => {
        const smoother = createSmoother(0, { timeConstantMs: 100, snapThreshold: 200 });
        smoother.update(100, 1); // smooth toward 100
        const after1 = smoother.value;
        expect(after1).toBeGreaterThan(0);
        smoother.update(100, 16); // keep chasing
        expect(smoother.value).toBeGreaterThan(after1);
    });

    it('handles rapid target changes', () => {
        const smoother = createSmoother(0, { snapThreshold: 200 });
        smoother.update(50, 16);
        const v1 = smoother.value;
        smoother.update(100, 16);
        const v2 = smoother.value;
        expect(v2).toBeGreaterThan(v1);
    });
});
