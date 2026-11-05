import { afterEach, describe, expect, it, vi } from 'vitest';

import { offlineDb } from '../db/offlineDb';
import { routeCacheRepo } from './routeCacheRepo';

afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  await offlineDb.routeCache.clear();
});

const ROUTE = { coordinates: [[48.1, 11.5]], distance: 4200, duration: 600, legs: [] };

describe('road routes kept on the device', () => {
  it('FE-ROUTE-CACHE-001: a kept route comes back as it went in, a missing one as null', async () => {
    await routeCacheRepo.put('driving:km:11.5,48.1;11.6,48.2', ROUTE);
    await expect(routeCacheRepo.get('driving:km:11.5,48.1;11.6,48.2')).resolves.toEqual(ROUTE);
    await expect(routeCacheRepo.get('walking:km:11.5,48.1;11.6,48.2')).resolves.toBeNull();
  });

  it('FE-ROUTE-CACHE-002: a route older than a month is asked again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-01T00:00:00Z'));
    await routeCacheRepo.put('driving:km:old', ROUTE);
    vi.setSystemTime(new Date('2026-10-25T00:00:00Z'));
    await expect(routeCacheRepo.get('driving:km:old')).resolves.toBeNull();
  });

  it('FE-ROUTE-CACHE-003: a database that fails is a miss on read and nothing on write', async () => {
    vi.spyOn(offlineDb.routeCache, 'get').mockRejectedValueOnce(new Error('closed'));
    await expect(routeCacheRepo.get('driving:km:any')).resolves.toBeNull();
    vi.spyOn(offlineDb.routeCache, 'put').mockRejectedValueOnce(new Error('quota'));
    await expect(routeCacheRepo.put('driving:km:any', ROUTE)).resolves.toBeUndefined();
  });
});
