// FE-REPO-TOUR-001 to FE-REPO-TOUR-014, FE-REPO-TOUR-042 to FE-REPO-TOUR-048
// Tours through the offline core: read-through to Dexie, offline create and
// edit written there and queued, and the online paths keeping the copy fresh.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { http, HttpResponse } from 'msw'
import type { TourCreateRequest, TourListItem } from '@trek/shared'
import { server } from '../../tests/helpers/msw/server'
import { tourRepo } from './tourRepo'
import { OnlineOnlyError } from './onlineOnly'
import { offlineDb, clearAll, replaceTripTours } from '../db/offlineDb'
import { buildPlace } from '../../tests/helpers/factories'
import { plannedTotalText, tourPlannedTimes } from '../components/Tours/tourPresentation'

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

describe('tourRepo.savedLine', () => {
  it('FE-REPO-TOUR-047: reads the line a tour was saved with from its cached place, never one of another trip (SKI-02)', async () => {
    setOnline(false)
    const line = JSON.stringify([[47, 11, 2000], [47.01, 11, 1500]])
    await offlineDb.places.put(buildPlace({ id: 40, trip_id: 3, route_geometry: line }))
    await offlineDb.places.put(buildPlace({ id: 41, trip_id: 3, route_geometry: null }))

    expect(await tourRepo.savedLine(3, 40)).toBe(line)
    expect(await tourRepo.savedLine(4, 40)).toBeNull()
    expect(await tourRepo.savedLine(3, 41)).toBeNull()
    expect(await tourRepo.savedLine(3, 99)).toBeNull()
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

  it('FE-REPO-TOUR-042: offline, a planned ski tour shows its discipline at once, a technique for cross-country only, and another type drops both (SKI-02)', async () => {
    setOnline(false)
    await offlineDb.tours.put({ ...tour(), trip_id: 3 })
    const ski = { ...body, tour_type: 'ski' as const, max_hiking_difficulty: null, duration_seconds: null }

    expect((await tourRepo.update(3, 40, { ...ski, ski_discipline: 'snowshoe' })).tour).toMatchObject({ tour_type: 'ski', ski_discipline: 'snowshoe', ski_technique: null })
    const skating = { ...ski, ski_discipline: 'cross_country' as const, ski_technique: 'skating' as const }
    expect((await tourRepo.update(3, 40, skating)).tour).toMatchObject({ ski_discipline: 'cross_country', ski_technique: 'skating' })
    expect((await tourRepo.update(3, 40, { ...skating, ski_discipline: 'touring' })).tour.ski_technique).toBeNull()
    expect((await tourRepo.update(3, 40, body)).tour).toMatchObject({ tour_type: 'hike', ski_discipline: null, ski_technique: null })
    expect(await offlineDb.tours.get(40)).toMatchObject({ ski_discipline: null, ski_technique: null })
    expect(await offlineDb.tours.get(40)).not.toHaveProperty('winter_activity')
  })

  it('FE-REPO-TOUR-043: offline, a run shows its profile, pace and planned time at once, and another type drops them (RUN-01)', async () => {
    setOnline(false)
    await offlineDb.tours.put({ ...tour(), trip_id: 3 })
    const run = {
      ...body,
      tour_type: 'run' as const,
      run_profile: 'running' as const,
      run_pace_seconds_per_km: 360,
      max_hiking_difficulty: null,
      duration_seconds: 48 * 60,
    }

    expect((await tourRepo.update(3, 40, run)).tour).toMatchObject({
      tour_type: 'run',
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
      duration: 48,
    })
    expect((await tourRepo.update(3, 40, body)).tour).toMatchObject({ run_profile: null, run_pace_seconds_per_km: null })
    expect(await offlineDb.tours.get(40)).toMatchObject({ run_profile: null, run_pace_seconds_per_km: null })
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

describe('tourRepo offline copies of a city walk (CW-02)', () => {
  // 45 minutes of walking, a museum stayed at for 90 minutes, a shaping point and a cafe nobody entered a stay for yet.
  const walkBody: TourCreateRequest = {
    name: 'Old town',
    tour_type: 'walk',
    route_geometry: [[48.1, 11.5, 520], [48.11, 11.51, 521], [48.12, 11.52, 522]],
    waypoints: [
      { lat: 48.1, lng: 11.5, role: 'start', sequence: 0, name: 'Museum', stay_minutes: 90 },
      { lat: 48.11, lng: 11.51, role: 'via', sequence: 1, shaping: true },
      { lat: 48.12, lng: 11.52, role: 'end', sequence: 2, name: 'Cafe', stay_minutes: null },
    ],
    max_hiking_difficulty: null,
    duration_seconds: 2700,
  }
  const noTranslation = (key: string) => key

  it('FE-REPO-TOUR-015: offline, a new walk carries its stops and stays, so the day row reads at least walking plus the stays entered', async () => {
    setOnline(false)

    const { tour: walk } = await tourRepo.create(3, walkBody)
    const { tour: hike } = await tourRepo.create(3, body)

    expect(walk).toMatchObject({ duration: 45, station_count: 2, station_stay_minutes: 90, station_stays_unknown: 1 })
    expect(await offlineDb.tours.get(walk.place_id)).toMatchObject({ station_stay_minutes: 90, station_stays_unknown: 1 })
    expect(plannedTotalText(tourPlannedTimes(walk), noTranslation, true)).toBe('≥ 2 h 15 min')
    expect(hike).toMatchObject({ station_count: null, station_stay_minutes: null, station_stays_unknown: null })
  })

  it('FE-REPO-TOUR-016: offline, a stay changed while the write waits shows at once, not the stays of the last answer', async () => {
    setOnline(false)
    await offlineDb.tours.put({
      ...tour({ tour_type: 'walk', duration: 45, station_count: 2, station_stay_minutes: 120, station_stays_unknown: 0 }),
      trip_id: 3,
    })
    const [museum, steer, cafe] = walkBody.waypoints
    const edited = { ...walkBody, waypoints: [{ ...museum, stay_minutes: 30 }, steer, cafe] }

    const { tour: walk } = await tourRepo.update(3, 40, edited)

    expect(walk).toMatchObject({ station_count: 2, station_stay_minutes: 30, station_stays_unknown: 1 })
    expect(await offlineDb.tours.get(40)).toMatchObject({ station_stay_minutes: 30, station_stays_unknown: 1 })
    expect(plannedTotalText(tourPlannedTimes(walk), noTranslation, true)).toBe('≥ 1 h 15 min')
  })
})

describe('tourRepo writes and the revision (P2C-03)', () => {
  it('FE-REPO-TOUR-030: online, the revision the draft was based on goes along; queued, it stays behind', async () => {
    let sentBody: Record<string, unknown> | null = null
    server.use(http.put('/api/trips/3/tours/40', async ({ request }) => {
      sentBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ tour: tour({ revision: 5 }), waypoints: body.waypoints })
    }))
    const online = await tourRepo.update(3, 40, { ...body, expected_revision: 4 })
    expect(sentBody).toMatchObject({ expected_revision: 4 })
    expect(online.tour.revision).toBe(5)

    setOnline(false)
    await tourRepo.update(3, 40, { ...body, expected_revision: 5 })
    await offlineDb.tours.put({ ...tour({ tour_type: 'kayak', has_waypoints: false }), trip_id: 3 })
    await tourRepo.updatePaddlePlan(3, 40, { paddle_speed_kmh: 4, portage_speed_kmh: null, track_marks: { portages: [], locks: [] }, expected_revision: 5 })
    const queued = await offlineDb.mutationQueue.toArray()
    expect(queued).toHaveLength(2)
    for (const mutation of queued) expect(mutation.body).not.toHaveProperty('expected_revision')
  })
})

describe('tourRepo.classifySki (SKI-02)', () => {
  const skiTour = (overrides: Partial<TourListItem> = {}) =>
    tour({ tour_type: 'ski', has_waypoints: false, duration: null, max_hiking_difficulty: null, ski_discipline: 'cross_country', ski_technique: 'unknown', ...overrides })

  it('FE-REPO-TOUR-044: online, the classification goes to the server with its revision and the answer is cached', async () => {
    let sentBody: Record<string, unknown> | null = null
    server.use(http.put('/api/trips/3/tours/40/ski', async ({ request }) => {
      sentBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ tour: skiTour({ ski_technique: 'skating', revision: 2 }), waypoints: [] })
    }))

    const result = await tourRepo.classifySki(3, 40, { ski_discipline: 'cross_country', ski_technique: 'skating', expected_revision: 1 })

    expect(sentBody).toEqual({ ski_discipline: 'cross_country', ski_technique: 'skating', expected_revision: 1 })
    expect(result.tour).toMatchObject({ ski_technique: 'skating', revision: 2 })
    expect(await offlineDb.tours.get(40)).toMatchObject({ trip_id: 3, ski_technique: 'skating' })
  })

  it('FE-REPO-TOUR-045: offline, the cached track takes the classification at once and the write waits without its revision', async () => {
    setOnline(false)
    const provenance = {
      origin: 'gpx' as const,
      createdAt: '2027-02-01 09:00:00',
      source: { kind: 'gpx' as const, fileName: 'hut.gpx' },
      derivedFrom: null,
      plannedOver: false,
      editedLocally: null,
    }
    await offlineDb.tours.put({ ...skiTour(), trip_id: 3, provenance })

    const result = await tourRepo.classifySki(3, 40, { ski_discipline: 'alpine', expected_revision: 1 })

    expect(result.tour).toMatchObject({ ski_discipline: 'alpine', ski_technique: null, distance: 8 })
    expect(result.provenance).toEqual(provenance)
    expect(await offlineDb.tours.get(40)).toMatchObject({ ski_discipline: 'alpine', ski_technique: null })
    const [mutation] = await offlineDb.mutationQueue.toArray()
    expect(mutation).toMatchObject({ method: 'PUT', url: '/trips/3/tours/40/ski', resource: 'tours', entityId: 40 })
    expect(mutation.body).toEqual({ ski_discipline: 'alpine' })
    await expect(tourRepo.classifySki(3, 99, { ski_discipline: 'alpine' })).rejects.toThrow('Tour not available offline')
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

describe('tourRepo provenance and copies (P2C-02, P2C-07)', () => {
  const provenance = {
    origin: 'gpx' as const,
    createdAt: '2026-07-01 10:00:00',
    source: { kind: 'gpx' as const, fileName: 'ridge.gpx' },
    derivedFrom: null,
    plannedOver: false,
    editedLocally: null,
  }

  it('FE-REPO-TOUR-020: the detail caches where the tour came from, offline gives it back, and a list refresh keeps it', async () => {
    server.use(http.get('/api/trips/3/tours/40', () => HttpResponse.json({ tour: tour(), waypoints: body.waypoints, provenance })))
    await tourRepo.detail(3, 40)
    expect((await offlineDb.tours.get(40))?.provenance).toEqual(provenance)

    await replaceTripTours(3, [tour({ name: 'Renamed' })])
    expect((await offlineDb.tours.get(40))?.provenance).toEqual(provenance)

    setOnline(false)
    const offline = await tourRepo.detail(3, 40)
    expect(offline.provenance).toEqual(provenance)
    // The list item handed out carries none of the cache's own fields.
    expect(offline.tour).not.toHaveProperty('provenance')
  })

  it('FE-REPO-TOUR-022: an actual track is linked and unlinked on the server, and the detail keeps it offline (ACT-01)', async () => {
    const activity = {
      id: 5, assignment_id: null, day_id: null, assigned_at: null,
      track: { place_id: 41, name: 'Watch', origin: 'gpx', file_name: 'watch.gpx', imported_at: null },
      metrics: { distance_km: 2, elevation_gain_m: null, elevation_loss_m: null, started_at: null, ended_at: null, elapsed_minutes: null, point_count: 2 },
      geometry: [[47, 11], [47.01, 11]],
    }
    let sent: unknown = null
    server.use(
      http.put('/api/trips/3/tours/40/activities', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ tour: tour({ activity_tracks: [{ id: 5, track_place_id: 41, assignment_id: null }] }), waypoints: body.waypoints, activities: [activity] })
      }),
      http.delete('/api/trips/3/tours/40/activities/5', () => HttpResponse.json({ tour: tour(), waypoints: body.waypoints, activities: [] })),
    )
    const linked = await tourRepo.assignActivity(3, 40, { track_place_id: 41, assignment_id: null })
    expect(sent).toEqual({ track_place_id: 41, assignment_id: null })
    expect(linked.activities).toHaveLength(1)
    expect((await offlineDb.tours.get(40))?.activities).toEqual([activity])

    // A list naming the same tracks keeps them; offline the detail answers them, the list item stays without them.
    await replaceTripTours(3, [tour({ activity_tracks: [{ id: 5, track_place_id: 41, assignment_id: null }] })])
    setOnline(false)
    const offline = await tourRepo.detail(3, 40)
    expect(offline.activities).toEqual([activity])
    expect(offline.tour).not.toHaveProperty('activities')
    setOnline(true)

    // A list naming other tracks drops the stale copy.
    await replaceTripTours(3, [tour({ activity_tracks: [] })])
    expect((await offlineDb.tours.get(40))?.activities).toBeUndefined()

    const unlinked = await tourRepo.unassignActivity(3, 40, 5)
    expect(unlinked.activities).toEqual([])
    expect((await offlineDb.tours.get(40))?.activities).toEqual([])
  })

  it('FE-REPO-TOUR-046: an actual track is not changed offline, behind a queued write or on a tour the server has not got, and its answer touches only the recordings (ACT-01)', async () => {
    let sent = 0
    server.use(
      http.put('/api/trips/3/tours/40/activities', () => {
        sent++
        return HttpResponse.json({ tour: tour({ name: 'Old name', activity_tracks: [{ id: 5, track_place_id: 41, assignment_id: null }] }), waypoints: [], activities: [] })
      }),
      http.delete('/api/trips/3/tours/40/activities/5', () => { sent++; return HttpResponse.json({ tour: tour(), waypoints: [], activities: [] }) }),
    )
    const link = { track_place_id: 41, assignment_id: null }

    setOnline(false)
    await expect(tourRepo.assignActivity(3, 40, link)).rejects.toBeInstanceOf(OnlineOnlyError)
    await expect(tourRepo.unassignActivity(3, 40, 5)).rejects.toBeInstanceOf(OnlineOnlyError)
    setOnline(true)

    await expect(tourRepo.assignActivity(3, -7, link)).rejects.toBeInstanceOf(OnlineOnlyError)

    await offlineDb.tours.put({ ...tour({ name: 'Edited here' }), trip_id: 3 })
    await offlineDb.mutationQueue.put({
      id: 'queued-tour', tripId: 3, method: 'PUT', url: '/trips/3/tours/40', body, createdAt: 1,
      status: 'pending', attempts: 0, lastError: null, resource: 'tours', entityId: 40,
    })
    await expect(tourRepo.assignActivity(3, 40, link)).rejects.toBeInstanceOf(OnlineOnlyError)
    expect(sent).toBe(0)
    await offlineDb.mutationQueue.clear()

    // Once nothing waits, the change goes out and the cached tour takes its recordings in, its own edits kept.
    await tourRepo.assignActivity(3, 40, link)
    expect(sent).toBe(1)
    const cached = await offlineDb.tours.get(40)
    expect(cached?.name).toBe('Edited here')
    expect(cached?.activities).toEqual([])
    expect(cached?.activity_tracks).toEqual([{ id: 5, track_place_id: 41, assignment_id: null }])
  })

  it('FE-REPO-TOUR-048: the restore of a recorded track and a copy wait for a queued edit of the tour, and go out neither offline nor for a tour the server has not got', async () => {
    let sent = 0
    server.use(
      http.post('/api/trips/3/tours/40/restore-recorded', () => {
        sent++
        return HttpResponse.json({ tour: tour({ name: 'Recorded', has_waypoints: false }), waypoints: [] })
      }),
      http.post('/api/trips/3/tours/40/copy', () => {
        sent++
        return HttpResponse.json({ tour: tour({ place_id: 41, name: 'Ridge walk (copy)' }), waypoints: [] }, { status: 201 })
      }),
    )
    // An edit made here offline whose replay failed and waits: it would plan the restored track over again.
    await offlineDb.tours.put({ ...tour({ name: 'Edited here' }), trip_id: 3 })
    await offlineDb.mutationQueue.put({
      id: 'queued-tour', tripId: 3, method: 'PUT', url: '/trips/3/tours/40', body, createdAt: 1,
      status: 'failed', attempts: 3, lastError: 'Server error', resource: 'tours', entityId: 40,
    })
    await expect(tourRepo.restoreRecorded(3, 40)).rejects.toBeInstanceOf(OnlineOnlyError)
    await expect(tourRepo.copy(3, 40, 'Ridge walk (copy)')).rejects.toBeInstanceOf(OnlineOnlyError)
    expect(sent).toBe(0)
    expect((await offlineDb.tours.get(40))?.name).toBe('Edited here')
    await offlineDb.mutationQueue.clear()

    setOnline(false)
    await expect(tourRepo.restoreRecorded(3, 40)).rejects.toBeInstanceOf(OnlineOnlyError)
    await expect(tourRepo.copy(3, 40, 'Ridge walk (copy)')).rejects.toBeInstanceOf(OnlineOnlyError)
    setOnline(true)
    await expect(tourRepo.copy(3, -7, 'Draft (copy)')).rejects.toBeInstanceOf(OnlineOnlyError)
    expect(sent).toBe(0)

    // Once nothing waits, the restore goes out and the cache takes the restored tour in.
    await tourRepo.restoreRecorded(3, 40)
    expect(sent).toBe(1)
    expect(await offlineDb.tours.get(40)).toMatchObject({ name: 'Recorded', has_waypoints: false })
  })

  it('FE-REPO-TOUR-021: a copy is asked of the server under its name and cached as a tour of the trip', async () => {
    let sent: unknown = null
    server.use(http.post('/api/trips/3/tours/40/copy', async ({ request }) => {
      sent = await request.json()
      return HttpResponse.json({ tour: tour({ place_id: 41, name: 'Ridge walk (copy)', derived_from_place_id: 40 }), waypoints: body.waypoints }, { status: 201 })
    }))
    const result = await tourRepo.copy(3, 40, 'Ridge walk (copy)')
    expect(sent).toEqual({ name: 'Ridge walk (copy)' })
    expect(result.tour.place_id).toBe(41)
    expect(await offlineDb.tours.get(41)).toMatchObject({ trip_id: 3, derived_from_place_id: 40, waypoints: body.waypoints })
  })
})

