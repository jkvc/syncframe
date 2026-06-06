/**
 * @syncframe/core — exponential chase-smoother.
 *
 * The client always renders `displayedValue`. Internally it chases the
 * `ideal` (evaluated) value. If the network goes down, `ideal` keeps
 * advancing from the cached anchor and the displayed value continues
 * at the last known speed. Graceful degradation, no glitch.
 */

import type { SmootherOptions } from './types';

const DEFAULTS: Required<SmootherOptions> = {
  timeConstantMs: 400,
  snapThreshold: 2,
};

/**
 * Apply one tick of exponential chase smoothing.
 *
 * @param ideal — the evaluated (target) value from anchor math
 * @param current — the currently displayed value
 * @param dtMs — wall-clock delta since last tick (ms)
 * @returns the new displayed value after smoothing
 */
export function smoothStep(
  ideal: number,
  current: number,
  dtMs: number,
  options?: SmootherOptions,
): number {
  const { timeConstantMs, snapThreshold } = { ...DEFAULTS, ...options };

  const error = ideal - current;

  // First render, refresh, large jitter spike — just jump
  if (Math.abs(error) > snapThreshold) {
    return ideal;
  }

  const k = 1 - Math.exp(-dtMs / timeConstantMs);
  return current + error * k;
}

/**
 * Create a smoother that maintains state across ticks.
 */
export function createSmoother(initialValue: number, options?: SmootherOptions) {
  const opts = { ...DEFAULTS, ...options };
  let value = initialValue;

  return {
    update(ideal: number, dtMs: number): number {
      value = smoothStep(ideal, value, dtMs, opts);
      return value;
    },
    get value() {
      return value;
    },
    set(v: number) {
      value = v;
    },
    reset(v: number) {
      value = v;
    },
  };
}
