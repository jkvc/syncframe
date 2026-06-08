/**
 * @syncframe/core — server class.
 *
 * Wires store + transport into a single API surface bound to one namespace.
 * Framework adapters (Next.js, Express, Hono) wrap this.
 *
 * Customers needing multiple isolated sync scopes run multiple SyncServer
 * instances (each with its own namespace) over a shared or separate store.
 */

import type { AnyAnchor, CoreSnapshot } from './types';
import type { SyncStore } from './store';
import type { SyncTransport } from './transport';
import { buildCoreSnapshot } from './store';

export interface SyncServerOptions {
  store: SyncStore;
  transport: SyncTransport;
  /** Partition key for this server instance. Default `'default'`. */
  namespace?: string;
}

export class SyncServer {
  readonly store: SyncStore;
  readonly transport: SyncTransport;
  readonly namespace: string;

  constructor(options: SyncServerOptions) {
    this.store = options.store;
    this.transport = options.transport;
    this.namespace = options.namespace ?? 'default';
  }

  // ─── Anchor CRUD ───────────────────────────────────────────────────────────

  async getAnchor(channelId: string): Promise<AnyAnchor | null> {
    return this.store.getAnchor(this.namespace, channelId);
  }

  async setAnchor(channelId: string, anchor: AnyAnchor): Promise<void> {
    await this.store.setAnchor(this.namespace, channelId, anchor);
  }

  async deleteAnchor(channelId: string): Promise<void> {
    await this.store.deleteAnchor(this.namespace, channelId);
  }

  /**
   * Return an anchor, creating it if missing. Always calls `setAnchor` so the
   * store's channel registry stays in sync with the anchor key (repairs orphans
   * where the value exists but `listAnchors` would miss it).
   */
  async ensureAnchor(channelId: string, factory: () => AnyAnchor): Promise<AnyAnchor> {
    const existing = await this.getAnchor(channelId);
    const anchor = existing ?? factory();
    await this.setAnchor(channelId, anchor);
    return anchor;
  }

  async listAnchors(): Promise<Record<string, AnyAnchor | null>> {
    return this.store.listAnchors(this.namespace);
  }

  // ─── Meta ──────────────────────────────────────────────────────────────────

  async getMeta(): Promise<Record<string, unknown>> {
    return this.store.getMeta(this.namespace);
  }

  async patchMeta(patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const current = await this.store.getMeta(this.namespace);
    const next = { ...current, ...patch };
    await this.store.setMeta(this.namespace, next);
    return next;
  }

  // ─── Content data ──────────────────────────────────────────────────────────

  async getContentData(): Promise<Record<string, unknown> | null> {
    return this.store.getContentData(this.namespace);
  }

  async patchContentData(
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const current = (await this.store.getContentData(this.namespace)) ?? {};
    const next = { ...current };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === null) delete next[k];
      else next[k] = v;
    }
    await this.store.setContentData(this.namespace, next);
    return next;
  }

  // ─── Snapshot + publish ────────────────────────────────────────────────────

  async buildSnapshot(): Promise<CoreSnapshot> {
    return buildCoreSnapshot(this.store, this.namespace);
  }

  async publishUpdate(): Promise<void> {
    const snapshot = await this.buildSnapshot();
    await this.transport.publish(this.namespace, snapshot);
  }

  async subscribe(handler: (snapshot: CoreSnapshot) => void): Promise<() => void> {
    return this.transport.subscribe(this.namespace, handler);
  }

  // ─── Clock probe ───────────────────────────────────────────────────────────

  clockProbe(): number {
    return Date.now();
  }
}
