import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetCacheStorage, cacheStorageUnusable, openCacheStorage } from './openCacheStorage';

beforeEach(() => _resetCacheStorage());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('openCacheStorage', () => {
  it('FE-SYNC-CACHEOPEN-001: hands back the bucket, and null where Cache Storage is missing or throws', async () => {
    const bucket = {} as Cache;
    vi.stubGlobal('caches', { open: vi.fn(async () => bucket) });
    expect(await openCacheStorage('tiles')).toBe(bucket);

    vi.stubGlobal('caches', { open: vi.fn(async () => Promise.reject(new DOMException('denied', 'SecurityError'))) });
    expect(await openCacheStorage('tiles')).toBeNull();
    expect(cacheStorageUnusable()).toBe(false);

    vi.stubGlobal('caches', undefined);
    expect(await openCacheStorage('tiles')).toBeNull();
  });

  it('FE-SYNC-CACHEOPEN-002: an open that never settles is given up on after a few seconds, and not tried again', async () => {
    vi.useFakeTimers();
    const open = vi.fn(() => new Promise<Cache>(() => undefined));
    vi.stubGlobal('caches', { open });

    const pending = openCacheStorage('gl-map-offline');
    await vi.advanceTimersByTimeAsync(4000);
    expect(await pending).toBeNull();
    expect(cacheStorageUnusable()).toBe(true);

    expect(await openCacheStorage('gl-map-offline')).toBeNull();
    expect(open).toHaveBeenCalledTimes(1);
  });
});
