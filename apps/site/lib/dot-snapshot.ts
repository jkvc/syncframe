import type { CoreSnapshot } from '@syncframe/core/server';
import type { SyncServer } from '@syncframe/core/server';
import { parseSpatialMeta, pruneStaleSessions } from '@syncframe/spatial/server';
import type Redis from 'ioredis';
import { getDotIdentifyTrigger } from './dot-identify';

export async function buildDotDemoSnapshot(
  server: SyncServer,
  redis: Redis,
): Promise<CoreSnapshot> {
  const snapshot = await server.buildSnapshot();
  const spatial = pruneStaleSessions(
    parseSpatialMeta(snapshot.meta.spatial),
    Date.now(),
  );
  const identifyTrigger = await getDotIdentifyTrigger(redis);
  return {
    ...snapshot,
    meta: {
      ...snapshot.meta,
      spatial: {
        ...spatial,
        identifyTrigger,
      },
    },
  };
}
