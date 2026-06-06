/**
 * @syncframe/core — clock offset estimation tests.
 *
 * The offset must be an epoch correction (`serverEpoch ≈ Date.now() + offset`).
 * These tests guard against the class of bug where the probe midpoint is taken
 * in a different clock domain (e.g. performance.now()), which would make the
 * offset as large as the epoch itself.
 */

import { describe, it, expect } from 'vitest';
import { estimateOffset } from '../useServerClock';

describe('estimateOffset', () => {
  it('is ~zero when client and server clocks agree (symmetric latency)', () => {
    // Probe sent at 1000, reply (server time 1050) received at 1100 → midpoint
    // 1050 matches the server time exactly.
    expect(estimateOffset(1050, 1000, 1100)).toBe(0);
  });

  it('is positive when the server clock is ahead of the client', () => {
    // Midpoint 1050, server says 1500 → client is 450ms behind.
    expect(estimateOffset(1500, 1000, 1100)).toBe(450);
  });

  it('is negative when the server clock is behind the client', () => {
    expect(estimateOffset(600, 1000, 1100)).toBe(-450);
  });

  it('uses the request midpoint to cancel out symmetric round-trip latency', () => {
    // 200ms RTT, perfectly synced clocks: server time equals the midpoint, so
    // the estimated offset is 0 regardless of how long the round trip took.
    const sentAt = 10_000;
    const receivedAt = 10_200;
    const trueServerAtMidpoint = 10_100;
    expect(estimateOffset(trueServerAtMidpoint, sentAt, receivedAt)).toBe(0);
  });

  it('stays a small skew for real epoch timestamps (regression guard)', () => {
    // The original bug mixed epoch server time with performance.now(), yielding
    // an offset ~= Date.now(). With consistent epoch inputs the offset is tiny.
    const sentAt = 1_780_000_000_000;
    const receivedAt = 1_780_000_000_040;
    const serverNow = 1_780_000_000_023;
    const offset = estimateOffset(serverNow, sentAt, receivedAt);
    expect(Math.abs(offset)).toBeLessThan(100);
    expect(offset).toBe(3);
  });
});
