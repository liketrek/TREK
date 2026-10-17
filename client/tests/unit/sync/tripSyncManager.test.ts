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
import { setTripPinned, setTripOfflineEnabled, _resetOfflinePrefs } from '../../../src/sync/offlinePrefs';
import { offlineDb, clearAll, upsertTrip } from '../../../src/db/offlineDb';
import { useAddonStore } from '../../../src/store/addonStore';
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

// Helper to get today ± N days as YYYY-MM-DD. Local calendar date, like the
// manager itself, so the ±1-day boundary cases hold outside UTC too.
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  _resetOfflinePrefs();
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
  it('#2228: reports why a run did not start instead of looking like a success', async () => {
    setAuthed(false);
    expect(await tripSyncManager.syncAll()).toEqual({ status: 'skipped', reason: 'signed-out' });
    expect(await tripSyncManager.prepareForOffline()).toEqual({ status: 'skipped', reason: 'signed-out' });

    setAuthed(true);
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    expect(await tripSyncManager.syncAll()).toEqual({ status: 'skipped', reason: 'offline' });
    expect(await tripSyncManager.prepareForOffline()).toEqual({ status: 'skipped', reason: 'offline' });
  });

  it('#2228: reports how many trips a completed run stored', async () => {
    const tripId = 104;
    const trip = buildTrip({ id: tripId, end_date: dateOffset(3) });
    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [trip] })),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json({ ...makeBundle(tripId), trip })),
    );

    expect(await tripSyncManager.prepareForOffline()).toEqual({ status: 'done', trips: 1 });
  });

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

  it('#2228: caches a past trip once the user pins it', async () => {
    const tripId = 103;
    const trip = buildTrip({ id: tripId, end_date: dateOffset(-40) });
    const bundle = makeBundle(tripId);

    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [trip] })),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json({ ...bundle, trip })),
    );

    // Without the pin the date rule refuses it, which is what made the per-trip
    // switch look like it did nothing for anyone whose trips are all finished.
    await tripSyncManager.syncAll();
    expect(await offlineDb.trips.get(tripId)).toBeUndefined();

    setTripPinned(tripId, true);
    tripSyncManager._resetSyncing();
    await tripSyncManager.syncAll();
    expect(await offlineDb.trips.get(tripId)).toBeDefined();
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

  it('#2228: does not evict a pinned trip, however long ago it ended', async () => {
    const pinnedId = 202;
    const trip = buildTrip({ id: pinnedId, end_date: dateOffset(-400) });
    await upsertTrip(trip);
    setTripPinned(pinnedId, true);

    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [trip] })),
      http.get(`/api/trips/${pinnedId}/bundle`, () => HttpResponse.json({ ...makeBundle(pinnedId), trip })),
    );

    await tripSyncManager.syncAll();
    expect(await offlineDb.trips.get(pinnedId)).toBeDefined();
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

describe('tripSyncManager.syncAll — tours', () => {
  const tour = {
    place_id: 900, name: 'Ridge walk', tour_type: 'hike', distance: 8, elevation_gain: 600, elevation_loss: 600,
    duration: 180, difficulty: null, wanderer_ref: null, match_confidence: 1, max_hiking_difficulty: 2,
    planned: false, caution: false, has_waypoints: true,
  };

  function serve(tripId: number, tours: () => Response) {
    let asked = 0;
    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(5) })] })),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(makeBundle(tripId))),
      http.get(`/api/trips/${tripId}/tours`, () => { asked++; return tours(); }),
    );
    return () => asked;
  }

  afterEach(() => useAddonStore.setState({ addons: [] }));

  it("caches the trip's tours while the addon is on", async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never });
    serve(310, () => HttpResponse.json({ tours: [tour] }));

    await tripSyncManager.syncAll();

    expect(await offlineDb.tours.get(900)).toMatchObject({ trip_id: 310, name: 'Ridge walk' });
  });

  it('does not ask while the addon is off', async () => {
    const asked = serve(311, () => HttpResponse.json({ tours: [tour] }));

    await tripSyncManager.syncAll();

    expect(asked()).toBe(0);
    expect(await offlineDb.tours.count()).toBe(0);
  });

  it('a failed tours request leaves the rest of the trip stored', async () => {
    useAddonStore.setState({ addons: [{ id: 'tours', enabled: true }] as never });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    serve(312, () => HttpResponse.json({ error: 'boom' }, { status: 500 }));

    await tripSyncManager.syncAll();

    expect(await offlineDb.places.where('trip_id').equals(312).count()).toBe(1);
    expect(await offlineDb.syncMeta.get(312)).toBeDefined();
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

// ── local calendar dates ───────────────────────────────────────────────────────

describe('tripSyncManager.syncAll — local calendar dates', () => {
  // Only Date is faked; Dexie and MSW keep their real timers.
  const withClock = (tz: string, iso: string, run: () => Promise<void>) => async () => {
    const prevTz = process.env.TZ;
    process.env.TZ = tz;
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(iso));
    try {
      await run();
    } finally {
      vi.useRealTimers();
      if (prevTz === undefined) delete process.env.TZ;
      else process.env.TZ = prevTz;
    }
  };

  it('caches a trip on its last evening west of UTC', withClock(
    'America/Los_Angeles',
    // 21:00 on the 22nd in Los Angeles is already the 23rd in UTC.
    '2026-08-23T04:00:00Z',
    async () => {
      const tripId = 110;
      const trip = buildTrip({ id: tripId, end_date: '2026-08-22' });
      const bundle = { ...makeBundle(tripId), trip };

      server.use(
        http.get('/api/trips', () => HttpResponse.json({ trips: [trip] })),
        http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(bundle)),
      );

      await tripSyncManager.syncAll();
      expect(await offlineDb.trips.get(tripId)).toBeDefined();
    },
  ));

  it('drops a trip that ended yesterday east of UTC', withClock(
    'Asia/Tokyo',
    // 08:00 on the 23rd in Tokyo is still the 22nd in UTC.
    '2026-08-22T23:00:00Z',
    async () => {
      const tripId = 111;
      const trip = buildTrip({ id: tripId, end_date: '2026-08-22' });

      let bundleCalled = false;
      server.use(
        http.get('/api/trips', () => HttpResponse.json({ trips: [trip] })),
        http.get(`/api/trips/${tripId}/bundle`, () => {
          bundleCalled = true;
          return HttpResponse.json({});
        }),
      );

      await tripSyncManager.syncAll();
      expect(bundleCalled).toBe(false);
      expect(await offlineDb.trips.get(tripId)).toBeUndefined();
    },
  ));
});

// ── logout mid-sync ────────────────────────────────────────────────────────────

describe('tripSyncManager.syncAll — logout while syncing', () => {
  it('stops writing trips once the gate closes mid-loop', async () => {
    const firstId = 500;
    const secondId = 501;
    const first = buildTrip({ id: firstId, end_date: dateOffset(5) });
    const second = buildTrip({ id: secondId, end_date: dateOffset(5) });

    let secondBundleCalled = false;
    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [first, second] })),
      http.get(`/api/trips/${firstId}/bundle`, () => {
        // The user logs out while the first bundle is on the wire.
        setAuthed(false);
        return HttpResponse.json({ ...makeBundle(firstId), trip: first });
      }),
      http.get(`/api/trips/${secondId}/bundle`, () => {
        secondBundleCalled = true;
        return HttpResponse.json({ ...makeBundle(secondId), trip: second });
      }),
    );

    await tripSyncManager.syncAll();

    expect(secondBundleCalled).toBe(false);
    expect(await offlineDb.trips.get(secondId)).toBeUndefined();
  });
});

vi.mock('../../../src/repo/roadtripPreferencesRepo', () => ({ roadtripPreferencesRepo: { read: vi.fn(async () => ({})) } }))

describe('tripSyncManager.syncAll: deletions made elsewhere', () => {
  it('drops cached rows the server no longer has, and keeps the ones created offline', async () => {
    const tripId = 400;
    const bundle = makeBundle(tripId);
    await upsertTrip(bundle.trip);
    // Deleted by a collaborator while this device was offline.
    await offlineDb.places.put(buildPlace({ trip_id: tripId, id: 7001 }));
    // Created offline, not synced yet: a negative temp id.
    await offlineDb.places.put(buildPlace({ trip_id: tripId, id: -55 }));
    // Another trip's place is none of this sync's business.
    await offlineDb.places.put(buildPlace({ trip_id: 999, id: 7002 }));

    server.use(
      http.get('/api/trips', () => HttpResponse.json({ trips: [buildTrip({ id: tripId, end_date: dateOffset(5) })] })),
      http.get(`/api/trips/${tripId}/bundle`, () => HttpResponse.json(bundle)),
    );
    await tripSyncManager.syncAll();

    const ids = (await offlineDb.places.toArray()).map(p => p.id).sort((a, b) => a - b);
    expect(ids).toEqual([-55, bundle.places[0].id, 7002].sort((a, b) => a - b));
  });

  it('clears a cached trip the server no longer lists (deleted, or this user was removed)', async () => {
    const gone = makeBundle(500);
    await upsertTrip(gone.trip);
    await offlineDb.places.put(buildPlace({ trip_id: 500, id: 8001 }));

    server.use(http.get('/api/trips', () => HttpResponse.json({ trips: [] })));
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(500)).toBeUndefined();
    expect(await offlineDb.places.where('trip_id').equals(500).count()).toBe(0);
  });

  it('keeps an archived trip: the plain list leaves it out, the archived list does not', async () => {
    const active = buildTrip({ id: 600, end_date: dateOffset(5) });
    const archived = buildTrip({ id: 601, end_date: dateOffset(-400), is_archived: 1 });
    await upsertTrip(archived);
    setTripPinned(601, true);
    await offlineDb.places.put(buildPlace({ trip_id: 601, id: 8101 }));
    await offlineDb.mutationQueue.put({
      id: 'parked-601', tripId: 601, method: 'PUT', url: '/trips/601/places/8101', body: { name: 'X' },
      createdAt: 1, status: 'failed', attempts: 8, lastError: 'boom', resource: 'places', entityId: 8101,
    });

    server.use(
      http.get('/api/trips', ({ request }) => HttpResponse.json({
        trips: new URL(request.url).searchParams.get('archived') === '1' ? [archived] : [active],
      })),
      http.get('/api/trips/600/bundle', () => HttpResponse.json({ ...makeBundle(600), trip: active })),
    );
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(601)).toBeDefined();
    expect(await offlineDb.places.get(8101)).toBeDefined();
    expect(await offlineDb.mutationQueue.get('parked-601')).toBeDefined();
  });

  /** The server lists `active` as the user's trips and `archived` behind ?archived=1. */
  function listTrips(active: ReturnType<typeof buildTrip>[], archived: ReturnType<typeof buildTrip>[]) {
    return http.get('/api/trips', ({ request }) => HttpResponse.json({
      trips: new URL(request.url).searchParams.get('archived') === '1' ? archived : active,
    }));
  }

  it('evicts an archived trip that ended more than 7 days ago, and keeps its parked changes', async () => {
    const archived = buildTrip({ id: 605, end_date: dateOffset(-30), is_archived: 1 });
    await upsertTrip(archived);
    await offlineDb.places.put(buildPlace({ trip_id: 605, id: 8105 }));
    await offlineDb.mutationQueue.put({
      id: 'parked-605', tripId: 605, method: 'PUT', url: '/trips/605/places/8105', body: { name: 'X' },
      createdAt: 1, status: 'failed', attempts: 8, lastError: 'boom', resource: 'places', entityId: 8105,
    });

    server.use(listTrips([], [archived]));
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(605)).toBeUndefined();
    expect(await offlineDb.places.get(8105)).toBeUndefined();
    expect(await offlineDb.mutationQueue.get('parked-605')).toBeDefined();
  });

  it('evicts an archived trip the user switched off, however recent', async () => {
    const archived = buildTrip({ id: 606, end_date: dateOffset(5), is_archived: 1 });
    await upsertTrip(archived);
    setTripOfflineEnabled(606, false);

    server.use(listTrips([], [archived]));
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(606)).toBeUndefined();
  });

  it('keeps an archived trip that is still within the date rule, without syncing it', async () => {
    const archived = buildTrip({ id: 607, end_date: dateOffset(5), is_archived: 1 });
    await upsertTrip(archived);
    let bundles = 0;

    server.use(
      listTrips([], [archived]),
      http.get('/api/trips/607/bundle', () => { bundles++; return HttpResponse.json({ ...makeBundle(607), trip: archived }); }),
    );
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(607)).toBeDefined();
    expect(bundles).toBe(0);
  });

  it('treats nothing as gone when the archived list cannot be read', async () => {
    const archived = buildTrip({ id: 602, end_date: dateOffset(5) });
    await upsertTrip(archived);

    server.use(
      http.get('/api/trips', ({ request }) => new URL(request.url).searchParams.get('archived') === '1'
        ? HttpResponse.json({ error: 'boom' }, { status: 500 })
        : HttpResponse.json({ trips: [] })),
    );
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(602)).toBeDefined();
  });

  it('keeps the parked and queued changes of a trip that is really gone, for the user to discard', async () => {
    await upsertTrip(buildTrip({ id: 603, end_date: dateOffset(5) }));
    await offlineDb.mutationQueue.bulkPut([
      { id: 'parked-603', tripId: 603, method: 'PUT', url: '/trips/603/places/1', body: {}, createdAt: 1, status: 'failed', attempts: 8, lastError: 'boom', resource: 'places', entityId: 1 },
      { id: 'conflict-603', tripId: 603, method: 'PUT', url: '/trips/603/places/2', body: {}, createdAt: 2, status: 'conflict', attempts: 1, lastError: 'conflict', resource: 'places', entityId: 2 },
      { id: 'pending-603', tripId: 603, method: 'PUT', url: '/trips/603/places/3', body: {}, createdAt: 3, status: 'pending', attempts: 0, lastError: null, resource: 'places', entityId: 3 },
    ]);

    server.use(http.get('/api/trips', () => HttpResponse.json({ trips: [] })));
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(603)).toBeUndefined();
    expect((await offlineDb.mutationQueue.toArray()).map(m => m.id).sort()).toEqual(['conflict-603', 'parked-603', 'pending-603']);
  });

  it('a stale or switched-off trip keeps its parked changes too', async () => {
    const stale = buildTrip({ id: 604, end_date: dateOffset(-30) });
    await upsertTrip(stale);
    await offlineDb.mutationQueue.put({
      id: 'parked-604', tripId: 604, method: 'PUT', url: '/trips/604/places/1', body: {}, createdAt: 1,
      status: 'failed', attempts: 8, lastError: 'boom', resource: 'places', entityId: 1,
    });

    server.use(http.get('/api/trips', () => HttpResponse.json({ trips: [stale] })));
    await tripSyncManager.syncAll();

    expect(await offlineDb.trips.get(604)).toBeUndefined();
    expect(await offlineDb.mutationQueue.get('parked-604')).toBeDefined();
  });
});
