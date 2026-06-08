import { describe, expect, it } from 'vitest';
import {
  defaultSpatialMeta,
  deleteScreen,
  ensureScreen,
  heartbeat,
  pruneStaleSessions,
  parseSpatialMeta,
  setContentLayerId,
  setRenderMode,
  setWorldBbox,
  updatePose,
  SESSION_TTL_MS,
} from '../reducers';
import { DEFAULT_POSE } from '../types';

function asMeta(result: ReturnType<typeof ensureScreen>) {
  if (result === 'limit_reached') throw new Error('expected meta');
  return result;
}

describe('ensureScreen', () => {
  it('creates a screen with default pose at origin', () => {
    const meta = asMeta(ensureScreen(defaultSpatialMeta(), 'desk-left'));
    expect(meta.screens['desk-left']).toBeDefined();
    expect(meta.screens['desk-left']!.pose).toEqual(DEFAULT_POSE);
  });

  it('is idempotent', () => {
    const once = asMeta(ensureScreen(defaultSpatialMeta(), 'desk-left'));
    const pose = { ...DEFAULT_POSE, worldX: 50 };
    once.screens['desk-left']!.pose = pose;
    const twice = asMeta(ensureScreen(once, 'desk-left'));
    expect(twice.screens['desk-left']!.pose.worldX).toBe(50);
  });

  it('returns limit_reached when at maxScreens', () => {
    let meta = defaultSpatialMeta();
    for (let i = 0; i < 3; i++) {
      meta = asMeta(ensureScreen(meta, `s${i}`, 3));
    }
    expect(ensureScreen(meta, 's-new', 3)).toBe('limit_reached');
    expect(asMeta(ensureScreen(meta, 's0', 3))).toBe(meta);
  });
});

describe('updatePose', () => {
  it('returns null when screen missing', () => {
    expect(updatePose(defaultSpatialMeta(), 'nope', DEFAULT_POSE)).toBeNull();
  });

  it('updates pose for existing screen', () => {
    const meta = asMeta(ensureScreen(defaultSpatialMeta(), 'a'));
    const next = updatePose(meta, 'a', { ...DEFAULT_POSE, worldX: 10 });
    expect(next!.screens['a']!.pose.worldX).toBe(10);
  });
});

describe('deleteScreen', () => {
  it('removes screen from map', () => {
    const meta = asMeta(ensureScreen(defaultSpatialMeta(), 'a'));
    const next = deleteScreen(meta, 'a');
    expect(next.screens['a']).toBeUndefined();
  });
});

describe('heartbeat', () => {
  it('returns deleted when screen missing', () => {
    const result = heartbeat(defaultSpatialMeta(), 'gone', {
      sessionId: 's1',
      clientWidthPx: 1920,
      clientHeightPx: 1080,
      devicePixelRatio: 1,
      userAgent: 'test',
      lastSeenAt: new Date().toISOString(),
    });
    expect(result).toBe('deleted');
  });

  it('upserts session on existing screen', () => {
    const meta = asMeta(ensureScreen(defaultSpatialMeta(), 'a'));
    const session = {
      sessionId: 's1',
      clientWidthPx: 1920,
      clientHeightPx: 1080,
      devicePixelRatio: 2,
      userAgent: 'ua',
      lastSeenAt: new Date().toISOString(),
    };
    const next = heartbeat(meta, 'a', session);
    expect(next).not.toBe('deleted');
    if (next !== 'deleted') {
      expect(next.screens['a']!.sessions['s1']).toEqual(session);
    }
  });
});

describe('pruneStaleSessions', () => {
  it('drops sessions older than TTL', () => {
    const meta = asMeta(ensureScreen(defaultSpatialMeta(), 'a'));
    const stale = new Date(Date.now() - SESSION_TTL_MS - 1000).toISOString();
    meta.screens['a']!.sessions['old'] = {
      sessionId: 'old',
      clientWidthPx: 1,
      clientHeightPx: 1,
      devicePixelRatio: 1,
      userAgent: '',
      lastSeenAt: stale,
    };
    const pruned = pruneStaleSessions(meta, Date.now());
    expect(pruned.screens['a']!.sessions['old']).toBeUndefined();
  });
});

describe('defaultSpatialMeta', () => {
  it('omits contentLayerId — consumers set it via SpatialServer.initialMeta', () => {
    expect(defaultSpatialMeta().contentLayerId).toBeUndefined();
  });
});

describe('setRenderMode', () => {
  it('toggles render mode', () => {
    const next = setRenderMode(defaultSpatialMeta(), 'content');
    expect(next.renderMode).toBe('content');
  });
});

describe('setWorldBbox', () => {
  it('updates world canvas size', () => {
    const next = setWorldBbox(defaultSpatialMeta(), { width: 3840, height: 2160 });
    expect(next.worldBbox).toEqual({ width: 3840, height: 2160 });
  });
});

describe('setContentLayerId', () => {
  it('pins active content layer', () => {
    const next = setContentLayerId(defaultSpatialMeta(), 'pano');
    expect(next.contentLayerId).toBe('pano');
  });
});

describe('parseSpatialMeta', () => {
  it('preserves identifyTrigger from snapshot merge', () => {
    const parsed = parseSpatialMeta({
      worldBbox: { width: 1920, height: 1080 },
      renderMode: 'content',
      screens: {},
      identifyTrigger: { screenName: 'desk-left', at: 12345 },
    });
    expect(parsed.identifyTrigger).toEqual({ screenName: 'desk-left', at: 12345 });
  });

  it('clears identifyTrigger when null', () => {
    const parsed = parseSpatialMeta({
      worldBbox: { width: 1920, height: 1080 },
      renderMode: 'content',
      screens: {},
      identifyTrigger: null,
    });
    expect(parsed.identifyTrigger).toBeNull();
  });
});
