import { describe, expect, it } from 'vitest';
import { snapshotStreamCacheKey } from '../snapshotStreamCache';

describe('snapshotStreamCacheKey', () => {
  it('uses the stream endpoint as the cache key', () => {
    expect(snapshotStreamCacheKey('/api/spatial/stream')).toBe('/api/spatial/stream');
  });
});
