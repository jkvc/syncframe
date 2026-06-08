/**
 * Wires the Redis adapters from @syncframe/redis into a core SyncServer for the
 * timer demo. Connection management stays here (env URL, dev singleton); the
 * adapter package is connection-agnostic and receives the clients.
 *
 * `SyncServer` comes from core's `/server` entry, which is React-free, so this
 * server-only file never pulls core's hooks into the bundle.
 */

import { SyncServer } from '@syncframe/core/server';
import { RedisStore, RedisTransport } from '@syncframe/redis';
import { getRedis, createSubscriber } from '@/lib/redis';

export { CHANNEL_ID } from '@/lib/timer';

/** Timer demo namespace — bound at SyncServer construction, not exposed to clients. */
export const TIMER_NAMESPACE = 'global';

const globalForSync = globalThis as typeof globalThis & { __syncServer?: SyncServer };

function createSyncServer(): SyncServer {
  return new SyncServer({
    store: new RedisStore({ redis: getRedis() }),
    transport: new RedisTransport({ redis: getRedis(), createSubscriber }),
    namespace: TIMER_NAMESPACE,
  });
}

export function getSyncServer(): SyncServer {
  const existing = globalForSync.__syncServer;
  if (existing && typeof existing.ensureAnchor === 'function') return existing;
  return (globalForSync.__syncServer = createSyncServer());
}
