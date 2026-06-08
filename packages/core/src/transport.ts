/**
 * @syncframe/core — transport interface.
 *
 * Pluggable pub/sub for snapshot fan-out. Core ships EventEmitterTransport
 * by default; @syncframe/redis ships RedisTransport.
 */

import type { CoreSnapshot } from './types';

export interface SyncTransport {
  publish(namespace: string, snapshot: CoreSnapshot): Promise<void>;
  subscribe(
    namespace: string,
    handler: (snapshot: CoreSnapshot) => void,
  ): Promise<() => void>;
}
