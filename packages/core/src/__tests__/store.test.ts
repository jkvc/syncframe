/**
 * @syncframe/core — store.ts tests (buildCoreSnapshot).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { buildCoreSnapshot } from '../store';
import { InMemoryStore } from '../store-inmemory';
import type { AnyAnchor } from '../types';

describe('buildCoreSnapshot', () => {
  let store: InMemoryStore;

  beforeEach(() => {
    store = new InMemoryStore();
  });

  it('builds empty snapshot for empty room', async () => {
    const s = await buildCoreSnapshot(store, 'room1');
    expect(s.anchors).toEqual({});
    expect(s.meta).toEqual({});
    expect(s.contentData).toBeNull();
  });

  it('aggregates anchors, meta, and contentData', async () => {
    const anchor: AnyAnchor = {
      at: 1000,
      value: 42,
      motion: { kind: 'scalar' },
    };
    await store.setAnchor('room1', 'ch1', anchor);
    await store.setMeta('room1', { title: 'Room' });
    await store.setContentData('room1', { videoId: 'abc' });

    const s = await buildCoreSnapshot(store, 'room1');
    expect(s.anchors.ch1).toEqual(anchor);
    expect(s.meta.title).toBe('Room');
    expect(s.contentData?.videoId).toBe('abc');
  });

  it('includes all anchors in the room', async () => {
    await store.setAnchor('room1', 'a', { at: 0, value: 1, motion: { kind: 'x' } });
    await store.setAnchor('room1', 'b', { at: 0, value: 2, motion: { kind: 'y' } });
    await store.setAnchor('room1', 'c', { at: 0, value: 3, motion: { kind: 'z' } });

    const s = await buildCoreSnapshot(store, 'room1');
    expect(Object.keys(s.anchors).sort()).toEqual(['a', 'b', 'c']);
  });

  it('only includes anchors from the specified room', async () => {
    await store.setAnchor('room1', 'ch1', { at: 0, value: 1, motion: { kind: 'x' } });
    await store.setAnchor('room2', 'ch2', { at: 0, value: 2, motion: { kind: 'y' } });

    const s = await buildCoreSnapshot(store, 'room1');
    expect(Object.keys(s.anchors)).toEqual(['ch1']);
  });
});
