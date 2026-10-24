// FE-REPO-TRIP-OFF-001 to FE-REPO-TRIP-OFF-004
// Offline changes to the trip itself (#2601).
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTrip } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import { clearAll, offlineDb } from '../db/offlineDb';
import { mutationQueue } from '../sync/mutationQueue';
import { tripChangeNeedsConnection, TripNeedsConnectionError, tripRepo } from './tripRepo';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

const trip = buildTrip({ id: 4, title: 'Rome', start_date: '2026-11-02', end_date: '2026-11-04', currency: 'EUR' });

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setOnline(false);
  await offlineDb.trips.put(trip);
});

afterEach(() => {
  vi.restoreAllMocks();
  setOnline(true);
});

describe('tripRepo.update, offline', () => {
  it('FE-REPO-TRIP-OFF-001: a new name sent with the unchanged dates is cached and queued', async () => {
    const { trip: saved } = await tripRepo.update(4, {
      title: 'Roma',
      description: 'Pasta',
      start_date: '2026-11-02',
      end_date: '2026-11-04',
      currency: 'EUR',
      reminder_days: 3,
    });

    expect(saved).toMatchObject({ id: 4, title: 'Roma', description: 'Pasta', reminder_days: 3 });
    expect(await offlineDb.trips.get(4)).toMatchObject({ title: 'Roma' });
    const [row] = await offlineDb.mutationQueue.toArray();
    expect(row).toMatchObject({ method: 'PUT', url: '/trips/4', resource: 'trips', entityId: 4 });
  });

  it('FE-REPO-TRIP-OFF-002: new dates, a day count, a currency or a cover are refused and nothing is written', async () => {
    for (const change of [{ end_date: '2026-11-06' }, { day_count: 5 }, { currency: 'USD' }, { cover_image: null }]) {
      await expect(tripRepo.update(4, change)).rejects.toBeInstanceOf(TripNeedsConnectionError);
    }
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect((await offlineDb.trips.get(4))?.end_date).toBe('2026-11-04');
  });

  it('FE-REPO-TRIP-OFF-003: archiving offline waits in the queue', async () => {
    await tripRepo.update(4, { is_archived: true });

    expect((await offlineDb.trips.get(4))?.is_archived).toBe(true);
    expect((await offlineDb.mutationQueue.toArray())[0].body).toEqual({ is_archived: true });
  });

  it('FE-REPO-TRIP-OFF-004: online with nothing queued, a change goes straight to the server', async () => {
    setOnline(true);
    server.use(http.put('/api/trips/4', () => HttpResponse.json({ trip: { ...trip, end_date: '2026-11-06' } })));

    const { trip: saved } = await tripRepo.update(4, { end_date: '2026-11-06' });

    expect(saved.end_date).toBe('2026-11-06');
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });
});

describe('tripChangeNeedsConnection', () => {
  it('FE-REPO-TRIP-OFF-005: a field sent with the value the trip has needs nothing', () => {
    expect(
      tripChangeNeedsConnection(trip, { title: 'x', start_date: '2026-11-02', end_date: '2026-11-04', currency: 'EUR' })
    ).toBe(false);
    expect(tripChangeNeedsConnection(trip, { start_date: '2026-11-01' })).toBe(true);
    expect(tripChangeNeedsConnection(undefined, { start_date: '2026-11-02' })).toBe(true);
  });
});
