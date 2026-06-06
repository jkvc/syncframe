/**
 * @syncframe/core — SyncServer tests.
 *
 * Validates the orchestration layer: anchor CRUD, meta/contentData patching,
 * snapshot building, and publish/subscribe wiring.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncServer } from '../server';
import { InMemoryStore } from '../store-inmemory';
import { EventEmitterTransport } from '../transport-eventemitter';
import type { AnyAnchor, CoreSnapshot } from '../types';

describe('SyncServer', () => {
  let server: SyncServer;
  let store: InMemoryStore;
  let transport: EventEmitterTransport;

  beforeEach(() => {
    store = new InMemoryStore();
    transport = new EventEmitterTransport();
    server = new SyncServer({ store, transport });
  });

  const scalarAnchor: AnyAnchor = {
    at: 1000,
    value: 42,
    motion: { kind: 'scalar' },
  };

  describe('anchor CRUD', () => {
    it('sets and gets an anchor', async () => {
      await server.setAnchor('room1', 'ch1', scalarAnchor);
      const result = await server.getAnchor('room1', 'ch1');
      expect(result).toEqual(scalarAnchor);
    });

    it('returns null for non-existent anchor', async () => {
      expect(await server.getAnchor('room1', 'ch1')).toBeNull();
    });

    it('deletes an anchor', async () => {
      await server.setAnchor('room1', 'ch1', scalarAnchor);
      await server.deleteAnchor('room1', 'ch1');
      expect(await server.getAnchor('room1', 'ch1')).toBeNull();
    });

    it('lists all anchors in a room', async () => {
      await server.setAnchor('room1', 'ch1', scalarAnchor);
      await server.setAnchor('room1', 'ch2', { ...scalarAnchor, value: 100 });
      const list = await server.listAnchors('room1');
      expect(Object.keys(list)).toHaveLength(2);
    });

    it('isolates anchors by room', async () => {
      await server.setAnchor('room1', 'ch1', scalarAnchor);
      expect(await server.getAnchor('room2', 'ch1')).toBeNull();
    });

    it('consumer-defined anchors pass through unchanged', async () => {
      const anchor: AnyAnchor = {
        at: 1000,
        value: { x: 100, y: 200, z: 300 },
        motion: { kind: 'position3d' },
      };
      await server.setAnchor('room1', 'player', anchor);
      const result = await server.getAnchor('room1', 'player');
      expect(result?.motion.kind).toBe('position3d');
      expect(result?.value).toEqual({ x: 100, y: 200, z: 300 });
    });
  });

  describe('meta', () => {
    it('gets empty meta for new room', async () => {
      expect(await server.getMeta('room1')).toEqual({});
    });

    it('patches meta without overwriting other fields', async () => {
      await server.patchMeta('room1', { title: 'Room' });
      const result = await server.patchMeta('room1', { count: 5 });
      expect(result).toEqual({ title: 'Room', count: 5 });
    });

    it('patch overwrites existing fields', async () => {
      await server.patchMeta('room1', { count: 5 });
      const result = await server.patchMeta('room1', { count: 10 });
      expect(result.count).toBe(10);
    });
  });

  describe('contentData', () => {
    it('gets null contentData for new room', async () => {
      expect(await server.getContentData('room1')).toBeNull();
    });

    it('patches contentData', async () => {
      const result = await server.patchContentData('room1', { videoId: 'abc' });
      expect(result).toEqual({ videoId: 'abc' });
    });

    it('patch merges with existing', async () => {
      await server.patchContentData('room1', { videoId: 'abc' });
      const result = await server.patchContentData('room1', { quality: 'hd' });
      expect(result).toEqual({ videoId: 'abc', quality: 'hd' });
    });

    it('patch removes null/undefined keys', async () => {
      await server.patchContentData('room1', { a: 1, b: 2, c: 3 });
      const result = await server.patchContentData('room1', { a: null, b: undefined });
      expect(result).toEqual({ c: 3 });
    });
  });

  describe('snapshot building', () => {
    it('builds empty snapshot for empty room', async () => {
      const s = await server.buildSnapshot('room1');
      expect(s.anchors).toEqual({});
      expect(s.meta).toEqual({});
      expect(s.contentData).toBeNull();
    });

    it('builds complete snapshot', async () => {
      await server.setAnchor('room1', 'ch1', scalarAnchor);
      await server.patchMeta('room1', { title: 'Room' });
      await server.patchContentData('room1', { videoId: 'abc' });

      const s = await server.buildSnapshot('room1');
      expect(s.anchors.ch1).toEqual(scalarAnchor);
      expect(s.meta.title).toBe('Room');
      expect(s.contentData?.videoId).toBe('abc');
    });
  });

  describe('publish and subscribe', () => {
    it('publishes snapshot to subscribers', async () => {
      await server.setAnchor('room1', 'ch1', scalarAnchor);
      const handler = vi.fn<(snapshot: CoreSnapshot) => void>();
      await server.subscribe('room1', handler);
      await server.publishUpdate('room1');

      expect(handler).toHaveBeenCalledTimes(1);
      const received = handler.mock.calls[0]![0]!;
      expect(received.anchors.ch1).toEqual(scalarAnchor);
    });

    it('publishes multiple updates', async () => {
      const handler = vi.fn();
      await server.subscribe('room1', handler);

      await server.setAnchor('room1', 'ch1', scalarAnchor);
      await server.publishUpdate('room1');
      await server.deleteAnchor('room1', 'ch1');
      await server.publishUpdate('room1');

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('unsubscribe stops delivery', async () => {
      const handler = vi.fn();
      const unsub = await server.subscribe('room1', handler);
      await server.publishUpdate('room1');
      unsub();
      await server.publishUpdate('room1');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('isolates subscriptions by room', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      await server.subscribe('room1', h1);
      await server.subscribe('room2', h2);
      await server.publishUpdate('room1');
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).not.toHaveBeenCalled();
    });
  });

  describe('clock probe', () => {
    it('returns a timestamp close to Date.now()', () => {
      const before = Date.now();
      const probe = server.clockProbe();
      const after = Date.now();
      expect(probe).toBeGreaterThanOrEqual(before);
      expect(probe).toBeLessThanOrEqual(after);
    });
  });
});
