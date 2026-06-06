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

  private getRoomAnchors(roomId: string): Record<string, AnyAnchor | null> {
    let room = this.anchors.get(roomId);
    if (!room) {
      room = {};
      this.anchors.set(roomId, room);
    }
    return room;
  }

  async getAnchor(roomId: string, channelId: string): Promise<AnyAnchor | null> {
    const room = this.anchors.get(roomId);
    return room?.[channelId] ?? null;
  }

  async setAnchor(roomId: string, channelId: string, anchor: AnyAnchor): Promise<void> {
    const room = this.getRoomAnchors(roomId);
    room[channelId] = anchor;
  }

  async deleteAnchor(roomId: string, channelId: string): Promise<void> {
    const room = this.anchors.get(roomId);
    if (room) {
      delete room[channelId];
    }
  }

  async listAnchors(roomId: string): Promise<Record<string, AnyAnchor | null>> {
    return { ...this.getRoomAnchors(roomId) };
  }

  async getMeta(roomId: string): Promise<Record<string, unknown>> {
    return this.meta.get(roomId) ?? {};
  }

  async setMeta(roomId: string, meta: Record<string, unknown>): Promise<void> {
    this.meta.set(roomId, meta);
  }

  async getContentData(roomId: string): Promise<Record<string, unknown> | null> {
    return this.contentData.get(roomId) ?? null;
  }

  async setContentData(roomId: string, data: Record<string, unknown>): Promise<void> {
    this.contentData.set(roomId, data);
  }
}
