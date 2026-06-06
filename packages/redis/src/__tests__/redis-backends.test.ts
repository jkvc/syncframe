/**
 * @syncframe/redis — adapter tests against a fake Redis.
 *
 * The fake models just enough of ioredis (string GET/SET/DEL, set ops, and
 * channel pub/sub across connections) to exercise the store bookkeeping and the
 * transport round-trip. Real Redis behavior is covered by the app's live tests.
 */

import { EventEmitter } from 'node:events';
import { describe, it, expect, vi } from 'vitest';
import { RedisStore, RedisTransport } from '../index';
import type { AnyAnchor, CoreSnapshot } from '@syncframe/core/server';

// A shared "server" that fake connections read/write and pub/sub through.
class FakeServer {
  strings = new Map<string, string>();
  sets = new Map<string, Set<string>>();
  bus = new EventEmitter();
}

class FakeRedis {
  private onMessage?: (channel: string, message: string) => void;
  constructor(private readonly server: FakeServer) {}

  async get(key: string): Promise<string | null> {
    return this.server.strings.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.server.strings.set(key, value);
  }
  async del(key: string): Promise<void> {
    this.server.strings.delete(key);
  }
  async sadd(key: string, member: string): Promise<void> {
    const set = this.server.sets.get(key) ?? new Set<string>();
    set.add(member);
    this.server.sets.set(key, set);
  }
  async srem(key: string, member: string): Promise<void> {
    this.server.sets.get(key)?.delete(member);
  }
  async smembers(key: string): Promise<string[]> {
    return [...(this.server.sets.get(key) ?? [])];
  }
  async publish(channel: string, message: string): Promise<void> {
    this.server.bus.emit(channel, message);
  }
  on(event: 'message', cb: (channel: string, message: string) => void): void {
    if (event === 'message') this.onMessage = cb;
  }
  async subscribe(channel: string): Promise<void> {
    this.server.bus.on(channel, (message: string) => this.onMessage?.(channel, message));
  }
  async quit(): Promise<void> {
    this.server.bus.removeAllListeners();
  }
}

const makeRedis = (server: FakeServer) => new FakeRedis(server) as unknown as import('ioredis').default;

const anchor = (value: number): AnyAnchor => ({
  at: 1000,
  value,
  motion: { kind: 'scalar' },
});

describe('RedisStore', () => {
  it('round-trips an anchor as JSON', async () => {
    const store = new RedisStore({ redis: makeRedis(new FakeServer()) });
    expect(await store.getAnchor('room', 'timer')).toBeNull();
    await store.setAnchor('room', 'timer', anchor(60));
    expect(await store.getAnchor('room', 'timer')).toEqual(anchor(60));
  });

  it('tracks channels so listAnchors returns every set anchor', async () => {
    const store = new RedisStore({ redis: makeRedis(new FakeServer()) });
    await store.setAnchor('room', 'a', anchor(1));
    await store.setAnchor('room', 'b', anchor(2));
    expect(await store.listAnchors('room')).toEqual({ a: anchor(1), b: anchor(2) });
  });

  it('deleteAnchor removes the value and drops it from listAnchors', async () => {
    const store = new RedisStore({ redis: makeRedis(new FakeServer()) });
    await store.setAnchor('room', 'a', anchor(1));
    await store.deleteAnchor('room', 'a');
    expect(await store.getAnchor('room', 'a')).toBeNull();
    expect(await store.listAnchors('room')).toEqual({});
  });

  it('defaults meta to {} and content to null', async () => {
    const store = new RedisStore({ redis: makeRedis(new FakeServer()) });
    expect(await store.getMeta('room')).toEqual({});
    expect(await store.getContentData('room')).toBeNull();
    await store.setMeta('room', { title: 'hi' });
    await store.setContentData('room', { n: 1 });
    expect(await store.getMeta('room')).toEqual({ title: 'hi' });
    expect(await store.getContentData('room')).toEqual({ n: 1 });
  });

  it('namespaces keys by the configured prefix', async () => {
    const server = new FakeServer();
    const store = new RedisStore({ redis: makeRedis(server), prefix: 'demo' });
    await store.setAnchor('room', 'timer', anchor(5));
    expect(server.strings.has('demo:room:anchor:timer')).toBe(true);
  });
});

describe('RedisTransport', () => {
  const snapshot: CoreSnapshot = { anchors: { timer: anchor(42) }, meta: {}, contentData: null };

  it('delivers a published snapshot to a subscriber on the same channel', async () => {
    const server = new FakeServer();
    const transport = new RedisTransport({
      redis: makeRedis(server),
      createSubscriber: () => makeRedis(server),
    });

    const received: CoreSnapshot[] = [];
    await transport.subscribe('room', (snap) => received.push(snap));
    await transport.publish('room', snapshot);

    expect(received).toEqual([snapshot]);
  });

  it('does not deliver across different rooms', async () => {
    const server = new FakeServer();
    const transport = new RedisTransport({
      redis: makeRedis(server),
      createSubscriber: () => makeRedis(server),
    });

    const handler = vi.fn();
    await transport.subscribe('room-a', handler);
    await transport.publish('room-b', snapshot);

    expect(handler).not.toHaveBeenCalled();
  });
});
