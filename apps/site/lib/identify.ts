/**
 * Transient identify trigger — separate Redis key with TTL (not in meta JSON).
 */

import type Redis from 'ioredis';
import {
  IDENTIFY_TRIGGER_TTL_SECONDS,
  type IdentifyTrigger,
} from '@syncframe/spatial/server';
import { SPATIAL_NAMESPACE } from '@/lib/spatial-server';

const PREFIX = 'syncframe';

export function identifyKey(): string {
  return `${PREFIX}:${SPATIAL_NAMESPACE}:spatial:identify`;
}

export async function setIdentifyTrigger(
  redis: Redis,
  screenName: string,
): Promise<IdentifyTrigger> {
  const trigger: IdentifyTrigger = { screenName, at: Date.now() };
  await redis.set(
    identifyKey(),
    JSON.stringify(trigger),
    'EX',
    IDENTIFY_TRIGGER_TTL_SECONDS,
  );
  return trigger;
}

export async function getIdentifyTrigger(
  redis: Redis,
): Promise<IdentifyTrigger | null> {
  const raw = await redis.get(identifyKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IdentifyTrigger;
  } catch {
    return null;
  }
}
