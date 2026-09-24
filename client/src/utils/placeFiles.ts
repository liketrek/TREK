import type { Reservation, TripFile } from '../types'

/**
 * The files a place shows: its own, plus the ones attached to a booking that
 * hangs on this place or on one of its stops in the plan. A confirmation lives
 * on the booking, and the place card was the one screen that could not reach it
 * (#2217).
 */
export function filesForPlace(
  files: TripFile[] | undefined,
  placeId: number | undefined,
  reservations: Reservation[] | undefined,
  assignmentIds: number[] = [],
): TripFile[] {
  if (placeId == null) return []
  const own = (files || []).filter(f =>
    !f.deleted_at && (String(f.place_id) === String(placeId) || (f.linked_place_ids || []).includes(placeId)),
  )
  const bookingIds = new Set(
    (reservations || [])
      .filter(r => String(r.place_id) === String(placeId) || (r.assignment_id != null && assignmentIds.includes(r.assignment_id)))
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
