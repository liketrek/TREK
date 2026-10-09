import { computeTourMetrics, type GeometryPoint, type TourCreateRequest, type TourCreateResponse, type TourDetailResponse, type TourImportGpxResponse, type TourListItem, type TourWaypoint } from '@trek/shared'
import { toursApi } from '../api/client'
import { offlineDb, replaceTripTours, type CachedTour } from '../db/offlineDb'
import { mutationQueue, generateUUID, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { Place } from '../types'

/** The list item a cached row stands for: the cache-only fields stripped. */
function toListItem({ trip_id: _tripId, waypoints: _waypoints, ...tour }: CachedTour): TourListItem {
  return tour
}

/** Newest first, as the server lists them: offline creates (negative ids) on top. */
function newestFirst(a: CachedTour, b: CachedTour): number {
  if ((a.place_id < 0) !== (b.place_id < 0)) return a.place_id < 0 ? -1 : 1
  return a.place_id < 0 ? a.place_id - b.place_id : b.place_id - a.place_id
}

/** A route's first and last point as start and end controls, the server's fallback for GPX tours. */
function endpointsOf(routeGeometry: unknown): TourWaypoint[] {
  let points: unknown
  try { points = typeof routeGeometry === 'string' ? JSON.parse(routeGeometry) : routeGeometry } catch { return [] }
  if (!Array.isArray(points) || points.length < 2) return []
  const start = points[0] as number[]
  const end = points[points.length - 1] as number[]
  return [
    { lat: start[0], lng: start[1], role: 'start', sequence: 0 },
    { lat: end[0], lng: end[1], role: 'end', sequence: 1 },
  ]
}

/**
 * What the server will derive from a create or edit, worked out here for the
 * copy shown until the queued write replays: the same metrics, the duration
 * in minutes, full confidence because the route editor drew it.
 */
function routeFields(body: TourCreateRequest) {
  const metrics = computeTourMetrics(body.route_geometry as GeometryPoint[])
  const fields = {
    name: body.name,
    tour_type: body.tour_type,
    distance: metrics.distanceKm,
    elevation_gain: metrics.elevationGainM,
    elevation_loss: metrics.elevationLossM,
    duration: body.duration_seconds == null ? null : Math.round(body.duration_seconds / 60),
    match_confidence: 1,
    caution: false,
    max_hiking_difficulty: body.max_hiking_difficulty,
    has_waypoints: true,
    ...(body.planned_duration_minutes !== undefined ? { planned_duration_minutes: body.planned_duration_minutes } : {}),
    ...(body.break_additional_minutes !== undefined ? { break_additional_minutes: body.break_additional_minutes } : {}),
  }
  return {
    ...fields,
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.website !== undefined ? { website: body.website } : {}),
  }
}

/** The owning place's route columns, which a create or edit replaces with the tour's. */
function routePlaceFields(body: TourCreateRequest) {
  const start = body.route_geometry[0]
  return {
    name: body.name,
    lat: start[0],
    lng: start[1],
    route_geometry: JSON.stringify(body.route_geometry),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.website !== undefined ? { website: body.website } : {}),
  }
}

/**
 * Tours through the offline core: reads fall back to the Dexie copy, and a
 * create or route edit made offline is written there and queued, like a place.
 * A tour is a place plus its facet, so an offline create writes both under one
 * temporary id, which the queue swaps for the real one on replay.
 *
 * The GPX import uploads a file and stays online-only, like every upload.
 */
export const tourRepo = {
  async list(tripId: number | string): Promise<{ tours: TourListItem[] }> {
    return onlineThenCache(
      async () => {
        const result = await toursApi.list(tripId)
        void replaceTripTours(Number(tripId), result.tours)
        return result
      },
      async () => {
        const rows = await offlineDb.tours.where('trip_id').equals(Number(tripId)).toArray()
        return { tours: rows.sort(newestFirst).map(toListItem) }
      },
    )
  },

  async detail(tripId: number | string, placeId: number, signal?: AbortSignal): Promise<TourDetailResponse> {
    return onlineThenCache(
      async () => {
        const result = await toursApi.detail(tripId, placeId, signal)
        await offlineDb.tours.put({ ...result.tour, trip_id: Number(tripId), waypoints: result.waypoints })
        return result
      },
      async () => {
        // An aborted request is not a lost connection: the caller moved on.
        signal?.throwIfAborted()
        const cached = await offlineDb.tours.get(placeId)
        if (!cached || cached.trip_id !== Number(tripId)) throw new Error('Tour not available offline')
        const waypoints = cached.waypoints?.length
          ? cached.waypoints
          : endpointsOf((await offlineDb.places.get(placeId))?.route_geometry)
        return { tour: toListItem(cached), waypoints }
      },
    )
  },

  async create(tripId: number | string, body: TourCreateRequest): Promise<TourCreateResponse> {
    if (isEffectivelyOffline()) {
      const tid = Number(tripId)
      const tempId = nextTempId()
      const tour: CachedTour = {
        place_id: tempId, trip_id: tid, difficulty: null, wanderer_ref: null, planned: false,
        description: null, website: null, planned_duration_minutes: null, break_additional_minutes: null,
        ...routeFields(body), waypoints: body.waypoints,
      }
      const place = { id: tempId, trip_id: tid, description: null, website: null, ...routePlaceFields(body) } as Place
      await offlineDb.transaction('rw', offlineDb.places, offlineDb.tours, async () => {
        await offlineDb.places.put(place)
        await offlineDb.tours.put(tour)
      })
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: tid,
        method: 'POST',
        url: `/trips/${tripId}/tours`,
        body,
        resource: 'tours',
        tempId,
      })
      return { tour: toListItem(tour), waypoints: body.waypoints }
    }
    const result = await toursApi.create(tripId, body)
    await offlineDb.tours.put({ ...result.tour, trip_id: Number(tripId), waypoints: result.waypoints })
    return result
  },

  async update(tripId: number | string, placeId: number, body: TourCreateRequest): Promise<TourDetailResponse> {
    if (await mutationQueue.mustQueue('tours', placeId)) {
      const tid = Number(tripId)
      const existing = await offlineDb.tours.get(placeId)
      const tour: CachedTour = {
        difficulty: null, wanderer_ref: null, planned: false,
        ...existing, ...routeFields(body), place_id: placeId, trip_id: tid, waypoints: body.waypoints,
      }
      const place = await offlineDb.places.get(placeId)
      await offlineDb.transaction('rw', offlineDb.places, offlineDb.tours, async () => {
        await offlineDb.places.put({ ...(place ?? {} as Place), id: placeId, trip_id: tid, ...routePlaceFields(body) })
        await offlineDb.tours.put(tour)
      })
      const isTemp = placeId < 0
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: tid,
        method: 'PUT',
        url: isTemp ? `/trips/${tripId}/tours/{id}` : `/trips/${tripId}/tours/${placeId}`,
        body,
        resource: 'tours',
        entityId: placeId,
        ...(isTemp ? { tempEntityId: placeId } : {}),
      })
      mutationQueue.sendSoon()
      return { tour: toListItem(tour), waypoints: body.waypoints }
    }
    const result = await toursApi.update(tripId, placeId, body)
    await offlineDb.tours.put({ ...result.tour, trip_id: Number(tripId), waypoints: result.waypoints })
    return result
  },

  async importGpx(tripId: number | string, file: File): Promise<TourImportGpxResponse> {
    const result = await toursApi.importGpx(tripId, file)
    await offlineDb.tours.bulkPut(result.tours.map(tour => ({ ...tour, trip_id: Number(tripId) })))
    return result
  },
}
