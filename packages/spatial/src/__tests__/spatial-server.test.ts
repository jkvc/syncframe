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
    await spatial.apply((m) => ensureScreen(m, 'desk-left'));
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
  });
});
