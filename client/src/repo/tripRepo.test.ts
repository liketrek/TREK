// FE-REPO-TRIP-001 to FE-REPO-TRIP-007
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import { server } from '../../tests/helpers/msw/server'
import { tripRepo } from './tripRepo'
import { offlineDb, clearAll } from '../db/offlineDb'
import { buildTrip } from '../../tests/helpers/factories'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
}

beforeEach(async () => {
  await clearAll()
  setOnline(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('tripRepo.list', () => {
  it('FE-REPO-TRIP-001: online — merges active + archived and caches both in Dexie', async () => {
    const active = buildTrip({ title: 'Lisbon' })
    const archived = buildTrip({ title: 'Old Trip', is_archived: 1 })
    server.use(
      http.get('/api/trips', ({ request }) => {
        const isArchived = new URL(request.url).searchParams.get('archived')
        return HttpResponse.json({ trips: isArchived ? [archived] : [active] })
      }),
    )

    const result = await tripRepo.list()
    expect(result.trips.map(t => t.title)).toEqual(['Lisbon'])
    expect(result.archivedTrips.map(t => t.title)).toEqual(['Old Trip'])

    await new Promise(r => setTimeout(r, 0))
    expect(await offlineDb.trips.get(active.id)).toBeDefined()
    expect(await offlineDb.trips.get(archived.id)).toBeDefined()
  })

  it('FE-REPO-TRIP-002: offline — splits the Dexie cache by is_archived', async () => {
    await offlineDb.trips.bulkPut([
      buildTrip({ id: 71, is_archived: 0 }),
      buildTrip({ id: 72, is_archived: 1 }),
    ])
    setOnline(false)

    let restCalled = false
    server.use(http.get('/api/trips', () => { restCalled = true; return HttpResponse.json({ trips: [] }) }))

    const result = await tripRepo.list()
    expect(result.trips.map(t => t.id)).toEqual([71])
    expect(result.archivedTrips.map(t => t.id)).toEqual([72])
    expect(restCalled).toBe(false)
  })

  it('FE-REPO-TRIP-003: rethrows a server error instead of falling back to the cache', async () => {
    await offlineDb.trips.put(buildTrip({ id: 73 }))
    server.use(http.get('/api/trips', () => HttpResponse.json({ error: 'boom' }, { status: 500 })))

    await expect(tripRepo.list()).rejects.toThrow()
  })
})

describe('tripRepo.get', () => {
  it('FE-REPO-TRIP-004: online — returns the trip and caches it', async () => {
    const trip = buildTrip({ id: 80, title: 'Kyoto' })
    server.use(http.get('/api/trips/80', () => HttpResponse.json({ trip })))

    const result = await tripRepo.get(80)
    expect(result.trip.title).toBe('Kyoto')

    await new Promise(r => setTimeout(r, 0))
    expect((await offlineDb.trips.get(80))!.title).toBe('Kyoto')
  })

  it('FE-REPO-TRIP-005: offline — serves the cached trip', async () => {
    await offlineDb.trips.put(buildTrip({ id: 81, title: 'Cached' }))
    setOnline(false)

    const result = await tripRepo.get('81')
    expect(result.trip.title).toBe('Cached')
  })

  it('FE-REPO-TRIP-006: offline with nothing cached — throws so the caller can show an error', async () => {
    setOnline(false)
    await expect(tripRepo.get(999)).rejects.toThrow('No cached trip data available offline')
  })

  it('FE-REPO-TRIP-007: network-level failure falls back to the cache (captive portal)', async () => {
    await offlineDb.trips.put(buildTrip({ id: 82, title: 'Fallback' }))
    server.use(http.get('/api/trips/82', () => HttpResponse.error()))

    const result = await tripRepo.get(82)
    expect(result.trip.title).toBe('Fallback')
  })
})
