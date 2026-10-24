import type { TourCreateResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tourLibraryApi } from '../api/tourLibrary';
import { OnlineOnlyError } from './onlineOnly';
import { tourLibraryRepo } from './tourLibraryRepo';

// FE-REPO-TOUR-LIBRARY-001 to FE-REPO-TOUR-LIBRARY-002

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: () => network.offline }));
const cache = vi.hoisted(() => ({ cacheTourAnswer: vi.fn() }));
vi.mock('../db/cacheTour', () => cache);

beforeEach(() => {
  network.offline = false;
  cache.cacheTourAnswer.mockReset();
  vi.restoreAllMocks();
});

describe('tourLibraryRepo', () => {
  it('FE-REPO-TOUR-LIBRARY-001: reads and takes over only online, never from a cache', async () => {
    network.offline = true;
    const list = vi.spyOn(tourLibraryApi, 'list');
    await expect(tourLibraryRepo.list({})).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(tourLibraryRepo.detail(3)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(tourLibraryRepo.takeOver(5, { source_trip_id: 2, source_place_id: 3 })).rejects.toBeInstanceOf(
      OnlineOnlyError
    );
    expect(list).not.toHaveBeenCalled();
  });

  it('FE-REPO-TOUR-LIBRARY-002: a tour taken over goes into this trip’s cache', async () => {
    const answer = { tour: { place_id: 9 }, waypoints: [] } as unknown as TourCreateResponse;
    vi.spyOn(tourLibraryApi, 'takeOver').mockResolvedValue(answer);
    vi.spyOn(tourLibraryApi, 'detail').mockResolvedValue({ tour: {} as never, line: [], waypoint_count: 0 });
    expect(await tourLibraryRepo.takeOver('5', { source_trip_id: 2, source_place_id: 3 })).toBe(answer);
    expect(cache.cacheTourAnswer).toHaveBeenCalledWith(5, answer);
    expect((await tourLibraryRepo.detail(3)).waypoint_count).toBe(0);
  });
});
