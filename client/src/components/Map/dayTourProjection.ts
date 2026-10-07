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
    if (!toursEnabled || placeId == null || assignment.tour_place_id !== placeId) return { kind: 'stop', assignment }
    const currentPlace = placesById.get(placeId)
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