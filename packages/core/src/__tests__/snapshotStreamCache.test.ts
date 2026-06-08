import { describe, expect, it } from 'vitest';
import { snapshotStreamCacheKey } from '../snapshotStreamCache';

describe('snapshotStreamCacheKey', () => {
  it('uses the stream endpoint as the cache key', () => {
    expect(snapshotStreamCacheKey('/api/dot/stream')).toBe('/api/dot/stream');
  });
});
