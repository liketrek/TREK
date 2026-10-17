import type { Reservation, TripFile } from '../types'

/**
 * The files a place shows: its own, the ones pinned to one of its stops in the
 * plan, plus the ones attached to a booking that hangs on this place or on one
 * of its stops. A confirmation lives on the booking, and the place card was the
 * one screen that could not reach it (#2217). A hotel booking reaches its place
 * through the stay rather than its own place_id, the same way the card lists
 * the booking itself (getPlaceBookings, #2363).
 */
export function filesForPlace(
  files: TripFile[] | undefined,
  placeId: number | undefined,
  reservations: Reservation[] | undefined,
  assignmentIds: number[] = [],
): TripFile[] {
  if (placeId == null) return []
  const own = (files || []).filter(f =>
    !f.deleted_at && (
      String(f.place_id) === String(placeId)
      || (f.linked_place_ids || []).includes(placeId)
      || (f.linked_assignment_ids || []).some(id => id != null && assignmentIds.includes(id))
    ),
  )
  const bookingIds = new Set(
    (reservations || [])
      .filter(r =>
        String(r.place_id) === String(placeId)
        || (r.accommodation_place_id != null && String(r.accommodation_place_id) === String(placeId))
        || (r.assignment_id != null && assignmentIds.includes(r.assignment_id)))
      .map(r => r.id),
  )
  if (bookingIds.size === 0) return own
  const seen = new Set(own.map(f => f.id))
  return [
    ...own,
    ...(files || []).filter(f => {
      if (f.deleted_at || seen.has(f.id)) return false
      if (f.reservation_id != null && bookingIds.has(Number(f.reservation_id))) return true
      return (f.linked_reservation_ids || []).some(id => id != null && bookingIds.has(id))
    }),
  ]
}
