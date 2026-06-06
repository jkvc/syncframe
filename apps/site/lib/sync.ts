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

// Room/channel constants live in lib/timer (client-safe). Re-exported here for
// route convenience.
export { ROOM_ID, CHANNEL_ID } from '@/lib/timer';

const globalForSync = globalThis as typeof globalThis & { __syncServer?: SyncServer };

export function getSyncServer(): SyncServer {
  return (globalForSync.__syncServer ??= new SyncServer({
    store: new RedisStore({ redis: getRedis() }),
    transport: new RedisTransport({ redis: getRedis(), createSubscriber }),
  }));
}
