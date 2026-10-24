// CW-03: checking a city walk's stops off without a connection. The queued mark
// is the only copy of it, and every read lays it over the visits kept here.
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { mutationQueue } from '../sync/mutationQueue';
import { tourVisitRepo } from './tourVisitRepo';

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value, writable: true, configurable: true });
}

let rows = 0;

function queued(overrides: Partial<QueuedMutation>): QueuedMutation {
  rows += 1;
  return {
    id: `row-${rows}`,
    tripId: 4,
    method: 'PUT',
    url: '/trips/4/tour-visits/9/stop-01',
    body: { status: 'visited' },
    createdAt: 1,
    status: 'pending',
    attempts: 0,
    lastError: null,
    resource: 'tourStationVisits',
    entityId: 9,
    ...overrides,
  };
}

const keys = (visits: ReadonlyArray<{ assignment_id: number; station_key: string; status: string }>) =>
  visits.map((visit) => `${visit.assignment_id}:${visit.station_key}:${visit.status}`).sort();

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setOnline(false);
  await offlineDb.tourStationVisits.bulkPut([
    { assignment_id: 9, station_key: 'stop-02', status: 'visited', trip_id: 4 },
    { assignment_id: 10, station_key: 'stop-01', status: 'skipped', trip_id: 4 },
    { assignment_id: 30, station_key: 'stop-01', status: 'visited', trip_id: 5 },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
  setOnline(true);
});

describe('tourVisitRepo offline', () => {
  it("FE-REPO-VISIT-OFF-001: a mark joins the queue as the server's own PUT and the day reads with it at once", async () => {
    const { visits } = await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });

    expect(keys(visits)).toEqual(['9:stop-01:visited', '9:stop-02:visited']);
    const [row] = await offlineDb.mutationQueue.toArray();
    expect(row).toMatchObject({
      tripId: 4,
      method: 'PUT',
      url: '/trips/4/tour-visits/9/stop-01',
      body: { status: 'visited' },
      resource: 'tourStationVisits',
      entityId: 9,
      status: 'pending',
    });
    // The kept rows stay as the server last said them.
    expect(await offlineDb.tourStationVisits.get([9, 'stop-01'])).toBeUndefined();
  });

  it('FE-REPO-VISIT-OFF-002: the trip reads with every waiting mark over the kept visits, a take back hiding one', async () => {
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'skipped' });
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'visited' });
    await tourVisitRepo.update(4, 9, 'stop-02', { status: 'planned' });

    const { visits } = await tourVisitRepo.list(4);

    expect(keys(visits)).toEqual(['10:stop-01:skipped', '9:stop-01:visited']);
  });

  it('FE-REPO-VISIT-OFF-003: a mark the server refused is not laid over, nor a row of another kind', async () => {
    await offlineDb.mutationQueue.bulkPut([
      queued({ id: 'failed', status: 'failed', body: { status: 'planned' }, url: '/trips/4/tour-visits/9/stop-02' }),
      queued({ id: 'conflict', status: 'conflict', createdAt: 2 }),
      queued({ id: 'place', resource: 'places', entityId: 9, createdAt: 3 }),
      queued({ id: 'no-day', entityId: undefined, createdAt: 4 }),
      queued({ id: 'bad-key', url: '/trips/4/tour-visits/9/a%2Fb', createdAt: 5 }),
      queued({ id: 'bad-body', body: { status: 'done' }, createdAt: 6 }),
      queued({ id: 'other-trip', tripId: 5, entityId: 30, url: '/trips/5/tour-visits/30/stop-09', createdAt: 7 }),
    ]);

    const { visits } = await tourVisitRepo.list(4);

    expect(keys(visits)).toEqual(['10:stop-01:skipped', '9:stop-02:visited']);
  });

  it('FE-REPO-VISIT-OFF-004: online behind an older mark of the same day, a mark waits behind it and asks for a send', async () => {
    setOnline(true);
    await offlineDb.mutationQueue.put(queued({ id: 'older', status: 'failed' }));
    const sendSoon = vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => undefined);

    const { visits } = await tourVisitRepo.update(4, 9, 'stop-03', { status: 'skipped' });

    expect(keys(visits)).toEqual(['9:stop-02:visited', '9:stop-03:skipped']);
    expect(sendSoon).toHaveBeenCalledOnce();
    const queue = await offlineDb.mutationQueue.orderBy('createdAt').toArray();
    expect(queue.map((row) => row.url)).toEqual(['/trips/4/tour-visits/9/stop-01', '/trips/4/tour-visits/9/stop-03']);
  });

  it('FE-REPO-VISIT-OFF-005: a day put on the plan offline cannot be marked before it synced', async () => {
    await expect(tourVisitRepo.update(4, -1700000000000, 'stop-01', { status: 'visited' })).rejects.toThrow(
      'This day has not synced yet.'
    );
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });

  it("FE-REPO-VISIT-OFF-006: another traveller's marks are kept, with this device's waiting mark still on top", async () => {
    await tourVisitRepo.update(4, 9, 'stop-01', { status: 'skipped' });

    const { visits } = await tourVisitRepo.received(4, 9, [
      { assignment_id: 9, station_key: 'stop-01', status: 'visited' },
      { assignment_id: 9, station_key: 'stop-04', status: 'visited' },
    ]);

    expect(keys(visits)).toEqual(['9:stop-01:skipped', '9:stop-04:visited']);
    await vi.waitFor(async () =>
      expect(keys(await offlineDb.tourStationVisits.where('assignment_id').equals(9).toArray())).toEqual([
        '9:stop-01:visited',
        '9:stop-04:visited',
      ])
    );
    expect(await offlineDb.tourStationVisits.get([10, 'stop-01'])).toMatchObject({ status: 'skipped' });
  });
});
