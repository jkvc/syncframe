/**
 * SpatialServer — bridge over SyncServer for meta.spatial read/write.
 */

import type { SyncServer } from '@syncframe/core/server';
import {
  defaultSpatialMeta,
  parseSpatialMeta,
  pruneStaleSessions,
} from './reducers';
import type { SpatialMeta } from './types';

export interface SpatialServerOptions {
  sync: SyncServer;
  /** Key under room meta; default `'spatial'`. */
  metaKey?: string;
}

export class SpatialServer {
  readonly sync: SyncServer;
  readonly metaKey: string;

  constructor(options: SpatialServerOptions) {
    this.sync = options.sync;
    this.metaKey = options.metaKey ?? 'spatial';
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
    const initial = defaultSpatialMeta();
    await this.sync.patchMeta({ [this.metaKey]: initial });
    return initial;
  }

  async publish(): Promise<void> {
    await this.sync.publishUpdate();
  }
}
