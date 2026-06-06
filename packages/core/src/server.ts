/**
 * @syncframe/core — server class.
 *
 * Wires store + transport into a single API surface.
 * Framework adapters (Next.js, Express, Hono) wrap this.
 */

import type { AnyAnchor, CoreSnapshot } from './types';
import type { SyncStore } from './store';
import type { SyncTransport } from './transport';
import { buildCoreSnapshot } from './store';

export interface SyncServerOptions {
  store: SyncStore;
  transport: SyncTransport;
}

export class SyncServer {
  readonly store: SyncStore;
  readonly transport: SyncTransport;

  constructor(options: SyncServerOptions) {
    this.store = options.store;
    this.transport = options.transport;
  }

  // ─── Anchor CRUD ───────────────────────────────────────────────────────────

  async getAnchor(roomId: string, channelId: string): Promise<AnyAnchor | null> {
    return this.store.getAnchor(roomId, channelId);
  }

  async setAnchor(roomId: string, channelId: string, anchor: AnyAnchor): Promise<void> {
    await this.store.setAnchor(roomId, channelId, anchor);
  }

  async deleteAnchor(roomId: string, channelId: string): Promise<void> {
    await this.store.deleteAnchor(roomId, channelId);
  }

  async listAnchors(roomId: string): Promise<Record<string, AnyAnchor | null>> {
    return this.store.listAnchors(roomId);
  }

  // ─── Meta ──────────────────────────────────────────────────────────────────

  async getMeta(roomId: string): Promise<Record<string, unknown>> {
    return this.store.getMeta(roomId);
  }

  async patchMeta(
    roomId: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const current = await this.store.getMeta(roomId);
    const next = { ...current, ...patch };
    await this.store.setMeta(roomId, next);
    return next;
  }

  // ─── Content data ──────────────────────────────────────────────────────────

  async getContentData(roomId: string): Promise<Record<string, unknown> | null> {
    return this.store.getContentData(roomId);
  }

  async patchContentData(
    roomId: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const current = (await this.store.getContentData(roomId)) ?? {};
    const next = { ...current };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === null) delete next[k];
      else next[k] = v;
    }
    await this.store.setContentData(roomId, next);
    return next;
  }

  // ─── Snapshot + publish ────────────────────────────────────────────────────

  async buildSnapshot(roomId: string): Promise<CoreSnapshot> {
    return buildCoreSnapshot(this.store, roomId);
  }

  async publishUpdate(roomId: string): Promise<void> {
    const snapshot = await this.buildSnapshot(roomId);
    await this.transport.publish(roomId, snapshot);
  }

  async subscribe(
    roomId: string,
    handler: (snapshot: CoreSnapshot) => void,
  ): Promise<() => void> {
    return this.transport.subscribe(roomId, handler);
  }

  // ─── Clock probe ───────────────────────────────────────────────────────────

  clockProbe(): number {
    return Date.now();
  }
}
