import type { Accommodation, Reservation } from '../types'

/**
 * The stays whose booking is not confirmed yet (#2281), by accommodation id.
 *
 * Read the way every other booking pill reads it: confirmed is confirmed, anything
 * else still waits. A stay without a booking at all is not pending, it is simply a
 * place to sleep that nobody booked through TREK.
 */
export function pendingStayIds(reservations: Pick<Reservation, 'accommodation_id' | 'status'>[]): Set<number> {
  const ids = new Set<number>()
  for (const r of reservations) {
    if (r.accommodation_id != null && r.status !== 'confirmed') ids.add(Number(r.accommodation_id))
  }
  return ids
}

/** The places of those stays, for the map to draw their markers as not yet certain. */
export function pendingStayPlaceIds(
  accommodations: Pick<Accommodation, 'id' | 'place_id'>[],
  reservations: Pick<Reservation, 'accommodation_id' | 'status'>[],
): Set<number> {
  const pending = pendingStayIds(reservations)
  const ids = new Set<number>()
  for (const acc of accommodations) {
    if (acc.place_id != null && pending.has(acc.id)) ids.add(acc.place_id)
  }
  // A place that also hosts a confirmed stay is certain enough to draw plainly.
  for (const acc of accommodations) {
    if (acc.place_id != null && !pending.has(acc.id) && reservations.some(r => Number(r.accommodation_id) === acc.id && r.status === 'confirmed')) ids.delete(acc.place_id)
  }
  return ids
}
