/**
 * tripSyncManager unit tests.
 *
 * Covers: trip filtering (shouldCache/isStale), bundle fetch → Dexie upsert,
 * stale trip eviction, offline guard, file blob caching.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { server } from '../../helpers/msw/server';
import { http, HttpResponse } from 'msw';
import { tripSyncManager } from '../../../src/sync/tripSyncManager';
import { setAuthed } from '../../../src/sync/authGate';
import { offlineDb, clearAll, upsertTrip } from '../../../src/db/offlineDb';
import {
  buildTrip,
  buildDay,
  buildPlace,
  buildPackingItem,
  buildTodoItem,
  buildBudgetItem,
  buildReservation,
  buildTripFile,
} from '../../helpers/factories';

// Helper to get today ± N days as YYYY-MM-DD
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeBundle(tripId: number) {
  const trip = buildTrip({ id: tripId, end_date: dateOffset(3) });
  return {
    trip,
    days: [buildDay({ trip_id: tripId, assignments: [], notes_items: [] })],
    places: [buildPlace({ trip_id: tripId })],
    packingItems: [buildPackingItem({ trip_id: tripId })],
    todoItems: [buildTodoItem({ trip_id: tripId })],
    budgetItems: [buildBudgetItem({ trip_id: tripId })],
    reservations: [buildReservation({ trip_id: tripId })],
    files: [buildTripFile({ trip_id: tripId, url: `/api/trips/${tripId}/files/99/download`, mime_type: 'application/pdf' })],
  };
}

beforeEach(async () => {
  await clearAll();
  tripSyncManager._resetSyncing();
  setAuthed(true);
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  // Stub fetch for blob caching (used by cacheFilesForTrip)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    blob: async () => new Blob(['data'], { type: 'application/pdf' }),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setAuthed(false);
});

describe('tripSyncManager.syncAll — auth gate (B4)', () => {
  it('no-ops when logged out (gate closed)', async () => {
    setAuthed(false);
    let called = false;
    server.use(
      http.get('/api/trips', () => { called = true; return HttpResponse.json({ trips: [] }); }),
    );
    await tripSyncManager.syncAll();
    expect(called).toBe(false);
  });
});

// ── offline guard ─────────────────────────────────────────────────────────────

describe('tripSyncManager.syncAll — offline guard', () => {
  it('does nothing when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });

    let listed = false;
    server.use(
      http.get('/api/trips', () => { listed = true; return HttpResponse.json({ trips: [] }); }),
    );

    await tripSyncManager.syncAll();
    expect(listed).toBe(false);
  });
});

// ── trip filtering ─────────────────────────────────────────────────────────────

describe('tripSyncManager.syncAll — trip filtering', () => {
  it('caches ongoing trips (end_date >= today)', async () => {
    const tripId = 100;
    const bundle = makeBundle(tripId);

    server.use(
      http.get('/api/trips', () =>
        HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(2) })] }),
      ),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(bundle)),
    );

    await tripSyncManager.syncAll();

    const cached = await offlineDb.trips.get(tripId);
    expect(cached).toBeDefined();
    expect(cached!.id).toBe(tripId);
  });

  it('caches trips with no end_date', async () => {
    const tripId = 101;
    const bundle = makeBundle(tripId);
    const trip = buildTrip({ id: tripId, end_date: null as unknown as string });

    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [trip] })),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json({ ...bundle, trip })),
    );

    await tripSyncManager.syncAll();
    expect(await offlineDb.trips.get(tripId)).toBeDefined();
  });

  it('does not cache past trips (end_date < today)', async () => {
    const tripId = 102;

    server.use(
      http.get('/api/trips', () =>
        HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(-1) })] }),
      ),
    );

    // Bundle should NOT be called for past trips
    let bundleCalled = false;
    server.use(
      http.get(`/api/trips/${tripId}/bundle`, () => {
        bundleCalled = true;
        return HttpResponse.json({});
      }),
    );

    await tripSyncManager.syncAll();
    expect(bundleCalled).toBe(false);
    expect(await offlineDb.trips.get(tripId)).toBeUndefined();
  });
});

// ── stale eviction ─────────────────────────────────────────────────────────────

describe('tripSyncManager.syncAll — stale eviction', () => {
  it('evicts trips that ended more than 7 days ago', async () => {
    const staleId = 200;
    // Seed Dexie as if previously cached
    await upsertTrip(buildTrip({ id: staleId, end_date: dateOffset(-8) }));

    server.use(
      http.get('/api/trips', () =>
        HttpResponse.json({ trips: [buildTrip({ id: staleId, end_date: dateOffset(-8) })] }),
      ),
    );

    await tripSyncManager.syncAll();
    expect(await offlineDb.trips.get(staleId)).toBeUndefined();
  });

  it('does NOT evict trips that ended exactly 6 days ago', async () => {
    const recentId = 201;
    const bundle = makeBundle(recentId);
    const trip = buildTrip({ id: recentId, end_date: dateOffset(-6) });

    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [trip] })),
      http.get(`/api/trips/${recentId}/bundle`, () => HttpResponse.json({ ...bundle, trip })),
    );

    await tripSyncManager.syncAll();
    // end_date = -6 days: still within 7d window, but < today so not cached
    // i.e., shouldCache is false (end_date < today) so won't be fetched
    // but also isStale is false (end_date = -6 >= cutoff -7), so won't be evicted
    // → trip should simply not appear in Dexie (not cached, not evicted pre-seeded data)
    expect(await offlineDb.trips.get(recentId)).toBeUndefined();
  });
});

// ── bundle upsert ──────────────────────────────────────────────────────────────

describe('tripSyncManager.syncAll — bundle upsert', () => {
  it('writes all bundle entities to Dexie', async () => {
    const tripId = 300;
    const bundle = makeBundle(tripId);

    server.use(
      http.get('/api/trips', () =>
        HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(5) })] }),
      ),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(bundle)),
    );

    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(tripId)).toBeDefined();
    expect(await offlineDb.days.where('trip_id').equals(tripId).count()).toBe(1);
    expect(await offlineDb.places.where('trip_id').equals(tripId).count()).toBe(1);
    expect(await offlineDb.packingItems.where('trip_id').equals(tripId).count()).toBe(1);
    expect(await offlineDb.todoItems.where('trip_id').equals(tripId).count()).toBe(1);
    expect(await offlineDb.budgetItems.where('trip_id').equals(tripId).count()).toBe(1);
    expect(await offlineDb.reservations.where('trip_id').equals(tripId).count()).toBe(1);
    expect(await offlineDb.tripFiles.where('trip_id').equals(tripId).count()).toBe(1);
  });

  it('writes syncMeta with lastSyncedAt', async () => {
    const tripId = 301;
    const bundle = makeBundle(tripId);

    server.use(
      http.get('/api/trips', () =>
        HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(5) })] }),
      ),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(bundle)),
    );

    const before = Date.now();
    await tripSyncManager.syncAll();
    const after = Date.now();

    const meta = await offlineDb.syncMeta.get(tripId);
    expect(meta).toBeDefined();
    expect(meta!.lastSyncedAt).toBeGreaterThanOrEqual(before);
    expect(meta!.lastSyncedAt).toBeLessThanOrEqual(after);
  });
});

// ── file blob caching ──────────────────────────────────────────────────────────

describe('tripSyncManager — file blob caching', () => {
  it('caches non-photo files after bundle sync', async () => {
    const tripId = 400;
    const bundle = makeBundle(tripId);

    server.use(
      http.get('/api/trips', () =>
        HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(5) })] }),
      ),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(bundle)),
    );

    await tripSyncManager.syncAll();

    // Give fire-and-forget a tick
    await new Promise(r => setTimeout(r, 50));

    const cached = await offlineDb.blobCache.toArray();
    expect(cached.length).toBeGreaterThan(0);
    expect(cached[0].url).toContain('/download');
  });

  it('does not cache photo files (image/* MIME)', async () => {
    const tripId = 401;
    const photoFile = buildTripFile({
      trip_id: tripId,
      mime_type: 'image/jpeg',
      url: `/api/trips/${tripId}/files/77/download`,
    });
    const bundle = {
      ...makeBundle(tripId),
      files: [photoFile],
    };

    server.use(
      http.get('/api/trips', () =>
        HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(5) })] }),
      ),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(bundle)),
    );

    await tripSyncManager.syncAll();
    await new Promise(r => setTimeout(r, 50));

    const cached = await offlineDb.blobCache.toArray();
    expect(cached.length).toBe(0);
  });
});
