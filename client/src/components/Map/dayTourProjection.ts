import type { TourListItem, TourStageStop } from '@trek/shared'
import { analyzeRouteGeometry } from '../../utils/routeGeometry'
import type { Assignment, Place } from '../../types'
import { vertexIndicesOf } from '../Tours/stages/tourStages'

/** MDT-02: the stops each multi-day tour's stages run between, by the tour's place id. */
export type TourStageStops = ReadonlyMap<number, readonly TourStageStop[]>

/** The stage stops of the trip's multi-day tours, from the tour list; a day tour has none. */
export function tourStageStopsByPlace(tours: readonly Pick<TourListItem, 'place_id' | 'stage_stops'>[]): TourStageStops {
  return new Map(tours.flatMap(tour => (tour.stage_stops ? [[tour.place_id, tour.stage_stops] as const] : [])))
}

/**
 * MDT-02: the stretch of a tour's line one stage runs, from the stop it starts
 * at to the stop the next one starts at; null where the stops do not tell it
 * (a stage the tour no longer has, a line that has not reached them yet).
 */
function stageStretch(
  line: [number, number][],
  stops: readonly TourStageStop[] | undefined,
  stageKey: string | null | undefined,
): [number, number][] | null {
  if (!stageKey || !stops || line.length < 2) return null
  const index = stops.findIndex(stop => stop.key === stageKey)
  if (index < 0 || index >= stops.length - 1) return null
  const at = vertexIndicesOf(stops, line)
  return at[index + 1] > at[index] ? line.slice(at[index], at[index + 1] + 1) : null
}

export type DayItineraryItem =
  | { kind: 'stop'; assignment: Assignment }
  | {
      kind: 'tour'
      assignment: Assignment
      placeId: number
      start: { lat: number; lng: number } | null
      end: { lat: number; lng: number } | null
      geometry: [number, number][]
      loop: boolean
      valid: boolean
    }

/**
 * A day's stops with each tour projected onto its line: the day's route runs
 * to where the tour starts and on from where it ends. A day holding one stage
 * of a multi-day tour (MDT-02) runs to that stage's start and on from its end,
 * and draws that stage's stretch, where `stageStops` tells them.
 */
export function projectDayItinerary(
  assignments: Assignment[],
  toursEnabled: boolean,
  places: readonly Place[] = [],
  stageStops?: TourStageStops,
): DayItineraryItem[] {
  const placesById = new Map(places.map(place => [place.id, place]))
  return assignments.map(assignment => {
    const placeId = assignment.place?.id
    if (placeId == null) return { kind: 'stop', assignment }
    const currentPlace = placesById.get(placeId)
    if (!toursEnabled || assignment.tour_place_id !== placeId) {
      // Any other place with a track (GPX/KML import) sits at the track's first point,
      // so routing it as a plain stop draws a second road alongside the track (#2600).
      // It gets the same gap as a Tour; without a usable track it stays a stop and can
      // never turn into an invalid Tour.
      const track = analyzeRouteGeometry(currentPlace?.route_geometry)?.routeCoordinates ?? []
      if (track.length < 2) return { kind: 'stop', assignment }
      const start = { lat: track[0][0], lng: track[0][1] }
      const end = { lat: track[track.length - 1][0], lng: track[track.length - 1][1] }
      return { kind: 'tour', assignment, placeId, start, end, geometry: track,
        loop: start.lat === end.lat && start.lng === end.lng, valid: true } as const
    }
    const analysis = analyzeRouteGeometry(currentPlace ? currentPlace.route_geometry : assignment.tour_route_geometry)
    const whole = analysis?.routeCoordinates ?? []
    const geometry = stageStretch(whole, stageStops?.get(placeId), assignment.tour_stage_key) ?? whole
    const start = geometry.length >= 2
      ? { lat: geometry[0][0], lng: geometry[0][1] }
      : assignment.place?.lat != null && assignment.place?.lng != null
        ? { lat: assignment.place.lat, lng: assignment.place.lng }
        : null
    const end = geometry.length >= 2
      ? { lat: geometry[geometry.length - 1][0], lng: geometry[geometry.length - 1][1] }
      : null
    return { kind: 'tour', assignment, placeId, start, end, geometry,
      loop: !!start && !!end && start.lat === end.lat && start.lng === end.lng,
      valid: !!end } as const
  })
}

/** The day's stops projected as `projectDayItinerary` does, by assignment id, for the route that runs through them. */
export function projectedById(
  assignments: Assignment[],
  toursEnabled: boolean,
  places?: readonly Place[],
  stageStops?: TourStageStops,
): Map<number, DayItineraryItem> {
  return new Map(projectDayItinerary(assignments, toursEnabled, places, stageStops).map(item => [item.assignment.id, item]))
}