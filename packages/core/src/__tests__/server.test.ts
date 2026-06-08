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
    server = new SyncServer({ store, transport, namespace: 'test' });
  });

  const scalarAnchor: AnyAnchor = {
    at: 1000,
    value: 42,
    motion: { kind: 'scalar' },
  };

  describe('anchor CRUD', () => {
    it('sets and gets an anchor', async () => {
      await server.setAnchor('ch1', scalarAnchor);
      const result = await server.getAnchor('ch1');
      expect(result).toEqual(scalarAnchor);
    });

    it('returns null for non-existent anchor', async () => {
      expect(await server.getAnchor('ch1')).toBeNull();
    });

    it('deletes an anchor', async () => {
      await server.setAnchor('ch1', scalarAnchor);
      await server.deleteAnchor('ch1');
      expect(await server.getAnchor('ch1')).toBeNull();
    });

    it('lists all anchors in the namespace', async () => {
      await server.setAnchor('ch1', scalarAnchor);
      await server.setAnchor('ch2', { ...scalarAnchor, value: 100 });
      const list = await server.listAnchors();
      expect(Object.keys(list)).toHaveLength(2);
    });

    it('ensureAnchor creates missing anchor and registers it for listAnchors', async () => {
      const a = await server.ensureAnchor('timer', () => scalarAnchor);
      expect(a).toEqual(scalarAnchor);
      expect(await server.listAnchors()).toHaveProperty('timer', scalarAnchor);
    });

    it('ensureAnchor keeps existing anchor but re-registers channel', async () => {
      await server.setAnchor('timer', scalarAnchor);
      const a = await server.ensureAnchor('timer', () => ({
        ...scalarAnchor,
        value: 99,
      }));
      expect(a.value).toBe(42);
      expect(await server.listAnchors()).toHaveProperty('timer', scalarAnchor);
    });

    it('consumer-defined anchors pass through unchanged', async () => {
      const anchor: AnyAnchor = {
        at: 1000,
        value: { x: 100, y: 200, z: 300 },
        motion: { kind: 'position3d' },
      };
      await server.setAnchor('player', anchor);
      const result = await server.getAnchor('player');
      expect(result?.motion.kind).toBe('position3d');
      expect(result?.value).toEqual({ x: 100, y: 200, z: 300 });
    });
  });

  describe('meta', () => {
    it('gets empty meta for new namespace', async () => {
      expect(await server.getMeta()).toEqual({});
    });

    it('patches meta without overwriting other fields', async () => {
      await server.patchMeta({ title: 'Room' });
      const result = await server.patchMeta({ count: 5 });
      expect(result).toEqual({ title: 'Room', count: 5 });
    });

    it('patch overwrites existing fields', async () => {
      await server.patchMeta({ count: 5 });
      const result = await server.patchMeta({ count: 10 });
      expect(result.count).toBe(10);
    });
  });

  describe('contentData', () => {
    it('gets null contentData for new namespace', async () => {
      expect(await server.getContentData()).toBeNull();
    });

    it('patches contentData', async () => {
      const result = await server.patchContentData({ videoId: 'abc' });
      expect(result).toEqual({ videoId: 'abc' });
    });

    it('patch merges with existing', async () => {
      await server.patchContentData({ videoId: 'abc' });
      const result = await server.patchContentData({ quality: 'hd' });
      expect(result).toEqual({ videoId: 'abc', quality: 'hd' });
    });

    it('patch removes null/undefined keys', async () => {
      await server.patchContentData({ a: 1, b: 2, c: 3 });
      const result = await server.patchContentData({ a: null, b: undefined });
      expect(result).toEqual({ c: 3 });
    });
  });

  describe('snapshot building', () => {
    it('builds empty snapshot for empty namespace', async () => {
      const s = await server.buildSnapshot();
      expect(s.anchors).toEqual({});
      expect(s.meta).toEqual({});
      expect(s.contentData).toBeNull();
    });

    it('builds complete snapshot', async () => {
      await server.setAnchor('ch1', scalarAnchor);
      await server.patchMeta({ title: 'Room' });
      await server.patchContentData({ videoId: 'abc' });

      const s = await server.buildSnapshot();
      expect(s.anchors.ch1).toEqual(scalarAnchor);
      expect(s.meta.title).toBe('Room');
      expect(s.contentData?.videoId).toBe('abc');
    });
  });

  describe('publish and subscribe', () => {
    it('publishes snapshot to subscribers', async () => {
      await server.setAnchor('ch1', scalarAnchor);
      const handler = vi.fn<(snapshot: CoreSnapshot) => void>();
      await server.subscribe(handler);
      await server.publishUpdate();

      expect(handler).toHaveBeenCalledTimes(1);
      const received = handler.mock.calls[0]![0]!;
      expect(received.anchors.ch1).toEqual(scalarAnchor);
    });

    it('publishes multiple updates', async () => {
      const handler = vi.fn();
      await server.subscribe(handler);

      await server.setAnchor('ch1', scalarAnchor);
      await server.publishUpdate();
      await server.deleteAnchor('ch1');
      await server.publishUpdate();

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('unsubscribe stops delivery', async () => {
      const handler = vi.fn();
      const unsub = await server.subscribe(handler);
      await server.publishUpdate();
      unsub();
      await server.publishUpdate();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('isolates subscriptions by namespace', async () => {
      const serverA = new SyncServer({ store, transport, namespace: 'a' });
      const serverB = new SyncServer({ store, transport, namespace: 'b' });
      const h1 = vi.fn();
      const h2 = vi.fn();
      await serverA.subscribe(h1);
      await serverB.subscribe(h2);
      await serverA.publishUpdate();
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
