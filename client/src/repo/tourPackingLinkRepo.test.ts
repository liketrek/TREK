// P2D-XD-01: a tour's packing link through the offline core. Online the server
// answers and the answer is kept on the cached tour; offline, for a tour not yet
// synced, or behind a queued write of the tour, the link waits in the queue.
import type { TourDetailResponse, TourListItem, TourPackingLink } from '@trek/shared';
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { clearAll, offlineDb, replaceTripTours } from '../db/offlineDb';
import { mutationQueue } from '../sync/mutationQueue';
import { tourPackingLinkRepo } from './tourPackingLinkRepo';

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

function tour(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: 40,
    name: 'Ridge walk',
    tour_type: 'hike',
    distance: 8,
    elevation_gain: 600,
    elevation_loss: 600,
    duration: 180,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: 2,
    planned: false,
    caution: false,
    has_waypoints: true,
    ...overrides,
  };
}

const gear: TourPackingLink = { category: 'Hiking gear', linked_at: '2026-10-20 09:00:00' };
const answer = (packing_link: TourPackingLink | null): TourDetailResponse => ({
  tour: tour(),
  waypoints: [],
  packing_link,
});
const cachedLink = async (placeId = 40) => (await offlineDb.tours.get(placeId))?.packing_link;

beforeEach(async () => {
  await clearAll();
  setOnline(true);
  await offlineDb.tours.put({ ...tour(), trip_id: 3 });
});

afterEach(() => {
  vi.restoreAllMocks();
  setOnline(true);
});

describe('tourPackingLinkRepo online', () => {
  it('FE-REPO-TPL-001: read asks the server and keeps the link on the cached tour, through a list refresh too', async () => {
    server.use(http.get('/api/trips/3/tours/40/packing-link', () => HttpResponse.json({ packing_link: gear })));

    await expect(tourPackingLinkRepo.read(3, 40)).resolves.toEqual(gear);
    expect(await cachedLink()).toEqual(gear);

    // The list carries no link; the one read stays.
    await replaceTripTours(3, [tour({ name: 'Ridge walk, renamed' })]);
    expect(await cachedLink()).toEqual(gear);
  });

  it('FE-REPO-TPL-002: link and unlink go straight to the server, and its answer is cached', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.put('/api/trips/3/tours/40/packing-link', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(answer(gear));
      }),
      http.delete('/api/trips/3/tours/40/packing-link', () => HttpResponse.json(answer(null)))
    );

    await expect(tourPackingLinkRepo.link(3, 40, { category: 'Hiking gear' })).resolves.toEqual(gear);
    expect(bodies).toEqual([{ category: 'Hiking gear' }]);
    expect(await cachedLink()).toEqual(gear);

    await expect(tourPackingLinkRepo.unlink(3, 40)).resolves.toBeNull();
    expect(await cachedLink()).toBeNull();
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });

  it('FE-REPO-TPL-003: a refused link throws and keeps what this device had', async () => {
    await offlineDb.tours.update(40, { packing_link: gear });
    server.use(
      http.put('/api/trips/3/tours/40/packing-link', () =>
        HttpResponse.json({ error: 'Packing category not found' }, { status: 400 })
      )
    );

    await expect(tourPackingLinkRepo.link(3, 40, { category: 'Climbing' })).rejects.toMatchObject({
      response: { status: 400 },
    });
    expect(await cachedLink()).toEqual(gear);
  });

  it('FE-REPO-TPL-004: a lost connection reads the link this device last had, and an unknown one stays unknown', async () => {
    server.use(http.get('/api/trips/3/tours/:placeId/packing-link', () => HttpResponse.error()));
    await expect(tourPackingLinkRepo.read(3, 40)).rejects.toThrow('Packing link not available offline');
    await offlineDb.tours.update(40, { packing_link: null });
    await expect(tourPackingLinkRepo.read(3, 40)).resolves.toBeNull();
    await offlineDb.tours.update(40, { packing_link: gear });
    await expect(tourPackingLinkRepo.read(3, 40)).resolves.toEqual(gear);
  });

  it('FE-REPO-TPL-005: an aborted read stays aborted instead of reading the cache', async () => {
    server.use(http.get('/api/trips/3/tours/40/packing-link', () => HttpResponse.error()));
    const controller = new AbortController();
    controller.abort();
    await expect(tourPackingLinkRepo.read(3, 40, controller.signal)).rejects.toBeDefined();
  });
});

describe('tourPackingLinkRepo offline', () => {
  it('FE-REPO-TPL-006: offline a link is on the tour at once and waits in the queue as a write of its tour', async () => {
    setOnline(false);
    const send = vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);

    const local = await tourPackingLinkRepo.link(3, 40, { category: null });
    expect(local).toEqual({ category: null, linked_at: expect.stringMatching(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/) });
    expect(await cachedLink()).toEqual(local);
    await expect(tourPackingLinkRepo.read(3, 40)).resolves.toEqual(local);

    await expect(tourPackingLinkRepo.unlink(3, 40)).resolves.toBeNull();
    const queued = await offlineDb.mutationQueue.orderBy('createdAt').toArray();
    expect(queued.map((m) => [m.method, m.url, m.body, m.resource, m.entityId])).toEqual([
      ['PUT', '/trips/3/tours/40/packing-link', { category: null }, 'tours', 40],
      ['DELETE', '/trips/3/tours/40/packing-link', undefined, 'tours', 40],
    ]);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('FE-REPO-TPL-007: a tour written here offline is linked through the queue, its id filled in when it syncs', async () => {
    await offlineDb.tours.put({ ...tour({ place_id: -5 }), trip_id: 3 });
    vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);

    await tourPackingLinkRepo.link(3, -5, { category: 'Hiking gear' });
    const [queued] = await offlineDb.mutationQueue.toArray();
    expect(queued).toMatchObject({ url: '/trips/3/tours/{id}/packing-link', entityId: -5, tempEntityId: -5 });
    await expect(tourPackingLinkRepo.read(3, -5)).resolves.toMatchObject({ category: 'Hiking gear' });
  });

  it('FE-REPO-TPL-008: online, behind an older queued write of the tour, the link queues and reads as queued', async () => {
    vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);
    vi.spyOn(mutationQueue, 'mustQueue').mockResolvedValue(true);
    const put = vi.fn();
    server.use(http.put('/api/trips/3/tours/40/packing-link', put));

    await tourPackingLinkRepo.link(3, 40, { category: 'Hiking gear' });
    expect(put).not.toHaveBeenCalled();
    expect(await offlineDb.mutationQueue.count()).toBe(1);
    await expect(tourPackingLinkRepo.read(3, 40)).resolves.toMatchObject({ category: 'Hiking gear' });
  });
});
