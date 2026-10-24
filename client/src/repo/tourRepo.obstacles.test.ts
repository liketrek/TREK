// FE-REPO-TOUR-030 to FE-REPO-TOUR-041
// A paddle tour's checklist through the offline core (PAD-06, PAD-09): read
// from the cache while its revision matches the bench, decisions saved online
// and cached, saved offline under a local revision and queued, and a route
// written offline marking the checklist stale.
import type { TourListItem } from '@trek/shared';
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../tests/helpers/msw/server';
import { obstacleCheck, obstacleEntry, paddleBench, ROUTE_BASIS, SOURCE_BASIS } from '../../tests/helpers/paddleCheck';
import { clearAll, offlineDb, replaceTripTours } from '../db/offlineDb';
import { mutationQueue } from '../sync/mutationQueue';
import { tourRepo } from './tourRepo';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

function paddleTour(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: 40,
    name: 'Regen',
    tour_type: 'kayak',
    distance: 8,
    elevation_gain: null,
    elevation_loss: null,
    duration: 120,
    difficulty: null,
    wanderer_ref: null,
    match_confidence: 1,
    max_hiking_difficulty: null,
    planned: false,
    caution: false,
    has_waypoints: true,
    boat_type: 'kayak',
    paddle_check: paddleBench(),
    ...overrides,
  };
}

const waypoints = [
  { lat: 49.2, lng: 12, role: 'start' as const, sequence: 0 },
  { lat: 49.2, lng: 12.01, role: 'end' as const, sequence: 1 },
];
const decide = {
  ops: [
    {
      key: 'node/1',
      op: 'decide' as const,
      decision: 'pass' as const,
      note: null,
      basis: { route: ROUTE_BASIS, source: SOURCE_BASIS },
    },
  ],
};

beforeEach(async () => {
  await clearAll();
  setOnline(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  setOnline(true);
});

describe('tourRepo.obstacleCheck', () => {
  it('FE-REPO-TOUR-030: the cached checklist serves while its revision matches the bench, without a request', async () => {
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, waypoints, obstacle_check: obstacleCheck() });
    let asked = 0;
    server.use(
      http.get('/api/trips/3/tours/40', () => {
        asked++;
        return HttpResponse.json({});
      })
    );
    expect(await tourRepo.obstacleCheck(3, 40, 'rev-1')).toEqual({ check: obstacleCheck(), stale: false });
    expect(asked).toBe(0);
  });

  it('FE-REPO-TOUR-031: another revision reads the detail and caches its checklist', async () => {
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, obstacle_check: obstacleCheck() });
    const fresh = obstacleCheck({ revision: 'rev-2' });
    server.use(
      http.get('/api/trips/3/tours/40', () =>
        HttpResponse.json({
          tour: paddleTour({ paddle_check: paddleBench({ revision: 'rev-2' }) }),
          waypoints,
          obstacle_check: fresh,
        })
      )
    );
    expect(await tourRepo.obstacleCheck(3, 40, 'rev-2')).toMatchObject({ check: fresh, stale: false });
    expect((await offlineDb.tours.get(40))?.obstacle_check).toEqual(fresh);
  });

  it('FE-REPO-TOUR-032: offline, an older cached checklist stands in and reads as stale', async () => {
    setOnline(false);
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, waypoints, obstacle_check: obstacleCheck() });
    expect(await tourRepo.obstacleCheck(3, 40, 'local:abc')).toMatchObject({ check: obstacleCheck(), stale: true });
  });
});

describe('tourRepo.saveObstacleReviews', () => {
  it('FE-REPO-TOUR-033: online, the answer is cached with its checklist', async () => {
    const decided = obstacleCheck({ revision: 'rev-2', entries: [obstacleEntry({ status: 'decided' })] });
    let body: unknown;
    server.use(
      http.put('/api/trips/3/tours/40/obstacle-reviews', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ tour: paddleTour(), waypoints, obstacle_check: decided });
      })
    );
    const result = await tourRepo.saveObstacleReviews(3, 40, decide, 4);
    expect(body).toEqual(decide);
    expect(result.obstacle_check).toEqual(decided);
    expect((await offlineDb.tours.get(40))?.obstacle_check).toEqual(decided);
  });

  it('FE-REPO-TOUR-034: offline, the cached checklist and bench take the decision under a local revision, and a PUT is queued', async () => {
    setOnline(false);
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, waypoints, obstacle_check: obstacleCheck() });
    const send = vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);

    const result = await tourRepo.saveObstacleReviews(3, 40, decide, 4);

    const [mutation] = await offlineDb.mutationQueue.toArray();
    expect(mutation).toMatchObject({
      method: 'PUT',
      url: '/trips/3/tours/40/obstacle-reviews',
      body: decide,
      resource: 'tours',
      entityId: 40,
    });
    const revision = `local:${mutation?.id}`;
    expect(result.obstacle_check?.revision).toBe(revision);
    expect(result.obstacle_check?.entries[0]).toMatchObject({ status: 'decided', decision: { decided_by: 4 } });
    expect(result.tour.paddle_check).toMatchObject({ open: 0, decided: 1, revision, data: 'covered' });
    expect(result.tour).not.toHaveProperty('obstacle_check');
    expect((await offlineDb.tours.get(40))?.paddle_check?.revision).toBe(revision);
    expect(send).toHaveBeenCalled();
  });

  it('FE-REPO-TOUR-035: a tour not saved yet, or one without a cached checklist offline, refuses', async () => {
    await expect(tourRepo.saveObstacleReviews(3, -2, decide, 4)).rejects.toThrow('Save the tour');
    setOnline(false);
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3 });
    await expect(tourRepo.saveObstacleReviews(3, 40, decide, 4)).rejects.toThrow('not available offline');
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });

  it('FE-REPO-TOUR-036: online, a decision waits behind an older queued write of the tour', async () => {
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, waypoints, obstacle_check: obstacleCheck() });
    await offlineDb.mutationQueue.put({
      id: 'parked-tour',
      tripId: 3,
      method: 'PUT',
      url: '/trips/3/tours/40/paddle-plan',
      body: {},
      createdAt: 1,
      status: 'failed',
      attempts: 8,
      lastError: 'boom',
      resource: 'tours',
      entityId: 40,
    });
    vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);
    let sent = 0;
    server.use(
      http.put('/api/trips/3/tours/40/obstacle-reviews', () => {
        sent++;
        return HttpResponse.json({});
      })
    );
    await tourRepo.saveObstacleReviews(3, 40, decide, 4);
    expect(sent).toBe(0);
    expect((await offlineDb.mutationQueue.toArray()).map((m) => m.status).sort()).toEqual(['failed', 'pending']);
  });
});

describe('a route written offline and the list cache', () => {
  it('FE-REPO-TOUR-037: an offline paddle plan marks the bench stale, so the checklist no longer matches it', async () => {
    setOnline(false);
    await offlineDb.tours.put({ ...paddleTour({ has_waypoints: false }), trip_id: 3, obstacle_check: obstacleCheck() });
    vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);
    const result = await tourRepo.updatePaddlePlan(3, 40, {
      paddle_speed_kmh: null,
      portage_speed_kmh: null,
      track_marks: { portages: [], locks: [] },
    });
    const [mutation] = await offlineDb.mutationQueue.toArray();
    expect(result.tour.paddle_check?.revision).toBe(`local:${mutation?.id}`);
    expect((await tourRepo.obstacleCheck(3, 40, result.tour.paddle_check?.revision ?? null)).stale).toBe(true);
  });

  it('FE-REPO-TOUR-038: a list refresh keeps the cached checklist, and the list items never carry it', async () => {
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, obstacle_check: obstacleCheck() });
    await replaceTripTours(3, [paddleTour({ name: 'Regen renamed' })]);
    expect((await offlineDb.tours.get(40))?.obstacle_check).toEqual(obstacleCheck());
    setOnline(false);
    const { tours } = await tourRepo.list(3);
    expect(tours[0]).not.toHaveProperty('obstacle_check');
  });
});

describe('after review', () => {
  it('FE-REPO-TOUR-039: a decision queued on a checklist already stale keeps it stale against the bench', async () => {
    setOnline(false);
    vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);
    await offlineDb.tours.put({
      ...paddleTour({ paddle_check: paddleBench({ revision: 'local:route' }) }),
      trip_id: 3,
      waypoints,
      obstacle_check: obstacleCheck(),
    });
    const result = await tourRepo.saveObstacleReviews(3, 40, decide, 4);
    expect(result.tour.paddle_check?.revision).toBe('local:route');
    expect(result.obstacle_check?.revision).not.toBe('local:route');
    expect((await tourRepo.obstacleCheck(3, 40, 'local:route')).stale).toBe(true);
  });

  it('FE-REPO-TOUR-040: online, a bench of a write made offline waits for the queue, then reads the server and hands its tour on', async () => {
    await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, waypoints, obstacle_check: obstacleCheck() });
    const flush = vi.spyOn(mutationQueue, 'flush').mockResolvedValue();
    const server_ = paddleTour({ paddle_check: paddleBench({ revision: 'rev-5' }) });
    server.use(
      http.get('/api/trips/3/tours/40', () =>
        HttpResponse.json({ tour: server_, waypoints, obstacle_check: obstacleCheck({ revision: 'rev-5' }) })
      )
    );
    const read = await tourRepo.obstacleCheck(3, 40, 'local:abc');
    expect(flush).toHaveBeenCalled();
    expect(read).toMatchObject({ check: { revision: 'rev-5' }, tour: { paddle_check: { revision: 'rev-5' } } });
  });

  it('FE-REPO-TOUR-041: online, a checklist changed here and still queued waits for the queue before it is read', async () => {
    await offlineDb.tours.put({
      ...paddleTour({ paddle_check: paddleBench({ revision: 'rev-2' }) }),
      trip_id: 3,
      waypoints,
      obstacle_check: obstacleCheck({ revision: 'local:x' }),
    });
    const order: string[] = [];
    vi.spyOn(mutationQueue, 'flush').mockImplementation(async () => {
      order.push('flush');
    });
    server.use(
      http.get('/api/trips/3/tours/40', () => {
        order.push('get');
        return HttpResponse.json({
          tour: paddleTour({ paddle_check: paddleBench({ revision: 'rev-3' }) }),
          waypoints,
          obstacle_check: obstacleCheck({ revision: 'rev-3' }),
        });
      })
    );
    await tourRepo.obstacleCheck(3, 40, 'rev-2');
    expect(order).toEqual(['flush', 'get']);
  });
});
