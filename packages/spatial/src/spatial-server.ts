/**
 * SpatialServer — bridge over SyncServer for meta.spatial read/write.
 */

import type { SyncServer } from '@syncframe/core/server';
import {
  defaultSpatialMeta,
  ensureScreen,
  parseSpatialMeta,
  pruneStaleSessions,
} from './reducers';
import { DEFAULT_MAX_SCREENS, type SpatialMeta } from './types';

export interface SpatialServerOptions {
  sync: SyncServer;
  /** Key under room meta; default `'spatial'`. */
  metaKey?: string;
  /** Max registered screens; default {@link DEFAULT_MAX_SCREENS}. */
  maxScreens?: number;
  /** Merged into {@link defaultSpatialMeta} on first {@link ensureInitialized}. */
  initialMeta?: Partial<SpatialMeta>;
}

export type RegisterScreenResult =
  | { ok: true; meta: SpatialMeta }
  | { ok: false; reason: 'limit_reached' };

export class SpatialServer {
  readonly sync: SyncServer;
  readonly metaKey: string;
  readonly maxScreens: number;
  readonly initialMeta: Partial<SpatialMeta>;

  constructor(options: SpatialServerOptions) {
    this.sync = options.sync;
    this.metaKey = options.metaKey ?? 'spatial';
    this.maxScreens = options.maxScreens ?? DEFAULT_MAX_SCREENS;
    this.initialMeta = options.initialMeta ?? {};
  }

  async getMeta(): Promise<SpatialMeta> {
    const full = await this.sync.getMeta();
    const raw = full[this.metaKey];
    const parsed = parseSpatialMeta(raw);
    return pruneStaleSessions(parsed, Date.now());
  }

  /**
   * Read-modify-write spatial meta. Always passes the full spatial object to
   * patchMeta so shallow top-level merge is safe.
   */
  async apply(mutator: (meta: SpatialMeta) => SpatialMeta): Promise<SpatialMeta> {
    const current = await this.getMeta();
    const next = mutator(current);
    await this.sync.patchMeta({ [this.metaKey]: next });
    return next;
  }

  async ensureInitialized(): Promise<SpatialMeta> {
    const full = await this.sync.getMeta();
    if (full[this.metaKey]) return this.getMeta();
    const initial = { ...defaultSpatialMeta(), ...this.initialMeta };
    await this.sync.patchMeta({ [this.metaKey]: initial });
    return initial;
  }

  async publish(): Promise<void> {
    await this.sync.publishUpdate();
  }

  /** Register a screen name; idempotent for existing names. */
  async registerScreen(name: string): Promise<RegisterScreenResult> {
    let limitReached = false;
    const meta = await this.apply((m) => {
      const result = ensureScreen(m, name, this.maxScreens);
      if (result === 'limit_reached') {
        limitReached = true;
        return m;
      }
      return result;
    });
    if (limitReached) return { ok: false, reason: 'limit_reached' };
    return { ok: true, meta };
  }
}
