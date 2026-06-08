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
 * The set of channel ids per namespace is tracked in a Redis set so `listAnchors`
 * (and therefore snapshot building) works without key scanning.
 */
export class RedisStore implements SyncStore {
  private readonly redis: Redis;
  private readonly prefix: string;

  constructor(options: RedisStoreOptions) {
    this.redis = options.redis;
    this.prefix = options.prefix ?? DEFAULT_PREFIX;
  }

  private ns(namespace: string): string {
    return `${this.prefix}:${namespace}`;
  }
  private anchorKey(namespace: string, channelId: string): string {
    return `${this.ns(namespace)}:anchor:${channelId}`;
  }
  private channelsKey(namespace: string): string {
    return `${this.ns(namespace)}:channels`;
  }
  private metaKey(namespace: string): string {
    return `${this.ns(namespace)}:meta`;
  }
  private contentKey(namespace: string): string {
    return `${this.ns(namespace)}:content`;
  }

  async getAnchor(namespace: string, channelId: string): Promise<AnyAnchor | null> {
    return readJson<AnyAnchor>(this.redis, this.anchorKey(namespace, channelId));
  }

  async setAnchor(namespace: string, channelId: string, anchor: AnyAnchor): Promise<void> {
    await Promise.all([
      this.redis.set(this.anchorKey(namespace, channelId), JSON.stringify(anchor)),
      this.redis.sadd(this.channelsKey(namespace), channelId),
    ]);
  }

  async deleteAnchor(namespace: string, channelId: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.anchorKey(namespace, channelId)),
      this.redis.srem(this.channelsKey(namespace), channelId),
    ]);
  }

  async listAnchors(namespace: string): Promise<Record<string, AnyAnchor | null>> {
    const channels = await this.redis.smembers(this.channelsKey(namespace));
    const entries = await Promise.all(
      channels.map(async (channelId): Promise<[string, AnyAnchor | null]> => [
        channelId,
        await this.getAnchor(namespace, channelId),
      ]),
    );
    return Object.fromEntries(entries);
  }

  async getMeta(namespace: string): Promise<Record<string, unknown>> {
    return (await readJson<Record<string, unknown>>(this.redis, this.metaKey(namespace))) ?? {};
  }

  async setMeta(namespace: string, meta: Record<string, unknown>): Promise<void> {
    await this.redis.set(this.metaKey(namespace), JSON.stringify(meta));
  }

  async getContentData(namespace: string): Promise<Record<string, unknown> | null> {
    return readJson<Record<string, unknown>>(this.redis, this.contentKey(namespace));
  }

  async setContentData(namespace: string, data: Record<string, unknown>): Promise<void> {
    await this.redis.set(this.contentKey(namespace), JSON.stringify(data));
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

  private channel(namespace: string): string {
    return `${this.prefix}:${namespace}:updates`;
  }

  async publish(namespace: string, snapshot: CoreSnapshot): Promise<void> {
    await this.redis.publish(this.channel(namespace), JSON.stringify(snapshot));
  }

  async subscribe(
    namespace: string,
    handler: (snapshot: CoreSnapshot) => void,
  ): Promise<() => void> {
    const subscriber = this.createSubscriber();
    const channel = this.channel(namespace);

    subscriber.on('message', (incoming: string, message: string) => {
      if (incoming === channel) handler(JSON.parse(message) as CoreSnapshot);
    });
    await subscriber.subscribe(channel);

    return () => {
      void subscriber.quit();
    };
  }
}
