import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';
import { SpatialServer } from '@syncframe/spatial/server';
import { getRedis, createSubscriber } from '@/lib/redis';
import { buildRingInitialMeta } from './ring-initial-meta';

/** Isolated namespace — separate from the dot spatial demo room. */
export const RING_NAMESPACE = 'spatial-ring';

const globalForRing = globalThis as typeof globalThis & {
  __ringSyncServer?: SyncServer;
  __ringSpatialServer?: SpatialServer;
};

function createRingSyncServer(): SyncServer {
  return new SyncServer({
    store: new RedisStore({ redis: getRedis() }),
    transport: new RedisTransport({ redis: getRedis(), createSubscriber }),
    namespace: RING_NAMESPACE,
  });
}

export function getRingSyncServer(): SyncServer {
  const existing = globalForRing.__ringSyncServer;
  if (existing && typeof existing.ensureAnchor === 'function') return existing;
  return (globalForRing.__ringSyncServer = createRingSyncServer());
}

export function getRingSpatialServer(): SpatialServer {
  return (globalForRing.__ringSpatialServer ??= new SpatialServer({
    sync: getRingSyncServer(),
    maxScreens: 4,
    initialMeta: buildRingInitialMeta(),
  }));
}
