import Dexie, { type Table } from 'dexie';
import type { Trip, Day, Place, PackingItem, TodoItem, BudgetItem, Reservation, TripFile, Accommodation, TripMember, Tag, Category } from '../types';

/** TripMember enriched with tripId so we can index by trip. */
export interface CachedTripMember extends TripMember {
  tripId: number;
}

// ── Queue + sync types ────────────────────────────────────────────────────────

export type MutationStatus = 'pending' | 'syncing' | 'failed';

export interface QueuedMutation {
  /** UUID — also used as X-Idempotency-Key sent to the server */
  id: string;
  tripId: number;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body: unknown;
  createdAt: number;
  status: MutationStatus;
  attempts: number;
  lastError: string | null;
  /** Dexie table name to write the server response into after flush (e.g. 'places') */
  resource?: string;
  /** For CREATE mutations enqueued offline: the temporary negative id written to Dexie */
  tempId?: number;
  /** For DELETE mutations: the entity id to remove from Dexie on flush */
  entityId?: number;
  /**
   * For PUT/DELETE enqueued offline against a still-unsynced (negative-id) entity:
   * the temp id of the target. The url carries an `{id}` placeholder that the
   * mutation queue rewrites to the real server id once the dependent CREATE flushes.
   */
  tempEntityId?: number;
}

export interface SyncMeta {
  tripId: number;
  lastSyncedAt: number | null;
  status: 'idle' | 'syncing' | 'error';
  /** Bounding box [minLng, minLat, maxLng, maxLat] of pre-downloaded map tiles */
  tilesBbox: [number, number, number, number] | null;
  filesCachedCount: number;
}

export interface BlobCacheEntry {
  /** Relative URL, e.g. "/api/files/42/download" */
  url: string;
  /**
   * Trip this blob belongs to, so it is evicted together with the trip in
   * clearTripData. Legacy rows cached before v3 carry the sentinel -1.
   */
  tripId: number;
  blob: Blob;
  /** Byte size captured at insert time — Blob.size is not reliably preserved
   *  across IndexedDB round-trips, so the LRU budget reads this instead. */
  bytes: number;
  mime: string;
  cachedAt: number;
}

// ── Dexie class ────────────────────────────────────────────────────────────────

/**
 * The offline DB is scoped per user so that one account can never read another
 * account's cached data on a shared device. Anonymous (logged-out) state uses
 * the base name; a logged-in user uses `trek-offline-u<userId>`.
 */
const ANON_DB_NAME = 'trek-offline';

function userDbName(userId: number | string): string {
  return `trek-offline-u${userId}`;
}

/**
 * Best-effort read of the persisted auth snapshot so the very first DB opened on
 * app load (before loadUser resolves) is already the correct per-user one — the
 * PWA can render cached data offline without leaking across users.
 */
function initialDbName(): string {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('trek_auth_snapshot') : null;
    if (!raw) return ANON_DB_NAME;
    const id = JSON.parse(raw)?.state?.user?.id;
    return id != null ? userDbName(id) : ANON_DB_NAME;
  } catch {
    return ANON_DB_NAME;
  }
}

class TrekOfflineDb extends Dexie {
  trips!: Table<Trip, number>;
  days!: Table<Day, number>;
  places!: Table<Place, number>;
  packingItems!: Table<PackingItem, number>;
  todoItems!: Table<TodoItem, number>;
  budgetItems!: Table<BudgetItem, number>;
  reservations!: Table<Reservation, number>;
  tripFiles!: Table<TripFile, number>;
  accommodations!: Table<Accommodation, number>;
  tripMembers!: Table<CachedTripMember, [number, number]>;
  tags!: Table<Tag, number>;
  categories!: Table<Category, number>;
  mutationQueue!: Table<QueuedMutation, string>;
  syncMeta!: Table<SyncMeta, number>;
  blobCache!: Table<BlobCacheEntry, string>;

  constructor(name: string = ANON_DB_NAME) {
    super(name);

    this.version(1).stores({
      trips:        'id',
      days:         'id, trip_id',
      places:       'id, trip_id',
      packingItems: 'id, trip_id',
      todoItems:    'id, trip_id',
      budgetItems:  'id, trip_id',
      reservations: 'id, trip_id',
      tripFiles:    'id, trip_id',
      mutationQueue:'id, tripId, status, createdAt',
      syncMeta:     'tripId',
      blobCache:    'url, cachedAt',
    });

    this.version(2).stores({
      accommodations: 'id, trip_id',
      tripMembers:    '[tripId+id], tripId',
      tags:           'id',
      categories:     'id',
    });

    // v3: scope the blob cache by trip so it can be evicted with the trip and
    // bounded by an LRU budget (see enforceBlobBudget).
    this.version(3).stores({
      blobCache: 'url, cachedAt, tripId',
    }).upgrade(async (tx) => {
      await tx.table('blobCache').toCollection().modify((row: Partial<BlobCacheEntry>) => {
        if (row.tripId == null) row.tripId = -1;
        if (row.bytes == null) row.bytes = row.blob?.size ?? 0;
      });
    });
  }
}

// The live instance is swapped on login/logout via reopenForUser/reopenAnonymous.
// A Proxy keeps the exported `offlineDb` binding stable for the ~19 modules that
// import it directly, while every access forwards to the current connection.
let _db = new TrekOfflineDb(initialDbName());

export const offlineDb = new Proxy({} as TrekOfflineDb, {
  get(_target, prop) {
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(_db) : value;
  },
  set(_target, prop, value) {
    (_db as unknown as Record<string | symbol, unknown>)[prop] = value;
    return true;
  },
}) as TrekOfflineDb;

async function switchTo(name: string): Promise<void> {
  if (_db.name === name) {
    if (!_db.isOpen()) await _db.open();
    return;
  }
  if (_db.isOpen()) _db.close();
  _db = new TrekOfflineDb(name);
  await _db.open();
}

/** Point the offline DB at a specific user's scoped database (call on login). */
export async function reopenForUser(userId: number | string): Promise<void> {
  await switchTo(userDbName(userId));
}

/** Point the offline DB at the anonymous database (call on logout). */
export async function reopenAnonymous(): Promise<void> {
  await switchTo(ANON_DB_NAME);
}

/**
 * Delete the current user's scoped database entirely and return to the anonymous
 * DB. Used on logout so no trace of the account's data remains on the device.
 */
export async function deleteCurrentUserDb(): Promise<void> {
  if (_db.name !== ANON_DB_NAME) {
    try { await _db.delete(); } catch { /* ignore — fall through to anon */ }
  }
  _db = new TrekOfflineDb(ANON_DB_NAME);
  await _db.open();
}

// ── Bulk upsert helpers ────────────────────────────────────────────────────────

export async function upsertTrip(trip: Trip): Promise<void> {
  await offlineDb.trips.put(trip);
}

export async function upsertDays(days: Day[]): Promise<void> {
  await offlineDb.days.bulkPut(days);
}

export async function upsertPlaces(places: Place[]): Promise<void> {
  await offlineDb.places.bulkPut(places);
}

export async function upsertPackingItems(items: PackingItem[]): Promise<void> {
  await offlineDb.packingItems.bulkPut(items);
}

export async function upsertTodoItems(items: TodoItem[]): Promise<void> {
  await offlineDb.todoItems.bulkPut(items);
}

export async function upsertBudgetItems(items: BudgetItem[]): Promise<void> {
  await offlineDb.budgetItems.bulkPut(items);
}

export async function upsertReservations(items: Reservation[]): Promise<void> {
  await offlineDb.reservations.bulkPut(items);
}

export async function upsertTripFiles(files: TripFile[]): Promise<void> {
  await offlineDb.tripFiles.bulkPut(files);
}

export async function upsertAccommodations(items: Accommodation[]): Promise<void> {
  await offlineDb.accommodations.bulkPut(items);
}

export async function upsertTripMembers(tripId: number, members: TripMember[]): Promise<void> {
  const rows: CachedTripMember[] = members.map(m => ({ ...m, tripId }));
  await offlineDb.tripMembers.bulkPut(rows);
}

export async function upsertTags(tags: Tag[]): Promise<void> {
  await offlineDb.tags.bulkPut(tags);
}

export async function upsertCategories(categories: Category[]): Promise<void> {
  await offlineDb.categories.bulkPut(categories);
}

export async function upsertSyncMeta(meta: SyncMeta): Promise<void> {
  await offlineDb.syncMeta.put(meta);
}

/**
 * Read a pre-downloaded file blob for offline use. Returns null when the file
 * was never cached (or on any read error). The stored MIME is reapplied so the
 * caller's inline-vs-download decision stays correct even if the persisted Blob
 * lost its type.
 */
export async function getCachedBlob(url: string): Promise<Blob | null> {
  try {
    const entry = await offlineDb.blobCache.get(url);
    if (!entry) return null;
    return entry.blob.type
      ? entry.blob
      : new Blob([entry.blob], { type: entry.mime || 'application/octet-stream' });
  } catch {
    return null;
  }
}

// ── Blob-cache budget ───────────────────────────────────────────────────────

/**
 * Upper bounds for the offline file-blob cache. Kept conservative so trip
 * documents never starve the map-tile cache (sized at MAX_TILES in
 * tilePrefetcher.ts) for the origin's storage quota.
 */
export const BLOB_CACHE_MAX_ENTRIES = 200;
export const BLOB_CACHE_MAX_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * Evict oldest-by-cachedAt blobs until the cache is under both the entry-count
 * and byte budget. Call after inserting new blobs. LRU on insertion time, which
 * is a reasonable proxy for access for write-once document blobs.
 */
export async function enforceBlobBudget(
  maxCount = BLOB_CACHE_MAX_ENTRIES,
  maxBytes = BLOB_CACHE_MAX_BYTES,
): Promise<void> {
  const entries = await offlineDb.blobCache.orderBy('cachedAt').toArray();
  let count = entries.length;
  let totalBytes = entries.reduce((sum, e) => sum + (e.bytes ?? 0), 0);
  if (count <= maxCount && totalBytes <= maxBytes) return;

  const toDelete: string[] = [];
  for (const e of entries) {
    if (count <= maxCount && totalBytes <= maxBytes) break;
    toDelete.push(e.url);
    totalBytes -= e.bytes ?? 0;
    count -= 1;
  }
  if (toDelete.length) await offlineDb.blobCache.bulkDelete(toDelete);
}

// ── Eviction / cleanup ────────────────────────────────────────────────────────

/** Delete all cached data for one trip (eviction or explicit clear). */
export async function clearTripData(tripId: number): Promise<void> {
  await offlineDb.transaction(
    'rw',
    [
      offlineDb.days,
      offlineDb.places,
      offlineDb.packingItems,
      offlineDb.todoItems,
      offlineDb.budgetItems,
      offlineDb.reservations,
      offlineDb.tripFiles,
      offlineDb.accommodations,
      offlineDb.tripMembers,
      offlineDb.mutationQueue,
      offlineDb.syncMeta,
      offlineDb.blobCache,
    ],
    async () => {
      await offlineDb.days.where('trip_id').equals(tripId).delete();
      await offlineDb.places.where('trip_id').equals(tripId).delete();
      await offlineDb.packingItems.where('trip_id').equals(tripId).delete();
      await offlineDb.todoItems.where('trip_id').equals(tripId).delete();
      await offlineDb.budgetItems.where('trip_id').equals(tripId).delete();
      await offlineDb.reservations.where('trip_id').equals(tripId).delete();
      await offlineDb.tripFiles.where('trip_id').equals(tripId).delete();
      await offlineDb.accommodations.where('trip_id').equals(tripId).delete();
      await offlineDb.tripMembers.where('tripId').equals(tripId).delete();
      await offlineDb.mutationQueue.where('tripId').equals(tripId).delete();
      await offlineDb.syncMeta.where('tripId').equals(tripId).delete();
      await offlineDb.blobCache.where('tripId').equals(tripId).delete();
    },
  );
  // Remove the trip row itself outside the transaction since it's a separate table
  await offlineDb.trips.delete(tripId);
}

/** Wipe the entire offline database (called on logout). */
export async function clearAll(): Promise<void> {
  await offlineDb.delete();
  // Re-open so subsequent operations don't fail
  await offlineDb.open();
}
