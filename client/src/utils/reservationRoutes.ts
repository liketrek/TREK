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

/** The type-specific floors, in screen pixels, under which a hop is not worth drawing. */
const LINE_FLOOR_PX: Record<string, number> = { flight: 50, cruise: 150, car: 80 }
const LINE_FLOOR_DEFAULT_PX = 200

/** Under this floor the endpoint labels stay off, so short hops do not stack text. */
const LABEL_FLOOR_PX: Record<string, number> = { flight: 50, cruise: 300, car: 150, transit: 900 }
const LABEL_FLOOR_DEFAULT_PX = 400

/** How far the line is allowed to disappear before its endpoints cannot be told apart. */
export function lineFloorPx(type: string): number {
  return LINE_FLOOR_PX[type] ?? LINE_FLOOR_DEFAULT_PX
}

export function labelFloorPx(type: string): number {
  return LABEL_FLOOR_PX[type] ?? LABEL_FLOOR_DEFAULT_PX
}

/**
 * Whether a hop is worth drawing at the current zoom.
 *
 * The declutter exists for a tiny straight connector, the kind that would sit
 * under its own endpoint markers and add nothing but clutter. It used to be
 * decided from the two endpoints alone, which was fine while every hop was a
 * straight line: the line was never longer than the gap it bridged.
 *
 * A routed car booking is not that line. It follows the road, and a road that
 * leaves a town, loops round a lake and comes back to the next town along
 * can run across half the screen while its two ends project a handful of
 * pixels apart. The old check then hid the whole drive, and the person looking
 * at their trip saw a gap in the route until they zoomed in far enough for
 * the endpoints to separate (#2275). A booking with stops on the way has the
 * same shape: the ends may be close, the drawn path is not.
 *
 * So the decision looks at what will actually be drawn. A hop stays hidden
 * only while every polyline it would draw is shorter on screen than the
 * floor, walked point to point. A straight two-point line measures the same
 * as before, so every existing floor holds for the case it was written for.
 *
 * `project` is whichever renderer's own projection: Leaflet's
 * latLngToContainerPoint or Mapbox's project, wrapped to take [lat, lng].
 */
export function hopIsVisible(
  type: string,
  lines: readonly (readonly [number, number][])[],
  project: (point: readonly [number, number]) => { x: number; y: number },
): boolean {
  const floor = lineFloorPx(type)
  for (const line of lines) {
    let length = 0
    let prev = line.length > 0 ? project(line[0]) : null
    for (let i = 1; i < line.length && prev; i++) {
      const next = project(line[i])
      length += Math.hypot(next.x - prev.x, next.y - prev.y)
      if (length >= floor) return true
      prev = next
    }
  }
  return false
}
