// FE-DB-OFFLINE-001 to FE-DB-OFFLINE-029
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import {
  offlineDb,
  clearAll,
  clearTripData,
  reopenForUser,
  reopenAnonymous,
  deleteCurrentUserDb,
  upsertTrip,
  upsertDays,
  upsertPlaces,
  upsertPackingItems,
  upsertTodoItems,
  upsertBudgetItems,
  upsertReservations,
  upsertTripFiles,
  upsertAccommodations,
  upsertTripMembers,
  upsertTags,
  upsertCategories,
  upsertSyncMeta,
  getCachedBlob,
  saveImportFiles,
  getImportFiles,
  deleteImportFiles,
  enforceBlobBudget,
  BLOB_CACHE_MAX_ENTRIES,
  BLOB_CACHE_MAX_BYTES,
} from './offlineDb'
import type { BlobCacheEntry, QueuedMutation } from './offlineDb'
import type { Accommodation, TripMember } from '../types'
import {
  buildTrip,
  buildDay,
  buildPlace,
  buildPackingItem,
  buildTodoItem,
  buildBudgetItem,
  buildReservation,
  buildTripFile,
  buildTag,
  buildCategory,
} from '../../tests/helpers/factories'

function blobEntry(url: string, cachedAt: number, bytes: number, tripId = 1): BlobCacheEntry {
  return { url, tripId, blob: new Blob(['x'.repeat(bytes)]), bytes, mime: 'application/pdf', cachedAt }
}

function queued(id: string, tripId: number, status: QueuedMutation['status']): QueuedMutation {
  return { id, tripId, method: 'PUT', url: `/trips/${tripId}/places/1`, body: {}, createdAt: 1, status, attempts: 0, lastError: null }
}

beforeEach(async () => {
  await clearAll()
})

afterEach(async () => {
  vi.restoreAllMocks()
  await reopenAnonymous()
})

describe('offlineDb — bulk upsert helpers', () => {
  it('FE-DB-OFFLINE-001: every entity helper writes into its own table', async () => {
    await upsertTrip(buildTrip({ id: 1 }))
    await upsertDays([buildDay({ id: 1, trip_id: 1 })])
    await upsertPlaces([buildPlace({ id: 1, trip_id: 1 })])
    await upsertPackingItems([buildPackingItem({ id: 1, trip_id: 1 })])
    await upsertTodoItems([buildTodoItem({ id: 1, trip_id: 1 })])
    await upsertBudgetItems([buildBudgetItem({ id: 1, trip_id: 1 })])
    await upsertReservations([buildReservation({ id: 1, trip_id: 1 })])
    await upsertTripFiles([buildTripFile({ id: 1, trip_id: 1 })])
    await upsertAccommodations([{ id: 1, trip_id: 1, start_day_id: 1, end_day_id: 2 } as Accommodation])
    await upsertTags([buildTag({ id: 1 })])
    await upsertCategories([buildCategory({ id: 1 })])

    expect(await offlineDb.trips.count()).toBe(1)
    expect(await offlineDb.days.count()).toBe(1)
    expect(await offlineDb.places.count()).toBe(1)
    expect(await offlineDb.packingItems.count()).toBe(1)
    expect(await offlineDb.todoItems.count()).toBe(1)
    expect(await offlineDb.budgetItems.count()).toBe(1)
    expect(await offlineDb.reservations.count()).toBe(1)
    expect(await offlineDb.tripFiles.count()).toBe(1)
    expect(await offlineDb.accommodations.count()).toBe(1)
    expect(await offlineDb.tags.count()).toBe(1)
    expect(await offlineDb.categories.count()).toBe(1)
  })

  it('FE-DB-OFFLINE-002: upsertTripMembers stamps the tripId onto every member row', async () => {
    const members = [
      { id: 5, username: 'ana', role: 'owner' },
      { id: 6, username: 'ben', role: 'member' },
    ] as unknown as TripMember[]

    await upsertTripMembers(42, members)

    const rows = await offlineDb.tripMembers.where('tripId').equals(42).toArray()
    expect(rows.map(r => r.username).sort()).toEqual(['ana', 'ben'])
    expect(rows.every(r => r.tripId === 42)).toBe(true)
  })

  it('FE-DB-OFFLINE-003: upsertSyncMeta overwrites the previous row for the same trip', async () => {
    await upsertSyncMeta({ tripId: 1, lastSyncedAt: 100, status: 'idle', tilesBbox: null, filesCachedCount: 0 })
    await upsertSyncMeta({ tripId: 1, lastSyncedAt: 200, status: 'error', tilesBbox: [0, 0, 1, 1], filesCachedCount: 3 })

    const meta = await offlineDb.syncMeta.get(1)
    expect(meta).toMatchObject({ lastSyncedAt: 200, status: 'error', filesCachedCount: 3 })
    expect(await offlineDb.syncMeta.count()).toBe(1)
  })
})

describe('offlineDb — getCachedBlob', () => {
  it('FE-DB-OFFLINE-004: returns null when the url was never cached', async () => {
    expect(await getCachedBlob('/api/files/1/download')).toBeNull()
  })

  it('FE-DB-OFFLINE-005: reapplies the stored MIME when the persisted Blob lost its type', async () => {
    await offlineDb.blobCache.put({
      url: '/a.csv', tripId: 1, blob: new Blob(['a,b']), bytes: 3, mime: 'text/csv', cachedAt: 1,
    })

    const blob = await getCachedBlob('/a.csv')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob!.type).toBe('text/csv')
  })

  it('FE-DB-OFFLINE-006: falls back to octet-stream when neither the Blob nor the row has a type', async () => {
    await offlineDb.blobCache.put({
      url: '/a.bin', tripId: 1, blob: new Blob(['a']), bytes: 1, mime: '', cachedAt: 1,
    })

    expect((await getCachedBlob('/a.bin'))!.type).toBe('application/octet-stream')
  })

  it('FE-DB-OFFLINE-007: a read error degrades to null instead of throwing', async () => {
    vi.spyOn(offlineDb.blobCache, 'get').mockRejectedValue(new Error('db closed'))
    expect(await getCachedBlob('/a.pdf')).toBeNull()
  })
})

describe('offlineDb — booking-import source files', () => {
  it('FE-DB-OFFLINE-008: stores a job\'s files under [jobId+fileName] and rebuilds them as Files', async () => {
    await saveImportFiles('job-1', [
      new File(['a'], 'ticket.pdf', { type: 'application/pdf' }),
      new File(['b'], 'boarding.pdf', { type: 'application/pdf' }),
    ])

    expect(await offlineDb.importFiles.where('jobId').equals('job-1').count()).toBe(2)

    const files = await getImportFiles('job-1')
    expect(files.map(f => f.name).sort()).toEqual(['boarding.pdf', 'ticket.pdf'])
    expect(files.every(f => f instanceof File)).toBe(true)
  })

  it('FE-DB-OFFLINE-009: a stored Blob without a type is rebuilt as octet-stream', async () => {
    await saveImportFiles('job-2', [new File(['x'], 'unknown')])
    expect((await getImportFiles('job-2'))[0].type).toBe('application/octet-stream')
  })

  it('FE-DB-OFFLINE-010: saving prunes source files from abandoned imports older than an hour', async () => {
    await offlineDb.importFiles.put({
      jobId: 'stale', fileName: 'old.pdf', blob: new Blob(['old']), createdAt: Date.now() - 2 * 3600_000,
    })

    await saveImportFiles('fresh', [new File(['new'], 'new.pdf')])

    expect(await getImportFiles('stale')).toEqual([])
    expect(await getImportFiles('fresh')).toHaveLength(1)
  })

  it('FE-DB-OFFLINE-011: deleteImportFiles drops only the given job', async () => {
    await saveImportFiles('job-a', [new File(['a'], 'a.pdf')])
    await saveImportFiles('job-b', [new File(['b'], 'b.pdf')])

    await deleteImportFiles('job-a')

    expect(await getImportFiles('job-a')).toEqual([])
    expect(await getImportFiles('job-b')).toHaveLength(1)
  })

  it('FE-DB-OFFLINE-012: all three helpers stay best-effort when Dexie throws', async () => {
    vi.spyOn(offlineDb.importFiles, 'bulkPut').mockRejectedValue(new Error('quota'))
    vi.spyOn(offlineDb.importFiles, 'where').mockImplementation(() => { throw new Error('db closed') })

    await expect(saveImportFiles('job-c', [new File(['c'], 'c.pdf')])).resolves.toBeUndefined()
    await expect(getImportFiles('job-c')).resolves.toEqual([])
    await expect(deleteImportFiles('job-c')).resolves.toBeUndefined()
  })
})

describe('offlineDb — blob cache budget', () => {
  it('FE-DB-OFFLINE-013: exposes conservative defaults', () => {
    expect(BLOB_CACHE_MAX_ENTRIES).toBe(200)
    expect(BLOB_CACHE_MAX_BYTES).toBe(100 * 1024 * 1024)
  })

  it('FE-DB-OFFLINE-014: a cache within both budgets is left untouched', async () => {
    await offlineDb.blobCache.bulkPut([blobEntry('/1', 1, 10), blobEntry('/2', 2, 10)])
    await enforceBlobBudget(5, 1000)
    expect(await offlineDb.blobCache.count()).toBe(2)
  })

  it('FE-DB-OFFLINE-015: evicts oldest-first until the entry count fits', async () => {
    await offlineDb.blobCache.bulkPut([blobEntry('/1', 1, 10), blobEntry('/2', 2, 10), blobEntry('/3', 3, 10)])

    await enforceBlobBudget(1, 1000)

    expect((await offlineDb.blobCache.toArray()).map(e => e.url)).toEqual(['/3'])
  })

  it('FE-DB-OFFLINE-016: evicts oldest-first until the byte budget fits', async () => {
    await offlineDb.blobCache.bulkPut([blobEntry('/1', 1, 100), blobEntry('/2', 2, 100), blobEntry('/3', 3, 100)])

    await enforceBlobBudget(100, 150)

    expect((await offlineDb.blobCache.toArray()).map(e => e.url)).toEqual(['/3'])
  })

  it('FE-DB-OFFLINE-017: rows written before the bytes column are counted as zero', async () => {
    await offlineDb.blobCache.bulkPut([
      { url: '/legacy', tripId: -1, blob: new Blob(['x']), mime: '', cachedAt: 1 } as unknown as BlobCacheEntry,
      blobEntry('/2', 2, 100),
    ])

    await enforceBlobBudget(100, 100)

    expect(await offlineDb.blobCache.count()).toBe(2)
  })
})

describe('offlineDb — clearTripData', () => {
  it('FE-DB-OFFLINE-018: drops the trip\'s read cache and leaves other trips alone', async () => {
    await upsertTrip(buildTrip({ id: 1 }))
    await upsertTrip(buildTrip({ id: 2 }))
    await upsertDays([buildDay({ id: 1, trip_id: 1 }), buildDay({ id: 2, trip_id: 2 })])
    await upsertPlaces([buildPlace({ id: 1, trip_id: 1 }), buildPlace({ id: 2, trip_id: 2 })])
    await upsertPackingItems([buildPackingItem({ id: 1, trip_id: 1 })])
    await upsertTodoItems([buildTodoItem({ id: 1, trip_id: 1 })])
    await upsertBudgetItems([buildBudgetItem({ id: 1, trip_id: 1 })])
    await upsertReservations([buildReservation({ id: 1, trip_id: 1 })])
    await upsertTripFiles([buildTripFile({ id: 1, trip_id: 1 })])
    await upsertAccommodations([{ id: 1, trip_id: 1, start_day_id: 1, end_day_id: 2 } as Accommodation])
    await upsertTripMembers(1, [{ id: 9, username: 'ana', role: 'owner' } as unknown as TripMember])
    await upsertSyncMeta({ tripId: 1, lastSyncedAt: 1, status: 'idle', tilesBbox: null, filesCachedCount: 0 })
    await offlineDb.blobCache.put(blobEntry('/f1', 1, 10, 1))
    await offlineDb.blobCache.put(blobEntry('/f2', 2, 10, 2))

    await clearTripData(1)

    expect(await offlineDb.trips.get(1)).toBeUndefined()
    expect(await offlineDb.days.where('trip_id').equals(1).count()).toBe(0)
    expect(await offlineDb.places.where('trip_id').equals(1).count()).toBe(0)
    expect(await offlineDb.packingItems.count()).toBe(0)
    expect(await offlineDb.todoItems.count()).toBe(0)
    expect(await offlineDb.budgetItems.count()).toBe(0)
    expect(await offlineDb.reservations.count()).toBe(0)
    expect(await offlineDb.tripFiles.count()).toBe(0)
    expect(await offlineDb.accommodations.count()).toBe(0)
    expect(await offlineDb.tripMembers.count()).toBe(0)
    expect(await offlineDb.syncMeta.get(1)).toBeUndefined()

    expect(await offlineDb.trips.get(2)).toBeDefined()
    expect(await offlineDb.days.where('trip_id').equals(2).count()).toBe(1)
    expect((await offlineDb.blobCache.toArray()).map(e => e.url)).toEqual(['/f2'])
  })

  it('FE-DB-OFFLINE-019: keeps unsynced work and only purges dead failed mutations', async () => {
    await offlineDb.mutationQueue.bulkPut([
      queued('m-pending', 1, 'pending'),
      queued('m-syncing', 1, 'syncing'),
      queued('m-conflict', 1, 'conflict'),
      queued('m-failed', 1, 'failed'),
      queued('m-other-trip', 2, 'failed'),
    ])

    await clearTripData(1)

    const left = (await offlineDb.mutationQueue.toArray()).map(m => m.id).sort()
    expect(left).toEqual(['m-conflict', 'm-other-trip', 'm-pending', 'm-syncing'])
  })
})

describe('offlineDb — per-user database scoping', () => {
  it('FE-DB-OFFLINE-020: reopenForUser switches to the user-scoped database', async () => {
    await reopenForUser(7)
    expect(offlineDb.name).toBe('trek-offline-u7')
    expect(offlineDb.isOpen()).toBe(true)
  })

  it('FE-DB-OFFLINE-021: one account cannot read another account\'s cached trips', async () => {
    await reopenForUser(7)
    await upsertTrip(buildTrip({ id: 500, title: 'Seven' }))

    await reopenForUser(8)
    expect(await offlineDb.trips.get(500)).toBeUndefined()

    await reopenForUser(7)
    expect((await offlineDb.trips.get(500))!.title).toBe('Seven')
  })

  it('FE-DB-OFFLINE-022: switching to the database already in use just reopens it', async () => {
    await reopenForUser(7)
    offlineDb.close()

    await reopenForUser(7)
    expect(offlineDb.name).toBe('trek-offline-u7')
    expect(offlineDb.isOpen()).toBe(true)
  })

  it('FE-DB-OFFLINE-023: deleteCurrentUserDb wipes the account data and returns to anonymous', async () => {
    await reopenForUser(9)
    await upsertTrip(buildTrip({ id: 501 }))

    await deleteCurrentUserDb()
    expect(offlineDb.name).toBe('trek-offline')

    await reopenForUser(9)
    expect(await offlineDb.trips.count()).toBe(0)
  })

  it('FE-DB-OFFLINE-024: deleteCurrentUserDb on the anonymous database is a no-op switch', async () => {
    await reopenAnonymous()
    await upsertTrip(buildTrip({ id: 502 }))

    await deleteCurrentUserDb()

    expect(offlineDb.name).toBe('trek-offline')
    expect(await offlineDb.trips.get(502)).toBeDefined()
  })
})

describe('offlineDb — connection proxy', () => {
  it('FE-DB-OFFLINE-028: reads and writes go to the connection that is live right now', async () => {
    const proxied = offlineDb as unknown as Record<string, unknown>
    proxied.__marker = 'anon'
    expect(proxied.__marker).toBe('anon')

    await reopenForUser(56)
    expect((offlineDb as unknown as Record<string, unknown>).__marker).toBeUndefined()
  })

  it('FE-DB-OFFLINE-029: upgrading a pre-v3 cache backfills tripId and bytes on blob rows', async () => {
    const legacy = new Dexie('trek-offline-u55')
    legacy.version(1).stores({
      trips: 'id',
      days: 'id, trip_id',
      places: 'id, trip_id',
      packingItems: 'id, trip_id',
      todoItems: 'id, trip_id',
      budgetItems: 'id, trip_id',
      reservations: 'id, trip_id',
      tripFiles: 'id, trip_id',
      mutationQueue: 'id, tripId, status, createdAt',
      syncMeta: 'tripId',
      blobCache: 'url, cachedAt',
    })
    legacy.version(2).stores({
      accommodations: 'id, trip_id',
      tripMembers: '[tripId+id], tripId',
      tags: 'id',
      categories: 'id',
    })
    await legacy.open()
    await legacy.table('blobCache').put({ url: '/legacy.pdf', blob: new Blob(['abc']), mime: 'application/pdf', cachedAt: 1 })
    legacy.close()

    await reopenForUser(55)

    const row = await offlineDb.blobCache.get('/legacy.pdf')
    expect(row!.tripId).toBe(-1)
    expect(typeof row!.bytes).toBe('number')
  })
})

describe('offlineDb — initial database name', () => {
  it('FE-DB-OFFLINE-025: boots straight into the persisted user\'s database', async () => {
    localStorage.setItem('trek_auth_snapshot', JSON.stringify({ state: { user: { id: 33 } } }))
    vi.resetModules()

    const mod = await import('./offlineDb')
    expect(mod.offlineDb.name).toBe('trek-offline-u33')
  })

  it('FE-DB-OFFLINE-026: falls back to the anonymous database without a snapshot', async () => {
    localStorage.removeItem('trek_auth_snapshot')
    vi.resetModules()

    const mod = await import('./offlineDb')
    expect(mod.offlineDb.name).toBe('trek-offline')
  })

  it('FE-DB-OFFLINE-027: a corrupt snapshot falls back to the anonymous database', async () => {
    localStorage.setItem('trek_auth_snapshot', 'not json')
    vi.resetModules()

    const mod = await import('./offlineDb')
    expect(mod.offlineDb.name).toBe('trek-offline')
  })
})
