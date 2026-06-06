/**
 * @syncframe/core — InMemoryStore tests.
 *
 * Validates CRUD operations, room/channel isolation, and snapshot consistency.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStore } from '../store-inmemory';
import type { AnyAnchor } from '../types';

describe('InMemoryStore', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  const scalarAnchor: AnyAnchor = {
    at: 1000,
    value: 42,
    motion: { kind: 'scalar' },
  };

  describe('anchors', () => {
    it('returns null for non-existent anchor', async () => {
      const result = await store.getAnchor('room1', 'channel1');
      expect(result).toBeNull();
    });

    it('stores and retrieves anchor', async () => {
      await store.setAnchor('room1', 'channel1', scalarAnchor);
      const result = await store.getAnchor('room1', 'channel1');
      expect(result).toEqual(scalarAnchor);
    });

    it('isolates anchors by room', async () => {
      await store.setAnchor('room1', 'channel1', scalarAnchor);
      const result = await store.getAnchor('room2', 'channel1');
      expect(result).toBeNull();
    });

    it('isolates anchors by channel', async () => {
      await store.setAnchor('room1', 'channel1', scalarAnchor);
      const result = await store.getAnchor('room1', 'channel2');
      expect(result).toBeNull();
    });

    it('overwrites existing anchor', async () => {
      await store.setAnchor('room1', 'channel1', scalarAnchor);
      const updated: AnyAnchor = { ...scalarAnchor, value: 100 };
      await store.setAnchor('room1', 'channel1', updated);
      const result = await store.getAnchor('room1', 'channel1');
      expect(result?.value).toBe(100);
    });

    it('deletes anchor', async () => {
      await store.setAnchor('room1', 'channel1', scalarAnchor);
      await store.deleteAnchor('room1', 'channel1');
      const result = await store.getAnchor('room1', 'channel1');
      expect(result).toBeNull();
    });

    it('handles delete on non-existent anchor gracefully', async () => {
      await expect(store.deleteAnchor('room1', 'channel1')).resolves.toBeUndefined();
    });

    it('lists all anchors in room', async () => {
      await store.setAnchor('room1', 'channel1', scalarAnchor);
      await store.setAnchor('room1', 'channel2', { ...scalarAnchor, value: 100 });
      const list = await store.listAnchors('room1');
      expect(Object.keys(list)).toHaveLength(2);
      expect(list.channel1?.value).toBe(42);
      expect(list.channel2?.value).toBe(100);
    });

    it('returns empty object for room with no anchors', async () => {
      const list = await store.listAnchors('room1');
      expect(list).toEqual({});
    });

    it('returns snapshot copy (not live reference)', async () => {
      await store.setAnchor('room1', 'channel1', scalarAnchor);
      const list1 = await store.listAnchors('room1');
      const list2 = await store.listAnchors('room1');
      expect(list1).not.toBe(list2);
      expect(list1).toEqual(list2);
    });
  });

  describe('meta', () => {
    it('returns empty object for non-existent meta', async () => {
      const result = await store.getMeta('room1');
      expect(result).toEqual({});
    });

    it('stores and retrieves meta', async () => {
      const meta = { title: 'Test Room', maxPlayers: 4 };
      await store.setMeta('room1', meta);
      const result = await store.getMeta('room1');
      expect(result).toEqual(meta);
    });

    it('isolates meta by room', async () => {
      await store.setMeta('room1', { title: 'Room 1' });
      const result = await store.getMeta('room2');
      expect(result).toEqual({});
    });

    it('overwrites existing meta', async () => {
      await store.setMeta('room1', { title: 'Old' });
      await store.setMeta('room1', { title: 'New' });
      const result = await store.getMeta('room1');
      expect(result.title).toBe('New');
    });
  });

  describe('contentData', () => {
    it('returns null for non-existent contentData', async () => {
      const result = await store.getContentData('room1');
      expect(result).toBeNull();
    });

    it('stores and retrieves contentData', async () => {
      const data = { videoId: 'abc123', duration: 120 };
      await store.setContentData('room1', data);
      const result = await store.getContentData('room1');
      expect(result).toEqual(data);
    });

    it('isolates contentData by room', async () => {
      await store.setContentData('room1', { videoId: 'abc' });
      const result = await store.getContentData('room2');
      expect(result).toBeNull();
    });

    it('overwrites existing contentData', async () => {
      await store.setContentData('room1', { videoId: 'old' });
      await store.setContentData('room1', { videoId: 'new' });
      const result = await store.getContentData('room1');
      expect(result?.videoId).toBe('new');
    });
  });

  describe('consumer-defined anchor shapes', () => {
    it('stores position2d anchors without inspecting value', async () => {
      const anchor: AnyAnchor = {
        at: 1000,
        value: { x: 100, y: 200 },
        motion: { kind: 'linear2d' },
      };
      await store.setAnchor('room1', 'player', anchor);
      const result = await store.getAnchor('room1', 'player');
      expect(result?.motion.kind).toBe('linear2d');
      expect(result?.value).toEqual({ x: 100, y: 200 });
    });

    it('stores playback anchors without inspecting motion extras', async () => {
      const anchor: AnyAnchor = {
        at: 5000,
        value: 45.5,
        motion: { kind: 'playback', state: 'playing', rate: 1.0 } as AnyAnchor['motion'],
      };
      await store.setAnchor('room1', 'video', anchor);
      const result = await store.getAnchor('room1', 'video');
      expect(result?.motion.kind).toBe('playback');
    });

    it('stores color anchors with array values', async () => {
      const anchor: AnyAnchor = {
        at: 2000,
        value: [255, 100, 50],
        motion: { kind: 'color-lerp' },
      };
      await store.setAnchor('room1', 'light', anchor);
      const result = await store.getAnchor('room1', 'light');
      expect(result?.motion.kind).toBe('color-lerp');
    });

    it('store is opaque — arbitrary motion kinds pass through', async () => {
      const kinds = ['scalar', 'position2d', 'playback', 'color', 'audio-sample', 'progress', 'countdown'];
      for (const kind of kinds) {
        const anchor: AnyAnchor = { at: 0, value: 0, motion: { kind } };
        await store.setAnchor('room', kind, anchor);
      }
      const list = await store.listAnchors('room');
      expect(Object.keys(list)).toHaveLength(kinds.length);
      for (const kind of kinds) {
        expect(list[kind]?.motion.kind).toBe(kind);
      }
    });
  });
});
