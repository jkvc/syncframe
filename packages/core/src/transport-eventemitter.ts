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

  async publish(namespace: string, snapshot: CoreSnapshot): Promise<void> {
    this.emitter.emit(`ns:${namespace}`, snapshot);
  }

  async subscribe(
    namespace: string,
    handler: (snapshot: CoreSnapshot) => void,
  ): Promise<() => void> {
    const channel = `ns:${namespace}`;
    this.emitter.on(channel, handler);
    return async () => {
      this.emitter.off(channel, handler);
    };
  }
}
