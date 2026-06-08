/**
 * Pure reducers for SpatialMeta — testable, framework-agnostic.
 */

import {
  DEFAULT_POSE,
  DEFAULT_WORLD_HEIGHT,
  DEFAULT_WORLD_WIDTH,
  type RenderMode,
  type ScreenEntry,
  type ScreenPose,
  type ScreenSession,
  SESSION_TTL_MS,
} from './types';
import type { SpatialMeta } from './types';

export type { SpatialMeta } from './types';

export { SESSION_TTL_MS };

export function defaultSpatialMeta(): SpatialMeta {
  return {
    worldBbox: { width: DEFAULT_WORLD_WIDTH, height: DEFAULT_WORLD_HEIGHT },
    renderMode: 'calibration',
    screens: {},
  };
}

export function parseSpatialMeta(raw: unknown): SpatialMeta {
  if (!raw || typeof raw !== 'object') return defaultSpatialMeta();
  const o = raw as Record<string, unknown>;
  const base = defaultSpatialMeta();
  if (o.worldBbox && typeof o.worldBbox === 'object') {
    const wb = o.worldBbox as Record<string, unknown>;
    if (typeof wb.width === 'number') base.worldBbox.width = wb.width;
    if (typeof wb.height === 'number') base.worldBbox.height = wb.height;
  }
  if (o.renderMode === 'calibration' || o.renderMode === 'content') {
    base.renderMode = o.renderMode;
  }
  if (o.screens && typeof o.screens === 'object' && !Array.isArray(o.screens)) {
    base.screens = o.screens as Record<string, ScreenEntry>;
  }
  if ('identifyTrigger' in o) {
    if (o.identifyTrigger === null) {
      base.identifyTrigger = null;
    } else if (o.identifyTrigger && typeof o.identifyTrigger === 'object') {
      const t = o.identifyTrigger as Record<string, unknown>;
      if (typeof t.screenName === 'string' && typeof t.at === 'number') {
        base.identifyTrigger = { screenName: t.screenName, at: t.at };
      }
    }
  }
  return base;
}

export function pruneStaleSessions(meta: SpatialMeta, nowMs: number): SpatialMeta {
  const screens: Record<string, ScreenEntry> = {};
  for (const [name, entry] of Object.entries(meta.screens)) {
    const sessions: Record<string, ScreenSession> = {};
    for (const [sid, session] of Object.entries(entry.sessions)) {
      const last = Date.parse(session.lastSeenAt);
      if (!Number.isNaN(last) && nowMs - last <= SESSION_TTL_MS) {
        sessions[sid] = session;
      }
    }
    screens[name] = { ...entry, sessions };
  }
  return { ...meta, screens };
}

export function ensureScreen(meta: SpatialMeta, name: string): SpatialMeta {
  if (meta.screens[name]) return meta;
  const now = new Date().toISOString();
  return {
    ...meta,
    screens: {
      ...meta.screens,
      [name]: {
        pose: { ...DEFAULT_POSE },
        createdAt: now,
        sessions: {},
      },
    },
  };
}

export function updatePose(
  meta: SpatialMeta,
  name: string,
  pose: ScreenPose,
): SpatialMeta | null {
  const entry = meta.screens[name];
  if (!entry) return null;
  return {
    ...meta,
    screens: {
      ...meta.screens,
      [name]: { ...entry, pose: { ...pose } },
    },
  };
}

export function deleteScreen(meta: SpatialMeta, name: string): SpatialMeta {
  const screens = { ...meta.screens };
  delete screens[name];
  return { ...meta, screens };
}

export function setRenderMode(meta: SpatialMeta, mode: RenderMode): SpatialMeta {
  return { ...meta, renderMode: mode };
}

export type HeartbeatResult = SpatialMeta | 'deleted';

export function heartbeat(
  meta: SpatialMeta,
  name: string,
  session: ScreenSession,
): HeartbeatResult {
  const entry = meta.screens[name];
  if (!entry) return 'deleted';
  return {
    ...meta,
    screens: {
      ...meta.screens,
      [name]: {
        ...entry,
        sessions: {
          ...entry.sessions,
          [session.sessionId]: session,
        },
      },
    },
  };
}

/** Sorted screen names for stable UI iteration. */
export function listScreenNames(meta: SpatialMeta): string[] {
  return Object.keys(meta.screens).sort((a, b) => a.localeCompare(b));
}

export function isScreenOnline(
  entry: ScreenEntry,
  nowMs: number,
  staleMs: number = SESSION_TTL_MS,
): boolean {
  return Object.values(entry.sessions).some((s) => {
    const last = Date.parse(s.lastSeenAt);
    return !Number.isNaN(last) && nowMs - last <= staleMs;
  });
}
