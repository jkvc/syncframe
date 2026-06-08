import { describe, expect, it } from 'vitest';
import { isValidScreenName, normalizeScreenPose } from '../types';

describe('isValidScreenName', () => {
  it('accepts valid names', () => {
    expect(isValidScreenName('desk-left')).toBe(true);
    expect(isValidScreenName('Screen1')).toBe(true);
  });

  it('rejects empty or invalid names', () => {
    expect(isValidScreenName('')).toBe(false);
    expect(isValidScreenName('has spaces')).toBe(false);
    expect(isValidScreenName('a'.repeat(33))).toBe(false);
  });
});

describe('normalizeScreenPose', () => {
  it('accepts a valid pose', () => {
    expect(
      normalizeScreenPose({
        worldX: 10,
        worldY: 20,
        worldWidth: 400,
        worldHeight: 300,
        rotationDeg: 0,
      }),
    ).toEqual({
      worldX: 10,
      worldY: 20,
      worldWidth: 400,
      worldHeight: 300,
      rotationDeg: 0,
    });
  });

  it('rejects non-positive dimensions', () => {
    expect(
      normalizeScreenPose({
        worldX: 0,
        worldY: 0,
        worldWidth: 0,
        worldHeight: 100,
      }),
    ).toBeNull();
  });

  it('rejects non-finite values', () => {
    expect(
      normalizeScreenPose({
        worldX: NaN,
        worldY: 0,
        worldWidth: 100,
        worldHeight: 100,
      }),
    ).toBeNull();
  });
});
