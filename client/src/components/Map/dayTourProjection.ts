import { analyzeRouteGeometry } from '../../utils/routeGeometry'
import type { Assignment, Place } from '../../types'

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

export function projectDayItinerary(
  assignments: Assignment[],
  toursEnabled: boolean,
  places: readonly Place[] = [],
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
    const geometry = analysis?.routeCoordinates ?? []
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