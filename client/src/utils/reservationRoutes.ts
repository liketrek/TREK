import { isDayInAccommodationRange } from './dayOrder'
import type { Day, Reservation } from '../types'

/**
 * A reservation is routable on the map once it has at least two ordered
 * endpoints (from/to/stop).
 *
 * Total in its argument, because it is handed straight to Array.filter over a
 * list this module does not own. It used to guard the property but not the
 * element, so one undefined entry took the whole trip planner down (#1979).
 */
export function isRoutableReservation(r: Pick<Reservation, 'endpoints'> | null | undefined): boolean {
  return (r?.endpoints || []).length >= 2
}

export interface RouteVisibilityOptions {
  /** Reservation ids resolved as currently visible for this trip (per-item toggle, bulk toggle, or the account-wide default — see connectionsVisibility.ts). */
  visibleConnectionIds: number[]
  /** The separate manual day-route-calculator toggle — 'transit' reservations ride it (#1065). */
  showTransitRoutes: boolean
  /** The day that toggle belongs to. Optional: a map without a day context (collections) keeps drawing every transit, as before. */
  selectedDayId?: number | null
  /** The trip's days, needed to order them — day ids are not monotonic once days have been reordered. */
  days?: Day[]
}

/**
 * Does this transit journey actually run on the selected day? `showTransitRoutes` is one
 * day's toggle but the reservation list is trip-wide, so without this every automated
 * transport in the trip drew its geometry as soon as any day's route was switched on (#2019).
 *
 * The span, not the departure day: an overnight journey carries end_day_id and has to stay
 * on both of its days — same rule getTransportForDay applies to the sidebar timeline.
 * A journey bound to no day keeps drawing; hiding something that legitimately belongs
 * to today is the worse failure.
 */
function transitRunsOnDay(r: Reservation, selectedDayId: number | null | undefined, days: Day[]): boolean {
  if (selectedDayId == null) return true
  const startDayId = r.day_id ?? r.end_day_id
  if (startDayId == null) return true
  const day = days.find(d => d.id === selectedDayId)
  if (!day) return true
  return isDayInAccommodationRange(day, startDayId, r.end_day_id ?? startDayId, days)
}

/** Which reservations should draw a route on the map, combining the two independent toggles above. */
export function visibleRouteReservations(reservations: Reservation[], options: RouteVisibilityOptions): Reservation[] {
  const { visibleConnectionIds, showTransitRoutes, selectedDayId, days } = options
  const set = new Set(visibleConnectionIds || [])
  return reservations.filter(r =>
    (r.type === 'transit' && showTransitRoutes && transitRunsOnDay(r, selectedDayId, days || [])) ||
    set.has(r.id)
  )
}
