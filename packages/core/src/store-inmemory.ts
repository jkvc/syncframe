/**
 * @syncframe/core — in-memory store implementation.
 *
 * Zero-dependency default. Perfect for local dev, hackathons, single-process demos.
 * Trade-off: state lost on restart, no multi-worker support.
 */

import type { AnyAnchor } from './types';
import type { SyncStore } from './store';

export class InMemoryStore implements SyncStore {
  private anchors = new Map<string, Record<string, AnyAnchor | null>>();
  private meta = new Map<string, Record<string, unknown>>();
  private contentData = new Map<string, Record<string, unknown>>();

  private getNamespaceAnchors(namespace: string): Record<string, AnyAnchor | null> {
    let bucket = this.anchors.get(namespace);
    if (!bucket) {
      bucket = {};
      this.anchors.set(namespace, bucket);
    }
    return bucket;
  }

  async getAnchor(namespace: string, channelId: string): Promise<AnyAnchor | null> {
    const bucket = this.anchors.get(namespace);
    return bucket?.[channelId] ?? null;
  }

  async setAnchor(namespace: string, channelId: string, anchor: AnyAnchor): Promise<void> {
    const bucket = this.getNamespaceAnchors(namespace);
    bucket[channelId] = anchor;
  }

  async deleteAnchor(namespace: string, channelId: string): Promise<void> {
    const bucket = this.anchors.get(namespace);
    if (bucket) {
      delete bucket[channelId];
    }
  }

  async listAnchors(namespace: string): Promise<Record<string, AnyAnchor | null>> {
    return { ...this.getNamespaceAnchors(namespace) };
  }

  async getMeta(namespace: string): Promise<Record<string, unknown>> {
    return this.meta.get(namespace) ?? {};
  }

  async setMeta(namespace: string, meta: Record<string, unknown>): Promise<void> {
    this.meta.set(namespace, meta);
  }

  async getContentData(namespace: string): Promise<Record<string, unknown> | null> {
    return this.contentData.get(namespace) ?? null;
  }

  async setContentData(namespace: string, data: Record<string, unknown>): Promise<void> {
    this.contentData.set(namespace, data);
  }
}
