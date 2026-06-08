import { describe, expect, it } from 'vitest';
import { InMemoryStore, EventEmitterTransport } from '@syncframe/core/server';
import { SyncServer } from '@syncframe/core/server';
import { SpatialServer } from '../spatial-server';
import { defaultSpatialMeta, ensureScreen, setRenderMode } from '../reducers';

function makeSpatialServer() {
  const store = new InMemoryStore();
  const transport = new EventEmitterTransport();
  const sync = new SyncServer({ store, transport, namespace: 'spatial-demo' });
  return new SpatialServer({ sync });
}

describe('SpatialServer', () => {
  it('deep-merges spatial meta — renderMode patch preserves screens', async () => {
    const spatial = makeSpatialServer();
    await spatial.apply((m) => {
      const r = ensureScreen(m, 'desk-left');
      return r === 'limit_reached' ? m : r;
    });
    await spatial.apply((m) => setRenderMode(m, 'content'));

    const meta = await spatial.getMeta();
    expect(meta.renderMode).toBe('content');
    expect(meta.screens['desk-left']).toBeDefined();
  });

  it('initializes default spatial meta when missing', async () => {
    const spatial = makeSpatialServer();
    const meta = await spatial.getMeta();
    expect(meta.worldBbox.width).toBe(defaultSpatialMeta().worldBbox.width);
    expect(meta.renderMode).toBe('calibration');
    expect(meta.contentLayerId).toBeUndefined();
  });

  it('ensureInitialized merges initialMeta from options', async () => {
    const spatial = new SpatialServer({
      sync: new SyncServer({
        store: new InMemoryStore(),
        transport: new EventEmitterTransport(),
        namespace: 'init-meta-test',
      }),
      initialMeta: { contentLayerId: 'dot' },
    });
    const meta = await spatial.ensureInitialized();
    expect(meta.contentLayerId).toBe('dot');
  });

  it('registerScreen enforces maxScreens', async () => {
    const spatial = new SpatialServer({
      sync: new SyncServer({
        store: new InMemoryStore(),
        transport: new EventEmitterTransport(),
        namespace: 'limit-test',
      }),
      maxScreens: 2,
    });
    expect((await spatial.registerScreen('a')).ok).toBe(true);
    expect((await spatial.registerScreen('b')).ok).toBe(true);
    const third = await spatial.registerScreen('c');
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.reason).toBe('limit_reached');
    expect((await spatial.registerScreen('a')).ok).toBe(true);
  });
});
