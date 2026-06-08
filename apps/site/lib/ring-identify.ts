import type Redis from 'ioredis';
import {
  IDENTIFY_TRIGGER_TTL_SECONDS,
  type IdentifyTrigger,
} from '@syncframe/spatial/server';
import { RING_NAMESPACE } from './ring-server';

const PREFIX = 'syncframe';

export function ringIdentifyKey(): string {
  return `${PREFIX}:${RING_NAMESPACE}:spatial:identify`;
}

export async function setRingIdentifyTrigger(
  redis: Redis,
  screenName: string,
): Promise<IdentifyTrigger> {
  const trigger: IdentifyTrigger = { screenName, at: Date.now() };
  await redis.set(
    ringIdentifyKey(),
    JSON.stringify(trigger),
    'EX',
    IDENTIFY_TRIGGER_TTL_SECONDS,
  );
  return trigger;
}

export async function getRingIdentifyTrigger(
  redis: Redis,
): Promise<IdentifyTrigger | null> {
  const raw = await redis.get(ringIdentifyKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IdentifyTrigger;
  } catch {
    return null;
  }
}
