// CW-03: a city walk's visits online. The server answers, and the answer is kept on this device.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../tests/helpers/msw/server';
import { clearAll, offlineDb } from '../db/offlineDb';
import { tourVisitRepo } from './tourVisitRepo';

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

const cachedKeys = async () =>
  (await offlineDb.tourStationVisits.toArray()).map((row) => `${row.trip_id}:${row.assignment_id}:${row.station_key}`);

beforeEach(async () => {
  await clearAll();
  setOnline(true);
});

afterEach(() => {
  vi.restoreAllMocks();
  setOnline(true);
});

describe('tourVisitRepo online', () => {
  it("FE-REPO-VISIT-001: list reads the trip's visits and keeps the whole trip on this device", async () => {
    await offlineDb.tourStationVisits.put({ assignment_id: 9, station_key: 'gone-01', status: 'visited', trip_id: 4 });
    const visits = [
      { assignment_id: 9, station_key: 'stop-01', status: 'visited' as const },
      { assignment_id: 10, station_key: 'stop-01', status: 'skipped' as const },
    ];
    server.use(http.get('/api/trips/4/tour-visits', () => HttpResponse.json({ visits })));

    await expect(tourVisitRepo.list(4)).resolves.toEqual({ visits });

    await vi.waitFor(async () => expect((await cachedKeys()).sort()).toEqual(['4:10:stop-01', '4:9:stop-01']));
  });

  it("FE-REPO-VISIT-002: a mark goes straight to the server, and the day's answer replaces only that day here", async () => {
    await offlineDb.tourStationVisits.bulkPut([
      { assignment_id: 9, station_key: 'stop-02', status: 'visited', trip_id: 4 },
      { assignment_id: 10, station_key: 'stop-01', status: 'skipped', trip_id: 4 },
    ]);
    const bodies: unknown[] = [];
    const answer = { visits: [{ assignment_id: 9, station_key: 'stop-01', status: 'visited' as const }] };
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(answer);
      })
    );

    await expect(tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' })).resolves.toEqual(answer);

    expect(bodies).toEqual([{ status: 'visited' }]);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    await vi.waitFor(async () => expect((await cachedKeys()).sort()).toEqual(['4:10:stop-01', '4:9:stop-01']));
  });

  it('FE-REPO-VISIT-003: a refused mark throws and keeps what this device had', async () => {
    await offlineDb.tourStationVisits.put({ assignment_id: 9, station_key: 'stop-01', status: 'visited', trip_id: 4 });
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', () =>
        HttpResponse.json({ error: 'Station not found' }, { status: 404 })
      )
    );

    await expect(tourVisitRepo.update(4, 9, 'stop-01', { status: 'planned' })).rejects.toMatchObject({
      response: { status: 404 },
    });
    expect(await cachedKeys()).toEqual(['4:9:stop-01']);
  });

  it('FE-REPO-VISIT-004: a lost connection reads the copy on this device', async () => {
    await offlineDb.tourStationVisits.put({ assignment_id: 9, station_key: 'stop-01', status: 'skipped', trip_id: 4 });
    server.use(http.get('/api/trips/4/tour-visits', () => HttpResponse.error()));

    await expect(tourVisitRepo.list(4)).resolves.toEqual({
      visits: [{ assignment_id: 9, station_key: 'stop-01', status: 'skipped' }],
    });
  });

  it('FE-REPO-VISIT-005: an answer from the server still shows a mark waiting in the queue', async () => {
    await offlineDb.mutationQueue.put({
      id: 'mark-1',
      tripId: 4,
      method: 'PUT',
      url: '/trips/4/tour-visits/9/stop-02',
      body: { status: 'visited' },
      createdAt: 1,
      status: 'syncing',
      attempts: 0,
      lastError: null,
      resource: 'tourStationVisits',
      entityId: 9,
    });
    server.use(
      http.get('/api/trips/4/tour-visits', () =>
        HttpResponse.json({ visits: [{ assignment_id: 9, station_key: 'stop-01', status: 'visited' }] })
      )
    );

    const { visits } = await tourVisitRepo.list('4');

    expect(visits.map((visit) => visit.station_key).sort()).toEqual(['stop-01', 'stop-02']);
  });
});
