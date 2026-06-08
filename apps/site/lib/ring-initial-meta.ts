import type { SpatialMeta } from '@syncframe/spatial/server';
import { RING_WORLD_SIZE } from './ring-config';

const HALF = RING_WORLD_SIZE / 2;

function quadrantEntry(worldX: number, worldY: number) {
  return {
    pose: {
      worldX,
      worldY,
      worldWidth: HALF,
      worldHeight: HALF,
    },
    createdAt: new Date().toISOString(),
    sessions: {},
  };
}

/** Four fixed quadrant windows — no operator pose editing in this demo. */
export function buildRingInitialMeta(): SpatialMeta {
  return {
    worldBbox: { width: RING_WORLD_SIZE, height: RING_WORLD_SIZE },
    renderMode: 'content',
    contentLayerId: 'ring',
    screens: {
      nw: quadrantEntry(0, 0),
      ne: quadrantEntry(HALF, 0),
      sw: quadrantEntry(0, HALF),
      se: quadrantEntry(HALF, HALF),
    },
  };
}
