/**
 * @syncframe/core — EventEmitterTransport tests.
 *
 * Validates pub/sub: publish, subscribe, unsubscribe, room isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitterTransport } from '../transport-eventemitter';
import type { CoreSnapshot } from '../types';

describe('EventEmitterTransport', () => {
  let transport: EventEmitterTransport;

  beforeEach(() => {
    transport = new EventEmitterTransport();
  });

  const snapshot: CoreSnapshot = {
    anchors: {
      ch1: { at: 1000, value: 42, motion: { kind: 'scalar' } },
    },
    meta: { title: 'Room' },
    contentData: { videoId: 'abc' },
  };

  describe('publish and subscribe', () => {
    it('delivers snapshot to subscriber', async () => {
      const handler = vi.fn();
      await transport.subscribe('room1', handler);
      await transport.publish('room1', snapshot);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(snapshot);
    });

    it('delivers to multiple subscribers', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      await transport.subscribe('room1', h1);
      await transport.subscribe('room1', h2);
      await transport.publish('room1', snapshot);
      expect(h1).toHaveBeenCalled();
      expect(h2).toHaveBeenCalled();
    });

    it('isolates by room', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      await transport.subscribe('room1', h1);
      await transport.subscribe('room2', h2);
      await transport.publish('room1', snapshot);
      expect(h1).toHaveBeenCalled();
      expect(h2).not.toHaveBeenCalled();
    });

    it('delivers multiple publishes', async () => {
      const handler = vi.fn();
      await transport.subscribe('room1', handler);
      await transport.publish('room1', snapshot);
      await transport.publish('room1', { ...snapshot, meta: { updated: true } });
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('publish to room with no subscribers does not throw', async () => {
      await expect(transport.publish('room1', snapshot)).resolves.toBeUndefined();
    });
  });

  describe('unsubscribe', () => {
    it('stops delivery after unsubscribe', async () => {
      const handler = vi.fn();
      const unsub = await transport.subscribe('room1', handler);
      await transport.publish('room1', snapshot);
      unsub();
      await transport.publish('room1', snapshot);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('only unsubscribes the specific handler', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const unsub = await transport.subscribe('room1', h1);
      await transport.subscribe('room1', h2);
      unsub();
      await transport.publish('room1', snapshot);
      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalled();
    });

    it('unsubscribe from one room does not affect another', async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      const unsub = await transport.subscribe('room1', h1);
      await transport.subscribe('room2', h2);
      unsub();
      await transport.publish('room1', snapshot);
      await transport.publish('room2', snapshot);
      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalled();
    });

    it('double unsubscribe is safe', async () => {
      const handler = vi.fn();
      const unsub = await transport.subscribe('room1', handler);
      unsub();
      await expect(unsub()).resolves.toBeUndefined();
    });
  });

  describe('snapshot shapes', () => {
    it('delivers empty snapshot', async () => {
      const empty: CoreSnapshot = { anchors: {}, meta: {}, contentData: null };
      const handler = vi.fn();
      await transport.subscribe('room1', handler);
      await transport.publish('room1', empty);
      expect(handler).toHaveBeenCalledWith(empty);
    });

    it('delivers snapshot with multiple anchors', async () => {
      const multi: CoreSnapshot = {
        anchors: {
          player1: { at: 1000, value: { x: 0, y: 0 }, motion: { kind: 'linear2d' } },
          video: { at: 2000, value: 45.5, motion: { kind: 'playback' } },
          light: { at: 3000, value: [255, 0, 0], motion: { kind: 'color' } },
        },
        meta: {},
        contentData: null,
      };
      const handler = vi.fn<(snapshot: CoreSnapshot) => void>();
      await transport.subscribe('room1', handler);
      await transport.publish('room1', multi);
      const received = handler.mock.calls[0]![0]!;
      expect(Object.keys(received.anchors)).toHaveLength(3);
    });
  });
});
