import type Redis from 'ioredis';
import {
  IDENTIFY_TRIGGER_TTL_SECONDS,
  type IdentifyTrigger,
} from '@syncframe/spatial/server';
import { DOT_NAMESPACE } from './dot-server';

const PREFIX = 'syncframe';

export function dotIdentifyKey(): string {
  return `${PREFIX}:${DOT_NAMESPACE}:spatial:identify`;
}

export async function setDotIdentifyTrigger(
  redis: Redis,
  screenName: string,
): Promise<IdentifyTrigger> {
  const trigger: IdentifyTrigger = { screenName, at: Date.now() };
  await redis.set(
    dotIdentifyKey(),
    JSON.stringify(trigger),
    'EX',
    IDENTIFY_TRIGGER_TTL_SECONDS,
  );
  return trigger;
}

export async function getDotIdentifyTrigger(
  redis: Redis,
): Promise<IdentifyTrigger | null> {
  const raw = await redis.get(dotIdentifyKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IdentifyTrigger;
  } catch {
    return null;
  }
}
