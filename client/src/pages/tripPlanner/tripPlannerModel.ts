/**
 * Trip planner pure helpers — React/IO-free logic shared by the data hook
 * (useTripPlanner) and kept here so it can be unit-tested in isolation. Part of
 * the FE "page = wiring container + data hook" convention (see PATTERN.md).
 */

import { isServiceStopType } from '../../components/Roadtrip/roadtripModel'
import type { Assignment } from '../../types'

/** What a stay or a booking says about the place it is for. */
export interface BookedPlaceSources {
  accommodations: { place_id?: number | null }[]
  reservations: { place_id?: number | null; accommodation_place_id?: number | null }[]
}

/**
 * The trip's places as Days shows them.
 *
 * With "Show in Days too" switched off, a place typed as a road trip stop (a pump, a
 * rest area, a campsite) belongs to the drive and stays out of Days, list and map alike.
 * A place a stay or a booking points at is not such a stop, whatever its type says, and
 * neither is lodging: every lodging booking types its place as 'hotel', the type stays
 * after the booking is gone, and dropping it took the booked hotel out of the place
 * list, the booking's own place picker and the Days map the moment it was booked.
 */
export function placesForDays<P extends { id: number; stop_type?: string | null }>(
  places: P[],
  hideRoadtripStops: boolean,
  { accommodations, reservations }: BookedPlaceSources,
): P[] {
  if (!hideRoadtripStops) return places
  const booked = new Set<number>()
  for (const stay of accommodations) {
    if (stay.place_id != null) booked.add(stay.place_id)
  }
  for (const reservation of reservations) {
    if (reservation.place_id != null) booked.add(reservation.place_id)
    if (reservation.accommodation_place_id != null) booked.add(reservation.accommodation_place_id)
  }
  return places.filter(place => !isServiceStopType(place.stop_type) || place.stop_type === 'hotel' || booked.has(place.id))
}

/**
 * Resolve the day-assignment to use when a place is edited from the Places pool,
 * where no day is in context. Times live per day-assignment (#1247), so we can
 * only hydrate/persist a place's time when it is assigned to exactly one day.
 * Returns that assignment's id, or null when the place has 0 or 2+ assignments
 * (ambiguous — the modal then hides the time fields).
 */
export function resolvePoolAssignmentId(
  assignments: Record<string | number, Assignment[]>,
  placeId: number,
): number | null {
  const matches = Object.values(assignments)
    .flat()
    .filter((a) => a.place?.id === placeId)
  return matches.length === 1 ? matches[0].id : null
}
