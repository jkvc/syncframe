/**
 * Color ring demo — channel/endpoint constants (client-safe).
 */

export const RING_WORLD_SIZE = 500;
export const RING_SPIN_CHANNEL = 'ring-spin';

export const RING_STREAM_ENDPOINT = '/api/ring/stream';
export const RING_API_BASE = '/api/ring';

export const RING_QUADRANT_SCREENS = ['nw', 'ne', 'sw', 'se'] as const;
export type RingQuadrantScreen = (typeof RING_QUADRANT_SCREENS)[number];
