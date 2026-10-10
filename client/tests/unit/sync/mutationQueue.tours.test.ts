/**
 * mutationQueue replay of offline tour writes: a tour is a place plus its
 * facet, so a create moves both from the temporary id to the real one, points
 * queued edits at it, and a refused create takes both back out.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import type { TourCreateRequest, TourListItem } from '@trek/shared'
import { server } from '../../helpers/msw/server'
import { setAuthed } from '../../../src/sync/authGate'
import { mutationQueue } from '../../../src/sync/mutationQueue'
import { offlineDb, clearAll } from '../../../src/db/offlineDb'
import { tourRepo } from '../../../src/repo/tourRepo'
import { placeRepo } from '../../../src/repo/placeRepo'

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true })
}

const body: TourCreateRequest = {
  name: 'Lake loop',
  tour_type: 'hike',
  route_geometry: [[47, 11, 1000], [47.02, 11, 1050]],
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: null,
}

function savedTour(placeId: number, name = 'Lake loop'): TourListItem {
  return {
    place_id: placeId, name, tour_type: 'hike', distance: 2.2, elevation_gain: 50, elevation_loss: 0, duration: null,
    difficulty: null, wanderer_ref: null, match_confidence: 1, max_hiking_difficulty: 2, planned: false, caution: false,
    has_waypoints: true,
  }
}

beforeEach(async () => {
  await clearAll()
  mutationQueue._resetFlushing()
  setAuthed(true)
  setOnline(false)
})

afterEach(() => {
  vi.restoreAllMocks()
  setAuthed(false)
  setOnline(true)
})

describe('mutationQueue.flush — tours', () => {
  it('FE-SYNC-TOUR-001: a replayed create moves place and facet to the real id and aims the queued edit at it', async () => {
    const { tour } = await tourRepo.create(3, body)
    const tempId = tour.place_id
    await tourRepo.update(3, tempId, { ...body, name: 'Renamed' })
    const puts: string[] = []
    server.use(
      http.post('/api/trips/3/tours', () => HttpResponse.json({ tour: savedTour(501), waypoints: body.waypoints })),
      http.put('/api/trips/3/tours/:id', ({ params }) => {
        puts.push(String(params.id))
        return HttpResponse.json({ tour: savedTour(501, 'Renamed'), waypoints: body.waypoints })
      }),
    )
    setOnline(true)

    await mutationQueue.flush()

    expect(puts).toEqual(['501'])
    expect(await offlineDb.mutationQueue.count()).toBe(0)
    expect(await offlineDb.tours.get(tempId)).toBeUndefined()
    expect(await offlineDb.places.get(tempId)).toBeUndefined()
    expect(await offlineDb.tours.get(501)).toMatchObject({ trip_id: 3, name: 'Renamed', waypoints: body.waypoints })
    // The server built its place from the same route; it stays on the map until the next list.
    expect(await offlineDb.places.get(501)).toMatchObject({ trip_id: 3, name: 'Renamed' })
  })

  it('FE-SYNC-TOUR-002: a create the server refuses takes its place and facet back out', async () => {
    const { tour } = await tourRepo.create(3, body)
    server.use(http.post('/api/trips/3/tours', () => HttpResponse.json({ error: 'Tour type is not available' }, { status: 400 })))
    setOnline(true)

    await mutationQueue.flush()

    expect(await offlineDb.tours.get(tour.place_id)).toBeUndefined()
    expect(await offlineDb.places.get(tour.place_id)).toBeUndefined()
    expect((await offlineDb.mutationQueue.toArray())[0]).toMatchObject({ status: 'failed' })
  })

  it('FE-SYNC-TOUR-003: deleting a tour offline drops its facet with the place', async () => {
    await offlineDb.tours.put({ ...savedTour(40), trip_id: 3 })

    await placeRepo.delete(3, 40)
    await offlineDb.tours.put({ ...savedTour(41), trip_id: 3 })
    await placeRepo.deleteMany(3, [41])

    expect(await offlineDb.tours.count()).toBe(0)
  })
})
