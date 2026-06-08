import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';
import { SpatialServer } from '@syncframe/spatial/server';
import { getRedis, createSubscriber } from '@/lib/redis';
import { DOT_CONTENT_LAYER_ID, DOT_MAX_SCREENS } from '@/lib/dot-config';

/** Dot demo SyncServer namespace — isolated from the color ring room. */
export const DOT_NAMESPACE = 'dot-demo';

const globalForDot = globalThis as typeof globalThis & {
  __dotSyncServer?: SyncServer;
  __dotSpatialServer?: SpatialServer;
};

function createDotSyncServer(): SyncServer {
  return new SyncServer({
    store: new RedisStore({ redis: getRedis() }),
    transport: new RedisTransport({ redis: getRedis(), createSubscriber }),
    namespace: DOT_NAMESPACE,
  });
}

export function getDotSyncServer(): SyncServer {
  const existing = globalForDot.__dotSyncServer;
  if (existing && typeof existing.ensureAnchor === 'function') return existing;
  return (globalForDot.__dotSyncServer = createDotSyncServer());
}

export function getDotSpatialServer(): SpatialServer {
  return (globalForDot.__dotSpatialServer ??= new SpatialServer({
    sync: getDotSyncServer(),
    maxScreens: DOT_MAX_SCREENS,
    initialMeta: { contentLayerId: DOT_CONTENT_LAYER_ID },
  }));
}
