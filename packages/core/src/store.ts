/**
 * @syncframe/core — storage interface.
 *
 * Pluggable storage layer. Core ships InMemoryStore by default;
 * @syncframe/redis ships RedisStore. Consumers can implement their own
 * (PostgresStore, etc.).
 *
 * The `namespace` partition key is a low-level primitive. Typical apps bind
 * one namespace per SyncServer instance; customers needing multiple partitions
 * run multiple servers or wire the store directly.
 */

import type { AnyAnchor, CoreSnapshot } from './types';

export interface SyncStore {
  getAnchor(namespace: string, channelId: string): Promise<AnyAnchor | null>;
  setAnchor(namespace: string, channelId: string, anchor: AnyAnchor): Promise<void>;
  deleteAnchor(namespace: string, channelId: string): Promise<void>;
  listAnchors(namespace: string): Promise<Record<string, AnyAnchor | null>>;

  getMeta(namespace: string): Promise<Record<string, unknown>>;
  setMeta(namespace: string, meta: Record<string, unknown>): Promise<void>;

  getContentData(namespace: string): Promise<Record<string, unknown> | null>;
  setContentData(namespace: string, data: Record<string, unknown>): Promise<void>;
}

/**
 * Build a snapshot from the store — the minimal state for Layer 1.
 */
export async function buildCoreSnapshot(
  store: SyncStore,
  namespace: string,
): Promise<CoreSnapshot> {
  const [anchors, meta, contentData] = await Promise.all([
    store.listAnchors(namespace),
    store.getMeta(namespace),
    store.getContentData(namespace),
  ]);

  return { anchors, meta, contentData };
}
