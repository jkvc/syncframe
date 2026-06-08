/**
 * @syncframe/spatial — Layer 2 types.
 *
 * Screen registry, poses, and world bbox live in `meta.spatial` on a
 * SyncServer channel. Core stays screen-free.
 */

export interface ScreenPose {
  worldX: number;
  worldY: number;
  worldWidth: number;
  worldHeight: number;
}

export interface ScreenSession {
  sessionId: string;
  clientWidthPx: number;
  clientHeightPx: number;
  devicePixelRatio: number;
  userAgent: string;
  lastSeenAt: string;
}

export interface ScreenEntry {
  pose: ScreenPose;
  createdAt: string;
  sessions: Record<string, ScreenSession>;
}

export type RenderMode = 'calibration' | 'content';

export interface WorldBbox {
  width: number;
  height: number;
}

export interface IdentifyTrigger {
  screenName: string;
  at: number;
}

export interface SpatialMeta {
  worldBbox: WorldBbox;
  renderMode: RenderMode;
  /** Active content layer id — opaque to spatial; forwarded for operator UI. */
  contentLayerId?: string;
  screens: Record<string, ScreenEntry>;
  /** Merged at snapshot build from a transient Redis key; not persisted in meta JSON. */
  identifyTrigger?: IdentifyTrigger | null;
}

export const DEFAULT_WORLD_WIDTH = 1920;
export const DEFAULT_WORLD_HEIGHT = 1080;

/** Default cap on registered screen names per spatial namespace. */
export const DEFAULT_MAX_SCREENS = 5;

export const DEFAULT_POSE: ScreenPose = {
  worldX: 0,
  worldY: 0,
  worldWidth: DEFAULT_WORLD_WIDTH,
  worldHeight: DEFAULT_WORLD_HEIGHT,
};

/** Session keys auto-expire after this many ms of no heartbeat. */
export const SESSION_TTL_MS = 30_000;

/** Client-side staleness threshold for operator UI (ms). */
export const SESSION_STALE_MS = 30_000;

/** Heartbeat cadence (ms). */
export const HEARTBEAT_INTERVAL_MS = 10_000;

/** Identify trigger TTL on Redis (seconds). */
export const IDENTIFY_TRIGGER_TTL_SECONDS = 5;

const SCREEN_NAME_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/i;

export function isValidScreenName(name: string): boolean {
  return SCREEN_NAME_RE.test(name);
}

/** Validate and normalize a ScreenPose from untrusted input. */
export function normalizeScreenPose(input: unknown): ScreenPose | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as Record<string, unknown>;
  const num = (k: string): number | null => {
    const v = Number(p[k]);
    return Number.isFinite(v) ? v : null;
  };
  const worldX = num('worldX');
  const worldY = num('worldY');
  const worldWidth = num('worldWidth');
  const worldHeight = num('worldHeight');
  if (
    worldX === null ||
    worldY === null ||
    worldWidth === null ||
    worldHeight === null
  ) {
    return null;
  }
  if (worldWidth <= 0 || worldHeight <= 0) return null;
  return { worldX, worldY, worldWidth, worldHeight };
}
