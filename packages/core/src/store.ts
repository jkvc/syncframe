/**
 * @syncframe/core — storage interface.
 *
 * Pluggable storage layer. Core ships InMemoryStore by default;
 * @syncframe/redis ships RedisStore. Consumers can implement their own
 * (PostgresStore, etc.).
 */

import type { AnyAnchor, CoreSnapshot } from './types';

export interface SyncStore {
  getAnchor(roomId: string, channelId: string): Promise<AnyAnchor | null>;
  setAnchor(roomId: string, channelId: string, anchor: AnyAnchor): Promise<void>;
  deleteAnchor(roomId: string, channelId: string): Promise<void>;
  listAnchors(roomId: string): Promise<Record<string, AnyAnchor | null>>;

  getMeta(roomId: string): Promise<Record<string, unknown>>;
  setMeta(roomId: string, meta: Record<string, unknown>): Promise<void>;

  getContentData(roomId: string): Promise<Record<string, unknown> | null>;
  setContentData(roomId: string, data: Record<string, unknown>): Promise<void>;
}

/**
 * Build a snapshot from the store — the minimal state for Layer 1.
 */
export async function buildCoreSnapshot(
  store: SyncStore,
  roomId: string,
): Promise<CoreSnapshot> {
  const [anchors, meta, contentData] = await Promise.all([
    store.listAnchors(roomId),
    store.getMeta(roomId),
    store.getContentData(roomId),
  ]);

  return { anchors, meta, contentData };
}
