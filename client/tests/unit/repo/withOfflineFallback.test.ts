/**
 * onlineThenCache — the read-through fallback shared by every repo (H2).
 *
 * Branches:
 *   - navigator offline → cache only (skip the request)
 *   - online but the request fails at the network level → fall back to cache
 *   - online but the server returns an HTTP error → rethrow (don't mask)
 *   - online and the request succeeds → return it, skip cache
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onlineThenCache } from '../../../src/repo/withOfflineFallback';

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('onlineThenCache', () => {
  it('returns the online result when online', async () => {
    const online = vi.fn().mockResolvedValue('online');
    const cache = vi.fn().mockResolvedValue('cache');

    expect(await onlineThenCache(online, cache)).toBe('online');
    expect(online).toHaveBeenCalledOnce();
    expect(cache).not.toHaveBeenCalled();
  });

  it('reads the cache without calling online when navigator is offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    const online = vi.fn().mockResolvedValue('online');
    const cache = vi.fn().mockResolvedValue('cache');

    expect(await onlineThenCache(online, cache)).toBe('cache');
    expect(online).not.toHaveBeenCalled();
  });

  it('falls back to the cache on a network-level failure (no HTTP response)', async () => {
    // Axios network error: the request never reached the server (captive portal).
    const netErr = Object.assign(new Error('Network Error'), { isAxiosError: true, response: undefined });
    const online = vi.fn().mockRejectedValue(netErr);
    const cache = vi.fn().mockResolvedValue('cache');

    expect(await onlineThenCache(online, cache)).toBe('cache');
    expect(online).toHaveBeenCalledOnce();
    expect(cache).toHaveBeenCalledOnce();
  });

  it('rethrows a genuine HTTP error (server responded) instead of masking it', async () => {
    // 404/403/500 mean the server replied — callers must see it, not a stale cache.
    const httpErr = Object.assign(new Error('Not Found'), { isAxiosError: true, response: { status: 404 } });
    const online = vi.fn().mockRejectedValue(httpErr);
    const cache = vi.fn().mockResolvedValue('cache');

    await expect(onlineThenCache(online, cache)).rejects.toThrow('Not Found');
    expect(cache).not.toHaveBeenCalled();
  });

  it('rethrows a non-Axios error rather than swallowing it', async () => {
    const online = vi.fn().mockRejectedValue(new Error('bug'));
    const cache = vi.fn().mockResolvedValue('cache');

    await expect(onlineThenCache(online, cache)).rejects.toThrow('bug');
    expect(cache).not.toHaveBeenCalled();
  });

  it('propagates a cache error (e.g. nothing cached) when online also failed', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    const online = vi.fn().mockResolvedValue('online');
    const cache = vi.fn().mockRejectedValue(new Error('No cached data'));

    await expect(onlineThenCache(online, cache)).rejects.toThrow('No cached data');
  });
});
