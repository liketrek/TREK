/**
 * mutationQueue replay of a paddle tour's decisions made offline (PAD-06):
 * the server's checklist replaces the local one and provenance stays, a
 * checklist this build cannot read never stalls the queue, a refused body is
 * parked as failed and an obstacle data outage waits for a retry.
 */
import type { TourListItem, TourProvenance } from '@trek/shared';
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAll, offlineDb } from '../../../src/db/offlineDb';
import { tourRepo } from '../../../src/repo/tourRepo';
import { setAuthed } from '../../../src/sync/authGate';
import { mutationQueue } from '../../../src/sync/mutationQueue';
import { server } from '../../helpers/msw/server';
import { obstacleCheck, obstacleEntry, paddleBench, ROUTE_BASIS, SOURCE_BASIS } from '../../helpers/paddleCheck';

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
    paddle_check: paddleBench(),
    ...overrides,
  };
}

const waypoints = [
  { lat: 49.2, lng: 12, role: 'start' as const, sequence: 0 },
  { lat: 49.2, lng: 12.01, role: 'end' as const, sequence: 1 },
];
const provenance: TourProvenance = {
  origin: 'trek',
  createdAt: null,
  source: { kind: 'trek' },
  derivedFrom: null,
  plannedOver: false,
  editedLocally: null,
};
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
  mutationQueue._resetFlushing();
  setAuthed(true);
  setOnline(false);
  await offlineDb.tours.put({ ...paddleTour(), trip_id: 3, waypoints, provenance, obstacle_check: obstacleCheck() });
  vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);
  await tourRepo.saveObstacleReviews(3, 40, decide, 4);
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('mutationQueue.flush: obstacle decisions', () => {
  it('FE-SYNC-TOUR-010: a replayed decision caches the checklist the server answered and keeps provenance', async () => {
    const answered = obstacleCheck({ revision: 'rev-2', entries: [obstacleEntry({ status: 'decided' })] });
    let key: string | null = null;
    server.use(
      http.put('/api/trips/3/tours/40/obstacle-reviews', ({ request }) => {
        key = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json({
          tour: paddleTour({ paddle_check: paddleBench({ revision: 'rev-2' }) }),
          waypoints,
          obstacle_check: answered,
        });
      })
    );
    const [queued] = await offlineDb.mutationQueue.toArray();
    setOnline(true);

    await mutationQueue.flush();

    expect(key).toBe(queued?.id);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await offlineDb.tours.get(40)).toMatchObject({
      obstacle_check: answered,
      provenance,
      paddle_check: { revision: 'rev-2' },
    });
  });

  it('FE-SYNC-TOUR-011: a checklist the answer carries that this build cannot read does not stall the queue', async () => {
    server.use(
      http.put('/api/trips/3/tours/40/obstacle-reviews', () =>
        HttpResponse.json({ tour: paddleTour(), waypoints, obstacle_check: { entries: 'not a list' } })
      )
    );
    const local = (await offlineDb.tours.get(40))?.obstacle_check;
    setOnline(true);

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect((await offlineDb.tours.get(40))?.obstacle_check).toEqual(local);
  });

  it('FE-SYNC-TOUR-012: a refused body is parked as failed, an obstacle data outage waits for a retry', async () => {
    server.use(
      http.put('/api/trips/3/tours/40/obstacle-reviews', () =>
        HttpResponse.json({ error: 'Obstacle data unavailable' }, { status: 503 })
      )
    );
    setOnline(true);
    await mutationQueue.flush();
    expect((await offlineDb.mutationQueue.toArray())[0]).toMatchObject({ status: 'pending' });

    mutationQueue._resetFlushing();
    await offlineDb.mutationQueue.toCollection().modify({ retryAfter: undefined });
    server.use(
      http.put('/api/trips/3/tours/40/obstacle-reviews', () =>
        HttpResponse.json({ error: 'Only a paddle tour has an obstacle checklist' }, { status: 400 })
      )
    );
    await mutationQueue.flush();
    expect((await offlineDb.mutationQueue.toArray())[0]).toMatchObject({ status: 'failed' });
  });
});
