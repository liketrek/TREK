/**
 * offlineDb unit tests.
 *
 * Uses fake-indexeddb so no real browser IDB is needed.
 * Each test gets a fresh database by using `use-fake-indexeddb` with Dexie.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

// Re-import after fake-indexeddb is set up so Dexie picks up the shim.
// We re-open a clean db in each test to isolate state.
import {
  offlineDb,
  clearTripData,
  clearAll,
  upsertTrip,
  upsertDays,
  upsertPlaces,
  upsertPackingItems,
  upsertTodoItems,
  upsertBudgetItems,
  upsertReservations,
  upsertTripFiles,
  upsertSyncMeta,
  reopenForUser,
  reopenAnonymous,
  deleteCurrentUserDb,
  enforceBlobBudget,
  type QueuedMutation,
  type SyncMeta,
  type BlobCacheEntry,
} from '../../../src/db/offlineDb';
import type { Trip, Day, Place, PackingItem, TodoItem, BudgetItem, Reservation, TripFile } from '../../../src/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeTrip = (id = 1): Trip => ({
  id,
  user_id: 42,
  title: `Trip ${id}`,
  description: null,
  start_date: '2026-07-01',
  end_date: '2026-07-05',
  currency: 'EUR',
  cover_image: null,
  is_archived: 0,
  reminder_days: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const makeDay = (id: number, tripId = 1): Day => ({
  id,
  trip_id: tripId,
  date: '2026-07-01',
  title: null,
  notes: null,
  assignments: [],
  notes_items: [],
});

const makePlace = (id: number, tripId = 1): Place => ({
  id,
  trip_id: tripId,
  name: `Place ${id}`,
  description: null,
  notes: null,
  lat: 48.8566,
  lng: 2.3522,
  address: null,
  category_id: null,
  price: null,
  currency: null,
  image_url: null,
  google_place_id: null,
  osm_id: null,
  route_geometry: null,
  place_time: null,
  end_time: null,
  duration_minutes: null,
  transport_mode: null,
  website: null,
  phone: null,
  created_at: '2026-01-01T00:00:00Z',
});

const makeBlob = (url: string, tripId = 1, bytes = 10, cachedAt = 1): BlobCacheEntry => ({
  url,
  tripId,
  blob: new Blob(['x'.repeat(bytes)], { type: 'application/pdf' }),
  bytes,
  mime: 'application/pdf',
  cachedAt,
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeEach(async () => {
  // Ensure DB is open (fake-indexeddb resets between test files but not between tests).
  if (!offlineDb.isOpen()) await offlineDb.open();
  // Clear all tables before each test.
  await clearAll();
});

afterEach(async () => {
  if (!offlineDb.isOpen()) await offlineDb.open();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('offlineDb — trips', () => {
  it('stores and retrieves a trip via upsertTrip', async () => {
    const trip = makeTrip(10);
    await upsertTrip(trip);
    const stored = await offlineDb.trips.get(10);
    expect(stored).toBeDefined();
    expect(stored!.title).toBe('Trip 10');
  });

  it('upsertTrip overwrites an existing trip (put semantics)', async () => {
    await upsertTrip(makeTrip(1));
    await upsertTrip({ ...makeTrip(1), title: 'Updated' });
    const stored = await offlineDb.trips.get(1);
    expect(stored!.title).toBe('Updated');
  });
});

describe('offlineDb — days', () => {
  it('stores days and retrieves by trip_id index', async () => {
    await upsertDays([makeDay(1, 5), makeDay(2, 5), makeDay(3, 9)]);
    const trip5Days = await offlineDb.days.where('trip_id').equals(5).toArray();
    expect(trip5Days).toHaveLength(2);
    expect(trip5Days.map(d => d.id)).toContain(1);
    expect(trip5Days.map(d => d.id)).toContain(2);
  });
});

describe('offlineDb — places', () => {
  it('stores places and retrieves by trip_id', async () => {
    await upsertPlaces([makePlace(10, 1), makePlace(11, 1), makePlace(12, 2)]);
    const places = await offlineDb.places.where('trip_id').equals(1).toArray();
    expect(places).toHaveLength(2);
  });
});

describe('offlineDb — packing / todo / budget / reservations / files', () => {
  it('upserts packing items', async () => {
    const item: PackingItem = { id: 1, trip_id: 1, name: 'Passport', category: null, checked: 0, sort_order: 0, quantity: 1 };
    await upsertPackingItems([item]);
    expect(await offlineDb.packingItems.count()).toBe(1);
  });

  it('upserts todo items', async () => {
    const item: TodoItem = {
      id: 1, trip_id: 1, name: 'Book hotel', category: null, checked: 0,
      sort_order: 0, due_date: null, description: null, assigned_user_id: null, priority: 0,
    };
    await upsertTodoItems([item]);
    expect(await offlineDb.todoItems.count()).toBe(1);
  });

  it('upserts budget items', async () => {
    const item: BudgetItem = {
      id: 1, trip_id: 1, name: 'Flight', total_price: 500,
      category: 'Transport', persons: 1, members: [], expense_date: null, sort_order: 0,
    };
    await upsertBudgetItems([item]);
    expect(await offlineDb.budgetItems.count()).toBe(1);
  });

  it('upserts reservations', async () => {
    const item: Reservation = {
      id: 1, trip_id: 1, title: 'Hotel', type: 'hotel', status: 'confirmed',
      reservation_time: null, confirmation_number: null, notes: null, created_at: '2026-01-01T00:00:00Z',
    };
    await upsertReservations([item]);
    expect(await offlineDb.reservations.count()).toBe(1);
  });

  it('upserts trip files', async () => {
    const file: TripFile = {
      id: 1, trip_id: 1, filename: 'ticket.pdf', original_name: 'Ticket.pdf',
      mime_type: 'application/pdf', url: '/api/trips/1/files/1/download', created_at: '2026-01-01T00:00:00Z',
    };
    await upsertTripFiles([file]);
    expect(await offlineDb.tripFiles.count()).toBe(1);
  });
});

describe('offlineDb — syncMeta', () => {
  it('stores and retrieves syncMeta by tripId', async () => {
    const meta: SyncMeta = {
      tripId: 7,
      lastSyncedAt: Date.now(),
      status: 'idle',
      tilesBbox: null,
      filesCachedCount: 0,
    };
    await upsertSyncMeta(meta);
    const stored = await offlineDb.syncMeta.get(7);
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('idle');
  });
});

describe('offlineDb — mutationQueue', () => {
  it('stores queued mutations queryable by status', async () => {
    const pending: QueuedMutation = {
      id: 'uuid-1', tripId: 1, method: 'POST', url: '/api/trips/1/places',
      body: { name: 'Eiffel Tower' }, createdAt: Date.now(),
      status: 'pending', attempts: 0, lastError: null,
    };
    const failed: QueuedMutation = {
      id: 'uuid-2', tripId: 1, method: 'PUT', url: '/api/trips/1/places/5',
      body: { name: 'Updated' }, createdAt: Date.now(),
      status: 'failed', attempts: 3, lastError: 'Network error',
    };
    await offlineDb.mutationQueue.bulkPut([pending, failed]);

    const pendingRows = await offlineDb.mutationQueue.where('status').equals('pending').toArray();
    expect(pendingRows).toHaveLength(1);
    expect(pendingRows[0].id).toBe('uuid-1');

    const failedRows = await offlineDb.mutationQueue.where('status').equals('failed').toArray();
    expect(failedRows).toHaveLength(1);
    expect(failedRows[0].lastError).toBe('Network error');
  });
});

describe('offlineDb — blobCache', () => {
  it('stores and retrieves a Blob entry', async () => {
    const blob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
    const entry: BlobCacheEntry = {
      url: '/api/files/99/download',
      tripId: 1,
      blob,
      bytes: blob.size,
      mime: 'application/pdf',
      cachedAt: Date.now(),
    };
    await offlineDb.blobCache.put(entry);

    const stored = await offlineDb.blobCache.get('/api/files/99/download');
    expect(stored).toBeDefined();
    expect(stored!.mime).toBe('application/pdf');
    expect(stored!.blob).toBeDefined();
  });

  it('queries blobs by tripId index', async () => {
    await offlineDb.blobCache.bulkPut([
      makeBlob('/api/files/1/download', 1),
      makeBlob('/api/files/2/download', 1),
      makeBlob('/api/files/3/download', 2),
    ]);
    const trip1 = await offlineDb.blobCache.where('tripId').equals(1).toArray();
    expect(trip1).toHaveLength(2);
  });
});

describe('offlineDb — enforceBlobBudget', () => {
  it('evicts oldest-by-cachedAt entries past the count budget', async () => {
    // 5 entries with strictly increasing cachedAt; cap to 3.
    for (let i = 0; i < 5; i++) {
      await offlineDb.blobCache.put(makeBlob(`/api/files/${i}/download`, 1, 10, i + 1));
    }
    await enforceBlobBudget(3, Infinity);

    expect(await offlineDb.blobCache.count()).toBe(3);
    // Oldest two (cachedAt 1 and 2) are gone; newest survive.
    expect(await offlineDb.blobCache.get('/api/files/0/download')).toBeUndefined();
    expect(await offlineDb.blobCache.get('/api/files/1/download')).toBeUndefined();
    expect(await offlineDb.blobCache.get('/api/files/4/download')).toBeDefined();
  });

  it('evicts oldest entries past the byte budget', async () => {
    // 3 entries of 100 bytes each; cap to 250 bytes → newest two (200) survive.
    for (let i = 0; i < 3; i++) {
      await offlineDb.blobCache.put(makeBlob(`/api/files/${i}/download`, 1, 100, i + 1));
    }
    await enforceBlobBudget(Infinity, 250);

    expect(await offlineDb.blobCache.count()).toBe(2);
    expect(await offlineDb.blobCache.get('/api/files/0/download')).toBeUndefined();
  });

  it('is a no-op when already within budget', async () => {
    await offlineDb.blobCache.put(makeBlob('/api/files/1/download', 1));
    await enforceBlobBudget(10, Infinity);
    expect(await offlineDb.blobCache.count()).toBe(1);
  });
});

describe('offlineDb — clearTripData', () => {
  it('removes all data for the given trip across all tables', async () => {
    await upsertTrip(makeTrip(1));
    await upsertDays([makeDay(1, 1), makeDay(2, 1)]);
    await upsertPlaces([makePlace(10, 1)]);
    const item: PackingItem = { id: 5, trip_id: 1, name: 'Towel', category: null, checked: 0, sort_order: 0, quantity: 1 };
    await upsertPackingItems([item]);

    await offlineDb.blobCache.put(makeBlob('/api/files/1/download', 1));

    // Also add data for a different trip — should NOT be removed
    await upsertTrip(makeTrip(2));
    await upsertDays([makeDay(99, 2)]);
    await offlineDb.blobCache.put(makeBlob('/api/files/2/download', 2));

    await clearTripData(1);

    expect(await offlineDb.trips.get(1)).toBeUndefined();
    expect(await offlineDb.days.where('trip_id').equals(1).count()).toBe(0);
    expect(await offlineDb.places.where('trip_id').equals(1).count()).toBe(0);
    expect(await offlineDb.packingItems.where('trip_id').equals(1).count()).toBe(0);
    expect(await offlineDb.blobCache.where('tripId').equals(1).count()).toBe(0);

    // Trip 2 intact
    expect(await offlineDb.trips.get(2)).toBeDefined();
    expect(await offlineDb.days.where('trip_id').equals(2).count()).toBe(1);
    expect(await offlineDb.blobCache.get('/api/files/2/download')).toBeDefined();
  });
});

describe('offlineDb — clearAll', () => {
  it('empties all tables', async () => {
    await upsertTrip(makeTrip(1));
    await upsertDays([makeDay(1, 1), makeDay(2, 1)]);
    await upsertPlaces([makePlace(10, 1)]);

    await clearAll();

    expect(await offlineDb.trips.count()).toBe(0);
    expect(await offlineDb.days.count()).toBe(0);
    expect(await offlineDb.places.count()).toBe(0);
  });
});

describe('offlineDb — per-user scoping (B4)', () => {
  afterEach(async () => {
    // Leave the suite on the anonymous DB so other tests are unaffected.
    await reopenAnonymous();
  });

  it('isolates one user\'s cached data from another', async () => {
    await reopenForUser(1);
    await upsertPlaces([makePlace(10, 1)]);
    expect(await offlineDb.places.count()).toBe(1);

    // Switching users must not expose user 1's rows.
    await reopenForUser(2);
    expect(await offlineDb.places.count()).toBe(0);

    // Switching back restores user 1's data (different physical DB).
    await reopenForUser(1);
    expect(await offlineDb.places.get(10)).toBeDefined();
  });

  it('deleteCurrentUserDb wipes the user DB and returns to anonymous', async () => {
    await reopenForUser(5);
    await upsertPlaces([makePlace(20, 1)]);

    await deleteCurrentUserDb();
    // Now on the anonymous DB — no user data.
    expect(await offlineDb.places.count()).toBe(0);

    // Re-opening user 5 starts empty (DB was deleted, not just detached).
    await reopenForUser(5);
    expect(await offlineDb.places.count()).toBe(0);
  });
});
