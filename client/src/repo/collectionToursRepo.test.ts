import type { Collection, TourCreateResponse } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectionsApi } from '../api/collections';
import { collectionToursApi } from '../api/collectionTours';
import { collectionToursRepo } from './collectionToursRepo';
import { OnlineOnlyError } from './onlineOnly';

// FE-REPO-COLLECTION-TOURS-001 to FE-REPO-COLLECTION-TOURS-003

const network = vi.hoisted(() => ({ offline: false }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: () => network.offline }));
const cache = vi.hoisted(() => ({ cacheTourAnswer: vi.fn() }));
vi.mock('../db/cacheTour', () => cache);

beforeEach(() => {
  network.offline = false;
  cache.cacheTourAnswer.mockReset();
  vi.restoreAllMocks();
});

describe('collectionToursRepo', () => {
  it('FE-REPO-COLLECTION-TOURS-001: reads and writes only online, never from a cache', async () => {
    network.offline = true;
    const list = vi.spyOn(collectionToursApi, 'list');
    await expect(collectionToursRepo.lists()).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(collectionToursRepo.list(3)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(collectionToursRepo.detail(3, 4)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(collectionToursRepo.save(3, { source_trip_id: 2, source_place_id: 7 })).rejects.toBeInstanceOf(
      OnlineOnlyError
    );
    await expect(collectionToursRepo.remove(3, 4)).rejects.toBeInstanceOf(OnlineOnlyError);
    await expect(
      collectionToursRepo.takeOver(6, { collection_id: 3, collection_tour_id: 4, include_waypoints: true })
    ).rejects.toBeInstanceOf(OnlineOnlyError);
    expect(list).not.toHaveBeenCalled();
  });

  it('FE-REPO-COLLECTION-TOURS-002: passes every call on and answers the user’s lists', async () => {
    const lists = [{ id: 3, owner_id: 1, name: 'Hikes' }] as Collection[];
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ collections: lists, incomingInvites: [] });
    vi.spyOn(collectionToursApi, 'list').mockResolvedValue({ tours: [] });
    vi.spyOn(collectionToursApi, 'detail').mockResolvedValue({ tour: {} as never, line: [], points: [], trips: [] });
    const save = vi.spyOn(collectionToursApi, 'save').mockResolvedValue({ tour: { id: 5 } as never });
    const remove = vi.spyOn(collectionToursApi, 'remove').mockResolvedValue(undefined);
    expect(await collectionToursRepo.lists()).toBe(lists);
    expect(await collectionToursRepo.list(3)).toEqual({ tours: [] });
    expect((await collectionToursRepo.detail(3, 4)).points).toEqual([]);
    await collectionToursRepo.save(3, { source_trip_id: 2, source_place_id: 7 });
    await collectionToursRepo.remove(3, 4);
    expect(save).toHaveBeenCalledWith(3, { source_trip_id: 2, source_place_id: 7 });
    expect(remove).toHaveBeenCalledWith(3, 4);
  });

  it('FE-REPO-COLLECTION-TOURS-003: a tour taken into a trip goes into that trip’s cache', async () => {
    const answer = { tour: { place_id: 9 }, waypoints: [] } as unknown as TourCreateResponse;
    vi.spyOn(collectionToursApi, 'takeOver').mockResolvedValue(answer);
    const body = { collection_id: 3, collection_tour_id: 4, include_waypoints: false };
    expect(await collectionToursRepo.takeOver(6, body)).toBe(answer);
    expect(cache.cacheTourAnswer).toHaveBeenCalledWith(6, answer);
  });
});
