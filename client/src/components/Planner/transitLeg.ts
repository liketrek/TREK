import type { Accommodation, Assignment, Reservation, RouteSegment } from '../../types'
import type { PickedPlace } from './TransitSearchPanel'

/** What the transit search is opened with for one leg of a day. */
export interface TransitLeg {
  from: PickedPlace
  to: PickedPlace
  time: string | null
}

/**
 * A connector's endpoints carry only coordinates (RouteSegment.from/to, both
 * [lat, lng]); resolve them back to the NAMES the transit search shows by indexing
 * every located place, hotel and booking endpoint on the trip. Name is a property
 * of a coordinate, so a trip-wide index is fine; a connector only renders when both
 * ends are located, so a coordinate that misses the index is rare (nameless pick).
 */
export function buildTransitNameIndex(
  assignments: Record<string, Assignment[]>,
  accommodations: Accommodation[],
  reservations: Reservation[],
): Map<string, string> {
  const m = new Map<string, string>()
  const put = (lat?: number | null, lng?: number | null, name?: string | null) => {
    if (lat == null || lng == null || !name) return
    const k = `${lat},${lng}`
    if (!m.has(k)) m.set(k, name)
  }
  for (const list of Object.values(assignments)) {
    for (const a of list) put(a.place?.lat, a.place?.lng, a.place?.name)
  }
  for (const acc of accommodations) put(acc.place_lat, acc.place_lng, acc.place_name)
  for (const r of reservations) {
    for (const ep of (r.endpoints || [])) put(ep.lat, ep.lng, ep.name)
  }
  return m
}

/**
 * The leg's departure time must be resolved WITHIN its day: the same located POI can
 * be revisited on another day at a different time (a supported pattern), so a
 * trip-wide coordinate index would return the wrong day's time. Scope to this day's
 * assignments (and the reservations that touch it) so a revisit keeps its own time.
 */
function originDepartureTime(
  originKey: string,
  dayId: number,
  assignments: Record<string, Assignment[]>,
  reservations: Reservation[],
): string | null {
  for (const a of assignments[String(dayId)] ?? []) {
    if (a.place?.lat != null && a.place?.lng != null && `${a.place.lat},${a.place.lng}` === originKey) return a.place.place_time ?? null
  }
  for (const r of reservations) {
    if (r.day_id !== dayId && r.end_day_id !== dayId) continue
    for (const ep of (r.endpoints || [])) {
      if (ep.lat != null && ep.lng != null && `${ep.lat},${ep.lng}` === originKey) return ep.local_time ?? null
    }
  }
  return null
}

/**
 * The public transport prefill for a leg, from its RouteSegment: MOTIS is driven off
 * the coordinates, the names come from the index and the departure time from the
 * origin's own day. Accepts 'H:mm' or 'HH:mm[:ss]', normalised to 'HH:mm'. Shared by
 * the desktop day plan and the phone timeline, so both open the search alike.
 */
export function buildTransitLeg(
  seg: RouteSegment | undefined,
  dayId: number,
  names: Map<string, string>,
  assignments: Record<string, Assignment[]>,
  reservations: Reservation[],
): TransitLeg | null {
  if (!seg?.from || !seg?.to) return null
  const pick = (c: [number, number]): PickedPlace => ({ name: names.get(`${c[0]},${c[1]}`) || '', lat: c[0], lng: c[1] })
  const rawTime = originDepartureTime(`${seg.from[0]},${seg.from[1]}`, dayId, assignments, reservations)
  const m = rawTime ? /^(\d{1,2}):(\d{2})/.exec(rawTime) : null
  return { from: pick(seg.from), to: pick(seg.to), time: m ? `${m[1].padStart(2, '0')}:${m[2]}` : null }
}
