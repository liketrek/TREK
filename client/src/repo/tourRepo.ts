import { computeTourMetrics, estimatePaddleTime, paddleCheckSummaryOf, paddleLayoutOfTrack, paddleMovingSeconds, recommendedPaddleSpeedKmh, type GeometryPoint, type TourObstacleCheck, type TourObstacleReviewsRequest, type TourPaddlePlanRequest, type TourCreateRequest, type TourCreateResponse, type TourDetailResponse, type TourGpxImportFields, type TourGpxPreviewResponse, type TourImportGpxResponse, type TourListItem, type TourWaypoint } from '@trek/shared'
import { toursApi } from '../api/client'
import { tourGpxApi } from '../api/tourGpx'
import { recordedTrackApi } from '../api/recordedTrack'
import { tourPaddlePlanApi } from '../api/tourPaddlePlan'
import { tourCopiesApi } from '../api/tourCopies'
import { tourObstacleReviewsApi } from '../api/tourObstacleReviews'
import { cacheTourAnswer } from '../db/cacheTour'
import { offlineDb, replaceTripTours, type CachedTour } from '../db/offlineDb'
import { mutationQueue, generateUUID, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { applyObstacleOps } from './obstacleCheckLocal'
import { onlineThenCache } from './withOfflineFallback'
import type { Place } from '../types'

/** The list item a cached row stands for: the cache-only fields stripped. */
function toListItem({ trip_id: _tripId, waypoints: _waypoints, provenance: _provenance, obstacle_check: _check, ...tour }: CachedTour): TourListItem {
  return tour
}

/**
 * A paddle tour's bench after a route write made here offline: the server has
 * not judged the new route yet, so its revision no longer matches any
 * checklist and the checklist reads as stale until the write replays.
 */
function staleCheck(tour: CachedTour, mutationId: string): CachedTour {
  return tour.paddle_check ? { ...tour, paddle_check: { ...tour.paddle_check, revision: `local:${mutationId}` } } : tour
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
  // As the server keeps it: a drawn paddle tour's heights stay unknown.
  const heightsKnown = body.tour_type !== 'kayak'
  const fields = {
    name: body.name,
    tour_type: body.tour_type,
    distance: metrics.distanceKm,
    elevation_gain: heightsKnown ? metrics.elevationGainM : null,
    elevation_loss: heightsKnown ? metrics.elevationLossM : null,
    boat_type: body.boat_type ?? null,
    water_context: body.water_context ?? null,
    paddle_speed_kmh: body.paddle_speed_kmh ?? null,
    portage_speed_kmh: body.portage_speed_kmh ?? null,
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
        await cacheTourAnswer(Number(tripId), result)
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
        return {
          tour: toListItem(cached),
          waypoints,
          ...(cached.provenance ? { provenance: cached.provenance } : {}),
          ...(cached.obstacle_check ? { obstacle_check: cached.obstacle_check } : {}),
        }
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
    await cacheTourAnswer(Number(tripId), result)
    return result
  },

  async update(tripId: number | string, placeId: number, body: TourCreateRequest): Promise<TourDetailResponse> {
    if (await mutationQueue.mustQueue('tours', placeId)) {
      const tid = Number(tripId)
      const existing = await offlineDb.tours.get(placeId)
      const id = generateUUID()
      const tour = staleCheck({
        difficulty: null, wanderer_ref: null, planned: false,
        ...existing, ...routeFields(body), place_id: placeId, trip_id: tid, waypoints: body.waypoints,
      }, id)
      const place = await offlineDb.places.get(placeId)
      await offlineDb.transaction('rw', offlineDb.places, offlineDb.tours, async () => {
        await offlineDb.places.put({ ...(place ?? {} as Place), id: placeId, trip_id: tid, ...routePlaceFields(body) })
        await offlineDb.tours.put(tour)
      })
      const isTemp = placeId < 0
      await mutationQueue.enqueue({
        id,
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
    await cacheTourAnswer(Number(tripId), result)
    return result
  },

  /**
   * PAD-03/PAD-07: a recorded paddle track's portages, locks and speeds. Made
   * offline, the cached tour takes them at once, with the moving time the
   * server will work out from them, and the write waits in the queue.
   */
  async updatePaddlePlan(tripId: number | string, placeId: number, body: TourPaddlePlanRequest): Promise<TourDetailResponse> {
    if (await mutationQueue.mustQueue('tours', placeId)) {
      const tid = Number(tripId)
      const existing = await offlineDb.tours.get(placeId)
      if (!existing) throw new Error('Tour not available offline')
      const estimate = estimatePaddleTime(paddleLayoutOfTrack((existing.distance ?? 0) * 1000, body.track_marks), {
        paddleSpeedKmh: body.paddle_speed_kmh ?? recommendedPaddleSpeedKmh(existing.boat_type),
        portageSpeedKmh: body.portage_speed_kmh,
        breakMinutes: null,
      })
      const moving = paddleMovingSeconds(estimate)
      const empty = body.track_marks.portages.length === 0 && body.track_marks.locks.length === 0
      const id = generateUUID()
      const tour = staleCheck({
        ...existing,
        paddle_speed_kmh: body.paddle_speed_kmh,
        portage_speed_kmh: body.portage_speed_kmh,
        track_marks: empty ? null : body.track_marks,
        duration: moving === null ? null : Math.round(moving / 60),
      }, id)
      await offlineDb.tours.put(tour)
      await mutationQueue.enqueue({
        id,
        tripId: tid,
        method: 'PUT',
        url: `/trips/${tripId}/tours/${placeId}/paddle-plan`,
        body,
        resource: 'tours',
        entityId: placeId,
      })
      mutationQueue.sendSoon()
      return { tour: toListItem(tour), waypoints: existing.waypoints ?? [] }
    }
    const result = await tourPaddlePlanApi.update(tripId, placeId, body)
    await cacheTourAnswer(Number(tripId), result)
    return result
  },

  /** Online only, like the import: the recorded track is kept on the server, not in the cache. */
  async restoreRecorded(tripId: number | string, placeId: number): Promise<TourDetailResponse> {
    const result = await recordedTrackApi.restore(tripId, placeId)
    await cacheTourAnswer(Number(tripId), result)
    return result
  },

  /**
   * P2C-07, online only like the restore: the copy is made from the server's
   * stored line and control points, so it needs the server to answer.
   */
  async copy(tripId: number | string, placeId: number, name: string): Promise<TourCreateResponse> {
    const result = await tourCopiesApi.copy(tripId, placeId, { name })
    await cacheTourAnswer(Number(tripId), result)
    return result
  },

  /**
   * PAD-06: a paddle tour's checklist for the bench the list shows. The
   * cached one serves while its revision matches; otherwise the detail is read
   * (the cache standing in offline), and a checklist of another revision than
   * the bench's reads as stale. A bench of a write made here offline waits for
   * the queue to replay once online, and the tour read with the detail comes
   * back with it, so the list can take in the server's bench.
   */
  async obstacleCheck(
    tripId: number | string,
    placeId: number,
    revision: string | null,
    signal?: AbortSignal,
  ): Promise<{ check: TourObstacleCheck | null; stale: boolean; tour?: TourListItem }> {
    let cached = await offlineDb.tours.get(placeId)
    // A bench or a checklist of a write made here offline waits for the queue to replay once online.
    const queuedHere = !!revision?.startsWith('local:') || !!cached?.obstacle_check?.revision.startsWith('local:')
    if (queuedHere && !isEffectivelyOffline()) {
      await mutationQueue.flush()
      cached = await offlineDb.tours.get(placeId)
    }
    if (revision !== null && cached?.obstacle_check?.revision === revision) return { check: cached.obstacle_check, stale: false }
    const detail = await tourRepo.detail(tripId, placeId, signal)
    const check = detail.obstacle_check ?? null
    return { check, stale: check !== null && revision !== null && check.revision !== revision, tour: detail.tour }
  },

  /**
   * PAD-06: what the paddlers decided about the obstacles. Made offline, or
   * behind a queued write of the same tour, the cached checklist and bench
   * take the change at once under a local revision and the write waits in the
   * queue; the server then binds each decision to the basis the user saw.
   */
  async saveObstacleReviews(
    tripId: number | string,
    placeId: number,
    body: TourObstacleReviewsRequest,
    userId: number | null,
  ): Promise<TourDetailResponse> {
    if (placeId < 0) throw new Error('Save the tour before deciding about its obstacles')
    if (await mutationQueue.mustQueue('tours', placeId)) {
      const existing = await offlineDb.tours.get(placeId)
      if (!existing?.obstacle_check) throw new Error('Checklist not available offline')
      const id = generateUUID()
      const revision = `local:${id}`
      // A checklist still judged on an older route than the bench keeps that gap, so it stays marked stale.
      const routeStale = !!existing.paddle_check && existing.paddle_check.revision !== existing.obstacle_check.revision
      const check = applyObstacleOps(existing.obstacle_check, body.ops, { now: new Date().toISOString(), userId, revision })
      const bench = existing.paddle_check
        ? {
          ...paddleCheckSummaryOf(check.entries, check.own, existing.paddle_check),
          revision: routeStale ? existing.paddle_check.revision : revision,
        }
        : existing.paddle_check
      const tour: CachedTour = { ...existing, obstacle_check: check, paddle_check: bench }
      await offlineDb.tours.put(tour)
      await mutationQueue.enqueue({
        id,
        tripId: Number(tripId),
        method: 'PUT',
        url: `/trips/${tripId}/tours/${placeId}/obstacle-reviews`,
        body,
        resource: 'tours',
        entityId: placeId,
      })
      mutationQueue.sendSoon()
      return {
        tour: toListItem(tour),
        waypoints: existing.waypoints ?? [],
        obstacle_check: check,
        ...(existing.provenance ? { provenance: existing.provenance } : {}),
      }
    }
    const result = await tourObstacleReviewsApi.save(tripId, placeId, body)
    await cacheTourAnswer(Number(tripId), result)
    return result
  },

  async importGpx(tripId: number | string, file: File, fields?: TourGpxImportFields): Promise<TourImportGpxResponse> {
    const result = await tourGpxApi.import(tripId, file, fields)
    await offlineDb.tours.bulkPut(result.tours.map(tour => ({ ...tour, trip_id: Number(tripId) })))
    return result
  },

  /** Reads a GPX file for its preview; online only, like the import, and nothing is cached. */
  async previewGpx(tripId: number | string, file: File): Promise<TourGpxPreviewResponse> {
    return tourGpxApi.preview(tripId, file)
  },
}
