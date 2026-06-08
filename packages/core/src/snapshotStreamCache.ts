/**
 * Module-scoped EventSource cache — one connection per stream endpoint.
 *
 * Multiple hooks (useAnchor, useSpatialSnapshot, etc.) share a single SSE
 * connection and receive the latest snapshot synchronously on subscribe.
 */

import type { CoreSnapshot } from './types';

export type SnapshotSubscriber = (snapshot: CoreSnapshot) => void;
export type ConnectionSubscriber = (connected: boolean) => void;

interface CacheEntry {
  es: EventSource;
  snapshotSubscribers: Set<SnapshotSubscriber>;
  connectionSubscribers: Set<ConnectionSubscriber>;
  last: CoreSnapshot | null;
  connected: boolean;
}

const cache = new Map<string, CacheEntry>();

export function snapshotStreamCacheKey(streamEndpoint: string): string {
  return streamEndpoint;
}

function parseSnapshot(data: string): CoreSnapshot | null {
  try {
    return JSON.parse(data) as CoreSnapshot;
  } catch {
    return null;
  }
}

function notifySnapshot(entry: CacheEntry, snapshot: CoreSnapshot): void {
  entry.last = snapshot;
  for (const fn of entry.snapshotSubscribers) fn(snapshot);
}

function notifyConnected(entry: CacheEntry, connected: boolean): void {
  entry.connected = connected;
  for (const fn of entry.connectionSubscribers) fn(connected);
}

function getOrCreate(streamEndpoint: string): CacheEntry {
  const key = snapshotStreamCacheKey(streamEndpoint);
  const existing = cache.get(key);
  if (existing) return existing;

  const es = new EventSource(streamEndpoint);
  const entry: CacheEntry = {
    es,
    snapshotSubscribers: new Set(),
    connectionSubscribers: new Set(),
    last: null,
    connected: false,
  };

  es.onopen = () => notifyConnected(entry, true);
  es.onerror = () => notifyConnected(entry, false);
  es.onmessage = (event) => {
    const snapshot = parseSnapshot(event.data);
    if (snapshot) notifySnapshot(entry, snapshot);
  };

  cache.set(key, entry);
  return entry;
}

function maybeClose(key: string): void {
  const entry = cache.get(key);
  if (!entry) return;
  if (entry.snapshotSubscribers.size === 0 && entry.connectionSubscribers.size === 0) {
    entry.es.close();
    cache.delete(key);
  }
}

export function subscribeSnapshotStream(
  streamEndpoint: string,
  onSnapshot: SnapshotSubscriber,
  onConnected?: ConnectionSubscriber,
): () => void {
  const key = snapshotStreamCacheKey(streamEndpoint);
  const entry = getOrCreate(streamEndpoint);

  entry.snapshotSubscribers.add(onSnapshot);
  if (onConnected) {
    entry.connectionSubscribers.add(onConnected);
    onConnected(entry.connected);
  }
  if (entry.last) onSnapshot(entry.last);

  return () => {
    entry.snapshotSubscribers.delete(onSnapshot);
    if (onConnected) entry.connectionSubscribers.delete(onConnected);
    maybeClose(key);
  };
}
