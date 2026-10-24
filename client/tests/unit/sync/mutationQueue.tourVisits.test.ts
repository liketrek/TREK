/**
 * mutationQueue replay of a city walk's marks made offline (CW-03): each goes
 * out with its idempotency key in the order it was made, the day's answer is
 * kept on this device, a 409 fails instead of waiting as a conflict, a 404 for
 * a stop, day, walk or trip that is gone counts as done so the later marks of
 * that day still go out while any other 404 fails, and an answer that does not
 * read as visits holds nothing up.
 */
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tourVisitPath } from '../../../src/api/tourVisits';
import { clearAll, offlineDb } from '../../../src/db/offlineDb';
import { tourVisitRepo } from '../../../src/repo/tourVisitRepo';
import { useAddonStore } from '../../../src/store/addonStore';
import { reloadTourVisits, useTourVisitStore } from '../../../src/store/tourVisitStore';
import { setAuthed } from '../../../src/sync/authGate';
import { mutationQueue } from '../../../src/sync/mutationQueue';
import { server } from '../../helpers/msw/server';

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

const cached = async () =>
  (await offlineDb.tourStationVisits.toArray())
    .map((row) => `${row.assignment_id}:${row.station_key}:${row.status}`)
    .sort();

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setAuthed(true);
  setOnline(false);
  await offlineDb.tourStationVisits.bulkPut([
    { assignment_id: 9, station_key: 'stop-02', status: 'skipped', trip_id: 4 },
    { assignment_id: 10, station_key: 'stop-01', status: 'visited', trip_id: 4 },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
  useAddonStore.setState({ addons: [] });
  useTourVisitStore.setState({ tripId: null, byAssignment: {} });
});

describe('mutationQueue.flush, city walk marks', () => {
  it('FE-SYNC-VISITS-001: a mark replays with its key and the day it answers is kept here', async () => {
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });
    const [queued] = await offlineDb.mutationQueue.toArray();
    const keys: Array<string | null> = [];
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', ({ request }) => {
        keys.push(request.headers.get('X-Idempotency-Key'));
        return HttpResponse.json({
          visits: [
            { assignment_id: 9, station_key: 'stop-01', status: 'visited' },
            { assignment_id: 9, station_key: 'stop-02', status: 'skipped' },
          ],
        });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(keys).toEqual([queued.id]);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await cached()).toEqual(['10:stop-01:visited', '9:stop-01:visited', '9:stop-02:skipped']);
    expect(await offlineDb.tourStationVisits.get([9, 'stop-01'])).toMatchObject({ trip_id: 4 });
  });

  it('FE-SYNC-VISITS-002: a mark and its take back of the same stop go out in the order they were made', async () => {
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'planned' });
    const sent: unknown[] = [];
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', async ({ request }) => {
        const body = (await request.json()) as { status: string };
        sent.push(body.status);
        const visits =
          body.status === 'visited' ? [{ assignment_id: 9, station_key: 'stop-01', status: 'visited' }] : [];
        return HttpResponse.json({ visits });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(sent).toEqual(['visited', 'planned']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await cached()).toEqual(['10:stop-01:visited']);
  });

  it('FE-SYNC-VISITS-003: a mark refused with 409 fails, it does not wait as a conflict', async () => {
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', () => HttpResponse.json({ error: 'Conflict' }, { status: 409 }))
    );
    setOnline(true);

    await mutationQueue.flush();

    const [row] = await offlineDb.mutationQueue.toArray();
    expect(row.status).toBe('failed');
    expect(await mutationQueue.conflictCount()).toBe(0);
  });

  it('FE-SYNC-VISITS-004: a mark of a stop that is gone counts as done, and the next mark of the day still goes out', async () => {
    await tourVisitRepo.update(4, 9, 'gone-01', { status: 'visited' });
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'skipped' });
    const sent: string[] = [];
    server.use(
      http.put('/api/trips/4/tour-visits/9/gone-01', () => {
        sent.push('gone-01');
        return HttpResponse.json({ error: 'Station not found' }, { status: 404 });
      }),
      http.put('/api/trips/4/tour-visits/9/stop-01', () => {
        sent.push('stop-01');
        return HttpResponse.json({ visits: [{ assignment_id: 9, station_key: 'stop-01', status: 'skipped' }] });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(sent).toEqual(['gone-01', 'stop-01']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await mutationQueue.failedCount()).toBe(0);
    expect(await cached()).toEqual(['10:stop-01:visited', '9:stop-01:skipped']);
  });

  it.each(['Trip not found', 'Assignment not found', 'City walk not found'])(
    'FE-SYNC-VISITS-004: a mark answered 404 "%s" counts as done too',
    async (reason) => {
      await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });
      server.use(
        http.put('/api/trips/4/tour-visits/9/stop-01', () => HttpResponse.json({ error: reason }, { status: 404 }))
      );
      setOnline(true);

      await mutationQueue.flush();

      expect(await offlineDb.mutationQueue.count()).toBe(0);
    }
  );

  it('FE-SYNC-VISITS-006: a 404 that names no part of the walk as gone fails and is kept, the Tours addon turned off among them', async () => {
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });
    await tourVisitRepo.update(4, 10, 'stop-01', { status: 'skipped' });
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', () =>
        HttpResponse.json({ error: 'Tours addon is not enabled' }, { status: 404 })
      ),
      http.put('/api/trips/4/tour-visits/10/stop-01', () => new HttpResponse('Not Found', { status: 404 }))
    );
    setOnline(true);

    await mutationQueue.flush();

    const rows = await offlineDb.mutationQueue.where('tripId').equals(4).sortBy('createdAt');
    expect(rows.map((row) => [row.entityId, row.status])).toEqual([
      [9, 'failed'],
      [10, 'failed'],
    ]);
    expect(await cached()).toEqual(['10:stop-01:visited', '9:stop-02:skipped']);
  });

  it('FE-SYNC-VISITS-007: a mark the replay dropped leaves the day plan once the visits are read again', async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', name: 'Tours', type: 'trip', icon: 'map', enabled: true }] });
    await useTourVisitStore.getState().load(4);
    await useTourVisitStore.getState().mark(4, 9, 'gone-01', 'visited');
    expect(useTourVisitStore.getState().byAssignment[9]).toEqual({ 'stop-02': 'skipped', 'gone-01': 'visited' });
    server.use(
      http.put('/api/trips/4/tour-visits/9/gone-01', () =>
        HttpResponse.json({ error: 'Station not found' }, { status: 404 })
      ),
      http.get('/api/trips/4/tour-visits', () =>
        HttpResponse.json({ visits: [{ assignment_id: 9, station_key: 'stop-02', status: 'skipped' }] })
      )
    );
    setOnline(true);

    await mutationQueue.flush();
    expect(useTourVisitStore.getState().byAssignment[9]).toHaveProperty('gone-01');
    reloadTourVisits(4);

    await vi.waitFor(() => expect(useTourVisitStore.getState().byAssignment).toEqual({ 9: { 'stop-02': 'skipped' } }));
  });

  it('FE-SYNC-VISITS-008: a queued mark that names no day replays and leaves the kept visits alone', async () => {
    await mutationQueue.enqueue({
      id: 'mark-without-day',
      tripId: 4,
      method: 'PUT',
      url: tourVisitPath(4, 9, 'stop-01'),
      body: { status: 'visited' },
      resource: 'tourStationVisits',
    });
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', () =>
        HttpResponse.json({ visits: [{ assignment_id: 9, station_key: 'stop-01', status: 'visited' }] })
      )
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await cached()).toEqual(['10:stop-01:visited', '9:stop-02:skipped']);
  });

  it('FE-SYNC-VISITS-005: an answer that does not read as visits leaves the kept ones and holds nothing up', async () => {
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });
    await tourVisitRepo.update(4, 10, 'stop-01', { status: 'planned' });
    server.use(
      http.put('/api/trips/4/tour-visits/9/stop-01', () => HttpResponse.json({ ok: true })),
      http.put('/api/trips/4/tour-visits/10/stop-01', () => HttpResponse.json({ visits: [] }))
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await cached()).toEqual(['9:stop-02:skipped']);
  });
});
