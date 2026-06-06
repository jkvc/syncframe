/**
 * @syncframe/core — transport interface.
 *
 * Pluggable pub/sub layer. Core ships EventEmitterTransport by default;
 * @syncframe/redis ships RedisTransport. Consumers can implement their own
 * (WebSocket, Cloudflare Durable Objects, etc.).
 */

import type { CoreSnapshot } from './types';

export interface SyncTransport {
  publish(roomId: string, snapshot: CoreSnapshot): Promise<void>;
  subscribe(
    roomId: string,
    handler: (snapshot: CoreSnapshot) => void,
  ): Promise<() => void>;
}
