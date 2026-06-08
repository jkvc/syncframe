import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';
import { SpatialServer } from '@syncframe/spatial/server';
import { getRedis, createSubscriber } from '@/lib/redis';
import { SPATIAL_MAX_SCREENS } from '@/lib/spatial-config';

/** Spatial demo namespace — bound at SyncServer construction, not exposed to clients. */
export const SPATIAL_NAMESPACE = 'spatial-demo';

const globalForSpatial = globalThis as typeof globalThis & {
  __spatialSyncServer?: SyncServer;
  __spatialServer?: SpatialServer;
};

function createSpatialSyncServer(): SyncServer {
  return new SyncServer({
    store: new RedisStore({ redis: getRedis() }),
    transport: new RedisTransport({ redis: getRedis(), createSubscriber }),
    namespace: SPATIAL_NAMESPACE,
  });
}

export function getSpatialSyncServer(): SyncServer {
  const existing = globalForSpatial.__spatialSyncServer;
  if (existing && typeof existing.ensureAnchor === 'function') return existing;
  return (globalForSpatial.__spatialSyncServer = createSpatialSyncServer());
}

export function getSpatialServer(): SpatialServer {
  return (globalForSpatial.__spatialServer ??= new SpatialServer({
    sync: getSpatialSyncServer(),
    maxScreens: SPATIAL_MAX_SCREENS,
  }));
}
