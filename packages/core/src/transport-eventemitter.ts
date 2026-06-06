/**
 * @syncframe/core — EventEmitter-based transport.
 *
 * Zero-dependency default for single-process deployments.
 * Uses Node.js EventEmitter for pub/sub.
 */

import { EventEmitter } from 'events';
import type { CoreSnapshot } from './types';
import type { SyncTransport } from './transport';

export class EventEmitterTransport implements SyncTransport {
  private emitter = new EventEmitter();

  async publish(roomId: string, snapshot: CoreSnapshot): Promise<void> {
    this.emitter.emit(`room:${roomId}`, snapshot);
  }

  async subscribe(
    roomId: string,
    handler: (snapshot: CoreSnapshot) => void,
  ): Promise<() => void> {
    const channel = `room:${roomId}`;
    this.emitter.on(channel, handler);
    return async () => {
      this.emitter.off(channel, handler);
    };
  }
}
