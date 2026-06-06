/**
 * Redis access for the timer demo.
 *
 * Two kinds of clients:
 *   - `getRedis()` — a shared, lazily-created connection for ordinary
 *     commands (GET/SET/PUBLISH). Cached on `globalThis` so Next.js dev HMR
 *     doesn't leak a new connection on every reload.
 *   - `createSubscriber()` — a *dedicated* connection per subscriber. A Redis
 *     connection in subscribe mode can't issue normal commands, and each SSE
 *     client needs its own so unsubscribing one doesn't starve the others.
 */

import Redis from 'ioredis';

export const TIMER_KEY = 'syncframe:timer:global';
export const TIMER_CHANNEL = 'syncframe:timer:updates';

function redisUrl(): string {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');
  return url;
}

const globalForRedis = globalThis as typeof globalThis & { __syncframeRedis?: Redis };

/** Shared connection for commands and publishing. */
export function getRedis(): Redis {
  return (globalForRedis.__syncframeRedis ??= new Redis(redisUrl()));
}

/** Fresh connection for a single pub/sub subscriber. Caller must `.quit()`. */
export function createSubscriber(): Redis {
  return new Redis(redisUrl());
}
