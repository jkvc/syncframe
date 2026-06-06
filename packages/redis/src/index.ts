/**
 * @syncframe/redis — Redis-backed adapters for @syncframe/core.
 *
 * Implements core's `SyncStore` and `SyncTransport` interfaces on top of Redis,
 * so a `SyncServer` can persist anchors and fan out snapshots across processes
 * and serverless instances.
 *
 * Core stays zero-dependency: these adapters only *implement* its interfaces.
 * Every `@syncframe/core` and `ioredis` import here is type-only and erased at
 * compile time — the package has no runtime dependency on core, and the Redis
 * client is injected by the caller (so connection, auth, and pooling concerns
 * live in the application, not here).
 */

import type Redis from 'ioredis';
// Type-only imports from core's server entry. That entry is React-free, so it
// never pulls hooks (which reference DOM globals) into this non-DOM package's
// type-check.
import type {
  SyncStore,
  SyncTransport,
  AnyAnchor,
  CoreSnapshot,
} from '@syncframe/core/server';

const DEFAULT_PREFIX = 'syncframe';

async function readJson<T>(redis: Redis, key: string): Promise<T | null> {
  const raw = await redis.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export interface RedisStoreOptions {
  /** Client used for all commands. */
  redis: Redis;
  /** Key namespace prefix. Default `"syncframe"`. */
  prefix?: string;
}

/**
 * Anchors, meta, and content data are stored as JSON under namespaced keys.
 * The set of channel ids per room is tracked in a Redis set so `listAnchors`
 * (and therefore snapshot building) works without key scanning.
 */
export class RedisStore implements SyncStore {
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(options: RedisStoreOptions) {
    this.redis = options.redis;
    this.prefix = options.prefix ?? DEFAULT_PREFIX;
  }

  private ns(roomId: string): string {
    return `${this.prefix}:${roomId}`;
  }
  private anchorKey(roomId: string, channelId: string): string {
    return `${this.ns(roomId)}:anchor:${channelId}`;
  }
  private channelsKey(roomId: string): string {
    return `${this.ns(roomId)}:channels`;
  }
  private metaKey(roomId: string): string {
    return `${this.ns(roomId)}:meta`;
  }
  private contentKey(roomId: string): string {
    return `${this.ns(roomId)}:content`;
  }

  async getAnchor(roomId: string, channelId: string): Promise<AnyAnchor | null> {
    return readJson<AnyAnchor>(this.redis, this.anchorKey(roomId, channelId));
  }

  async setAnchor(roomId: string, channelId: string, anchor: AnyAnchor): Promise<void> {
    await Promise.all([
      this.redis.set(this.anchorKey(roomId, channelId), JSON.stringify(anchor)),
      this.redis.sadd(this.channelsKey(roomId), channelId),
    ]);
  }

  async deleteAnchor(roomId: string, channelId: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.anchorKey(roomId, channelId)),
      this.redis.srem(this.channelsKey(roomId), channelId),
    ]);
  }

  async listAnchors(roomId: string): Promise<Record<string, AnyAnchor | null>> {
    const channels = await this.redis.smembers(this.channelsKey(roomId));
    const entries = await Promise.all(
      channels.map(async (channelId): Promise<[string, AnyAnchor | null]> => [
        channelId,
        await this.getAnchor(roomId, channelId),
      ]),
    );
    return Object.fromEntries(entries);
  }

  async getMeta(roomId: string): Promise<Record<string, unknown>> {
    return (await readJson<Record<string, unknown>>(this.redis, this.metaKey(roomId))) ?? {};
  }

  async setMeta(roomId: string, meta: Record<string, unknown>): Promise<void> {
    await this.redis.set(this.metaKey(roomId), JSON.stringify(meta));
  }

  async getContentData(roomId: string): Promise<Record<string, unknown> | null> {
    return readJson<Record<string, unknown>>(this.redis, this.contentKey(roomId));
  }

  async setContentData(roomId: string, data: Record<string, unknown>): Promise<void> {
    await this.redis.set(this.contentKey(roomId), JSON.stringify(data));
  }
}

export interface RedisTransportOptions {
  /** Client used to PUBLISH snapshots. */
  redis: Redis;
  /**
   * Factory for a fresh subscriber connection. A Redis connection in subscribe
   * mode can't issue other commands, so each `subscribe()` gets its own.
   */
  createSubscriber: () => Redis;
  /** Channel namespace prefix. Default `"syncframe"`. */
  prefix?: string;
}

export class RedisTransport implements SyncTransport {
  private readonly redis: Redis;
  private readonly createSubscriber: () => Redis;
  private readonly prefix: string;

  constructor(options: RedisTransportOptions) {
    this.redis = options.redis;
    this.createSubscriber = options.createSubscriber;
    this.prefix = options.prefix ?? DEFAULT_PREFIX;
  }

  private channel(roomId: string): string {
    return `${this.prefix}:${roomId}:updates`;
  }

  async publish(roomId: string, snapshot: CoreSnapshot): Promise<void> {
    await this.redis.publish(this.channel(roomId), JSON.stringify(snapshot));
  }

  async subscribe(
    roomId: string,
    handler: (snapshot: CoreSnapshot) => void,
  ): Promise<() => void> {
    const subscriber = this.createSubscriber();
    const channel = this.channel(roomId);

    subscriber.on('message', (incoming: string, message: string) => {
      if (incoming === channel) handler(JSON.parse(message) as CoreSnapshot);
    });
    await subscriber.subscribe(channel);

    return () => {
      void subscriber.quit();
    };
  }
}
