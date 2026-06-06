/**
 * Timer demo — domain logic for the global countdown.
 *
 * This is the consumer layer on top of @syncframe/core. Core knows nothing
 * about "60 seconds", "pause", or "2x speed"; it only understands scalar
 * anchors (`value + ratePerMs * dt`). All of that domain meaning lives here.
 *
 * Everything in this module is pure and isomorphic — the API route, the React
 * client, and the unit tests all import the same functions so the value shown
 * in the browser is computed by exactly the same math the server reduces with.
 */

// Import from core's `/server` entry (React-free) so this isomorphic module
// never pulls @syncframe/core's hooks into a server bundle.
import { evaluateScalar } from '@syncframe/core/server';
import type { Anchor, ScalarMotion } from '@syncframe/core/server';

export type TimerAnchor = Anchor<number, ScalarMotion>;

export type TimerAction = 'reset' | 'toggle' | 'speed';

/**
 * The timer is a single global room with one anchor channel. Kept here (not in
 * the Redis adapter) so client components can import them without pulling the
 * server-only Redis module into the browser bundle.
 */
export const ROOM_ID = 'global';
export const CHANNEL_ID = 'timer';

/** Countdown start value, in seconds. */
export const TIMER_DEFAULT_SECONDS = 60;

/**
 * Rate for 1x playback. The timer value is in *seconds* and `ratePerMs` is
 * "units per millisecond" (core's convention), so 1 second per second is
 * 1 / 1000 = 0.001 units/ms. Countdown ⇒ negative.
 */
export const RATE_1X = 0.001;

/** Speed multipliers cycled by the speed control, in order. */
export const SPEED_STEPS = [1, 2, 4] as const;

/** Paused, full countdown — the cold-start state. */
export function defaultAnchor(now: number): TimerAnchor {
  return { at: now, value: TIMER_DEFAULT_SECONDS, motion: { kind: 'scalar', ratePerMs: 0 } };
}

/**
 * Current displayed value, clamped at 0 so the countdown never shows a
 * negative number once it bottoms out.
 */
export function currentValue(anchor: TimerAnchor, now: number): number {
  return Math.max(0, evaluateScalar(anchor, now));
}

/** Whether the anchor is actively counting (non-zero rate). */
export function isRunning(anchor: TimerAnchor): boolean {
  return anchor.motion.ratePerMs !== 0;
}

/** Speed multiplier of an anchor: 1 / 2 / 4 while running, 0 while paused. */
export function speedMultiplier(anchor: TimerAnchor): number {
  return Math.round(Math.abs(anchor.motion.ratePerMs) / RATE_1X);
}

/** Build a running anchor at the given value and integer speed multiplier. */
function runningAnchor(now: number, value: number, multiplier: number): TimerAnchor {
  return { at: now, value, motion: { kind: 'scalar', ratePerMs: -RATE_1X * multiplier } };
}

/**
 * Reduce the current anchor under an action, producing the next anchor to
 * persist and broadcast. Pure: same (current, action, now) ⇒ same result.
 *
 * Re-anchoring on every action (snapshot the current value at `now`, then set
 * the new motion) is what keeps every browser in sync — each client evaluates
 * the broadcast anchor against its own server-synced clock and lands on the
 * same number regardless of when the event arrives.
 */
export function reduceTimer(current: TimerAnchor, action: TimerAction, now: number): TimerAnchor {
  const value = currentValue(current, now);

  switch (action) {
    case 'reset':
      return defaultAnchor(now);

    case 'toggle':
      // Pause: freeze at the current value. Resume: count down at 1x.
      return isRunning(current)
        ? { at: now, value, motion: { kind: 'scalar', ratePerMs: 0 } }
        : runningAnchor(now, value, 1);

    case 'speed': {
      // Cycle 1x → 2x → 4x → 1x. No-op intent while paused (the UI disables
      // it), but if invoked we still start it running at the next speed.
      const currentMult = speedMultiplier(current) || 1;
      const idx = SPEED_STEPS.indexOf(currentMult as (typeof SPEED_STEPS)[number]);
      const nextMult = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
      return runningAnchor(now, value, nextMult);
    }
  }
}

const VALID_ACTIONS: ReadonlySet<string> = new Set<TimerAction>(['reset', 'toggle', 'speed']);

export function isTimerAction(value: unknown): value is TimerAction {
  return typeof value === 'string' && VALID_ACTIONS.has(value);
}
