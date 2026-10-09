// FE-REPO-TOUR-001 to FE-REPO-TOUR-014
// Tours through the offline core: read-through to Dexie, offline create and
// edit written there and queued, and the online paths keeping the copy fresh.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import type { TourCreateRequest, TourListItem } from '@trek/shared'
import { server } from '../../tests/helpers/msw/server'
import { tourRepo } from './tourRepo'
import { offlineDb, clearAll, replaceTripTours } from '../db/offlineDb'
import { buildPlace } from '../../tests/helpers/factories'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
}

function tour(overrides: Partial<TourListItem> = {}): TourListItem {
  return {
    place_id: 40, name: 'Ridge walk', tour_type: 'hike', distance: 8, elevation_gain: 600, elevation_loss: 600,
    duration: 180, difficulty: null, wanderer_ref: null, match_confidence: 1, max_hiking_difficulty: 2,
    planned: false, caution: false, has_waypoints: true, ...overrides,
  }
}

const body: TourCreateRequest = {
  name: 'Lake loop',
  description: 'A quiet loop above the lake',
  website: 'https://www.komoot.com/tour/42',
  tour_type: 'hike',
  route_geometry: [[47, 11, 1000], [47.01, 11, 1100], [47.02, 11, 1050]],
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 3,
  duration_seconds: 5430,
  planned_duration_minutes: 95,
  break_additional_minutes: 35,
}

beforeEach(async () => {
  await clearAll()
  setOnline(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  setOnline(true)
})

describe('tourRepo.list', () => {
  it('FE-REPO-TOUR-001: online, the answer replaces the trip\'s cached tours', async () => {
    await offlineDb.tours.put({ ...tour({ place_id: 41 }), trip_id: 3 })
    server.use(http.get('/api/trips/3/tours', () => HttpResponse.json({ tours: [tour()] })))

    const result = await tourRepo.list(3)

    expect(result.tours.map(t => t.place_id)).toEqual([40])
    await vi.waitFor(async () => expect((await offlineDb.tours.toArray()).map(t => t.place_id)).toEqual([40]))
    expect((await offlineDb.tours.get(40))!.trip_id).toBe(3)
  })

  it('FE-REPO-TOUR-002: offline, the cached tours come back newest first, unsynced ones on top, without cache-only fields', async () => {
    setOnline(false)
    await offlineDb.tours.bulkPut([
      { ...tour({ place_id: 10 }), trip_id: 3 },
      { ...tour({ place_id: 12 }), trip_id: 3, waypoints: body.waypoints },
      { ...tour({ place_id: -7 }), trip_id: 3 },
      { ...tour({ place_id: 11 }), trip_id: 4 },
    ])

    const { tours } = await tourRepo.list('3')

    expect(tours.map(t => t.place_id)).toEqual([-7, 12, 10])
    expect(tours[1]).not.toHaveProperty('trip_id')
    expect(tours[1]).not.toHaveProperty('waypoints')
  })
})

describe('tourRepo.detail', () => {
  it('FE-REPO-TOUR-003: online, the control points are cached with the tour', async () => {
    server.use(http.get('/api/trips/3/tours/40', () => HttpResponse.json({ tour: tour(), waypoints: body.waypoints })))

    await tourRepo.detail(3, 40)

    expect((await offlineDb.tours.get(40))).toMatchObject({ trip_id: 3, waypoints: body.waypoints })
  })

  it('FE-REPO-TOUR-004: offline, a tour opens from its cached control points', async () => {
    setOnline(false)
    await offlineDb.tours.put({ ...tour(), trip_id: 3, waypoints: body.waypoints })

    const result = await tourRepo.detail(3, 40)

    expect(result.waypoints).toEqual(body.waypoints)
    expect(result.tour).toEqual(tour())
  })

  it('FE-REPO-TOUR-005: offline without control points, the route\'s ends stand in, like the server does for GPX tours', async () => {
    setOnline(false)
    await offlineDb.tours.put({ ...tour({ has_waypoints: false }), trip_id: 3 })
    await offlineDb.places.put(buildPlace({ id: 40, trip_id: 3, route_geometry: JSON.stringify([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) }))

    const { waypoints } = await tourRepo.detail(3, 40)

    expect(waypoints).toEqual([
      { lat: 1, lng: 2, role: 'start', sequence: 0 },
      { lat: 7, lng: 8, role: 'end', sequence: 1 },
    ])
  })

  it('FE-REPO-TOUR-006: offline, a tour of another trip or one never cached is not invented', async () => {
    setOnline(false)
    await offlineDb.tours.put({ ...tour(), trip_id: 4 })

    await expect(tourRepo.detail(3, 40)).rejects.toThrow('Tour not available offline')
    await expect(tourRepo.detail(3, 99)).rejects.toThrow('Tour not available offline')
  })

  it('FE-REPO-TOUR-007: an aborted request is passed on, not answered from the cache', async () => {
    await offlineDb.tours.put({ ...tour(), trip_id: 3, waypoints: body.waypoints })
    server.use(http.get('/api/trips/3/tours/40', () => HttpResponse.json({ tour: tour(), waypoints: body.waypoints })))
    const controller = new AbortController()
    controller.abort()

    await expect(tourRepo.detail(3, 40, controller.signal)).rejects.toThrow()
  })
})

describe('tourRepo.create', () => {
  it('FE-REPO-TOUR-008: offline, place and facet share one temp id, the metrics match the server\'s, and a POST is queued', async () => {
    setOnline(false)

    const result = await tourRepo.create(3, body)
    const id = result.tour.place_id

    expect(id).toBeLessThan(0)
    expect(result.waypoints).toEqual(body.waypoints)
    expect(result.tour).toMatchObject({ name: 'Lake loop', elevation_gain: 100, elevation_loss: 50, duration: 91, planned_duration_minutes: 95, break_additional_minutes: 35, max_hiking_difficulty: 3, has_waypoints: true, planned: false })
    expect(result.tour).toMatchObject({ description: 'A quiet loop above the lake', website: 'https://www.komoot.com/tour/42' })
    expect(result.tour.distance).toBeGreaterThan(2)
    expect(await offlineDb.places.get(id)).toMatchObject({ trip_id: 3, name: 'Lake loop', description: body.description, website: body.website, lat: 47, lng: 11, route_geometry: JSON.stringify(body.route_geometry) })
    expect(await offlineDb.tours.get(id)).toMatchObject({ trip_id: 3, waypoints: body.waypoints })

    const [mutation] = await offlineDb.mutationQueue.toArray()
    expect(mutation).toMatchObject({ method: 'POST', url: '/trips/3/tours', resource: 'tours', tempId: id, body })
  })

  it('FE-REPO-TOUR-009: online, the saved tour is cached with its control points', async () => {
    server.use(http.post('/api/trips/3/tours', () => HttpResponse.json({ tour: tour({ place_id: 77 }), waypoints: body.waypoints })))

    const result = await tourRepo.create(3, body)

    expect(result.tour.place_id).toBe(77)
    expect(await offlineDb.tours.get(77)).toMatchObject({ trip_id: 3, waypoints: body.waypoints })
    expect(await offlineDb.mutationQueue.count()).toBe(0)
  })
})

describe('tourRepo.update', () => {
  it('FE-REPO-TOUR-010: offline, the cached tour and its place take the new route, and a PUT is queued', async () => {
    setOnline(false)
    await offlineDb.tours.put({ ...tour({ planned: true }), trip_id: 3 })
    await offlineDb.places.put(buildPlace({ id: 40, trip_id: 3, name: 'Ridge walk', notes: 'keep me' }))

    const result = await tourRepo.update(3, 40, body)

    expect(result.tour).toMatchObject({ place_id: 40, name: 'Lake loop', planned: true, elevation_gain: 100 })
    expect(result.tour).toMatchObject({ description: body.description, website: body.website })
    expect(await offlineDb.places.get(40)).toMatchObject({ name: 'Lake loop', description: body.description, website: body.website, notes: 'keep me', lat: 47 })
    const [mutation] = await offlineDb.mutationQueue.toArray()
    expect(mutation).toMatchObject({ method: 'PUT', url: '/trips/3/tours/40', resource: 'tours', entityId: 40 })
    expect(mutation.tempEntityId).toBeUndefined()
  })

  it('FE-REPO-TOUR-011: offline, an edit of a tour that has not synced waits for its id', async () => {
    setOnline(false)
    const created = await tourRepo.create(3, body)

    await tourRepo.update(3, created.tour.place_id, { ...body, name: 'Renamed' })

    const queued = (await offlineDb.mutationQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt)
    expect(queued[1]).toMatchObject({ url: '/trips/3/tours/{id}', tempEntityId: created.tour.place_id })
  })

  it('RS-01: offline route edits that omit old metadata preserve cached description and website', async () => {
    setOnline(false)
    await offlineDb.tours.put({ ...tour({ description: 'Keep description', website: 'https://example.org/old', planned_duration_minutes: 95, break_additional_minutes: 35 }), trip_id: 3 })
    await offlineDb.places.put(buildPlace({ id: 40, trip_id: 3, description: 'Keep description', website: 'https://example.org/old' }))
    const { description: _description, website: _website, planned_duration_minutes: _planned, break_additional_minutes: _breaks, ...legacyBody } = body

    const result = await tourRepo.update(3, 40, legacyBody)

    expect(result.tour).toMatchObject({ description: 'Keep description', website: 'https://example.org/old', planned_duration_minutes: 95, break_additional_minutes: 35 })
    expect(await offlineDb.places.get(40)).toMatchObject({ description: 'Keep description', website: 'https://example.org/old' })
  })

  it('FE-REPO-TOUR-012: online edits and GPX imports refresh the cache', async () => {
    server.use(
      http.put('/api/trips/3/tours/40', () => HttpResponse.json({ tour: tour({ name: 'Edited' }), waypoints: body.waypoints })),
      http.post('/api/trips/3/tours/import/gpx', () => HttpResponse.json({ tours: [tour({ place_id: 50 })], caution: false, skipped: 0 })),
    )

    await tourRepo.update(3, 40, body)
    await tourRepo.importGpx(3, new File(['<gpx/>'], 'a.gpx'))

    expect(await offlineDb.tours.get(40)).toMatchObject({ name: 'Edited', waypoints: body.waypoints })
    expect(await offlineDb.tours.get(50)).toMatchObject({ trip_id: 3 })
  })

  it('FE-REPO-TOUR-014: online, an edit of a tour with an older write parked waits behind it in the queue', async () => {
    await offlineDb.tours.put({ ...tour(), trip_id: 3 })
    await offlineDb.mutationQueue.put({
      id: 'parked-tour', tripId: 3, method: 'PUT', url: '/trips/3/tours/40', body, createdAt: 1,
      status: 'failed', attempts: 8, lastError: 'boom', resource: 'tours', entityId: 40,
    })
    let sent = 0
    server.use(http.put('/api/trips/3/tours/40', () => { sent++; return HttpResponse.json({ tour: tour(), waypoints: body.waypoints }) }))

    const result = await tourRepo.update(3, 40, { ...body, name: 'Renamed' })

    expect(result.tour.name).toBe('Renamed')
    expect(sent).toBe(0)
    expect((await offlineDb.mutationQueue.toArray()).map(m => m.status).sort()).toEqual(['failed', 'pending'])
  })
})

describe('replaceTripTours', () => {
  it('FE-REPO-TOUR-013: keeps control points only while the route reads the same, drops what the server no longer lists, keeps unsynced tours', async () => {
    await offlineDb.tours.bulkPut([
      { ...tour({ place_id: 1 }), trip_id: 3, waypoints: body.waypoints },
      { ...tour({ place_id: 2 }), trip_id: 3, waypoints: body.waypoints },
      { ...tour({ place_id: 3 }), trip_id: 3 },
      { ...tour({ place_id: -4 }), trip_id: 3 },
      { ...tour({ place_id: 5 }), trip_id: 9 },
    ])

    await replaceTripTours(3, [tour({ place_id: 1 }), tour({ place_id: 2, distance: 99 })])

    const rows = await offlineDb.tours.orderBy('place_id').toArray()
    expect(rows.map(r => r.place_id)).toEqual([-4, 1, 2, 5])
    expect(rows.find(r => r.place_id === 1)!.waypoints).toEqual(body.waypoints)
    expect(rows.find(r => r.place_id === 2)!.waypoints).toBeUndefined()
  })
})
