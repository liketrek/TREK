import {
  generateCoMapsUrl, generateGoogleMapsUrl, optimizeRoute,
  type NamedWaypoint, type RouteProfileKey,
} from '../../../../components/Map/RouteCalculator'
import {
  getAccommodationAnchors, getDayBookendHotels, shouldDrawEveningLeg, shouldDrawMorningLeg,
} from '../../../../utils/dayOrder'
import type { Accommodation, Assignment, Day } from '../../../../types'

/**
 * Day-route helpers shared by the plan timeline and the day sheet — the exact
 * desktop rules (timed places stay anchored, hotel bookends only when the leg
 * is real, #1372/#1465), extracted so both surfaces can't drift apart.
 */

export interface OptimizedDay {
  order: Assignment[]
  /** True when an accommodation anchored the start or end of the route. */
  usedHotel: boolean
}

/**
 * Optimized order for a day's assignments: timed places keep their slot, the
 * remaining located stops are rerouted (optionally anchored to the day's
 * accommodation) and stops without coordinates fill the leftover slots.
 * Null when fewer than two movable located stops exist — nothing to optimize.
 */
export function optimizeDayOrder(
  day: Day,
  days: Day[],
  dayAssignments: Assignment[],
  accommodations: Accommodation[],
  fromAccommodation: boolean,
  dayHasCarrier?: boolean,
): OptimizedDay | null {
  const locked = new Map<number, Assignment>()
  const movable: Assignment[] = []
  dayAssignments.forEach((a, idx) => {
    if (a.place?.place_time) locked.set(idx, a)
    else movable.push(a)
  })
  const withCoords = movable.filter(a => a.place?.lat != null && a.place?.lng != null)
  if (withCoords.length < 2) return null
  const noCoords = movable.filter(a => a.place?.lat == null || a.place?.lng == null)
  const anchors = fromAccommodation
    ? getAccommodationAnchors(day, days, accommodations,
        withCoords.map(a => ({ lat: a.place!.lat!, lng: a.place!.lng! })), dayHasCarrier)
    : {}
  const optimized = optimizeRoute(
    withCoords.map(a => ({ lat: a.place!.lat!, lng: a.place!.lng!, _assignmentId: a.id })),
    anchors,
  ).map(p => withCoords.find(a => a.id === p._assignmentId)!).filter(Boolean)
  const queue = [...optimized, ...noCoords]
  const order: Assignment[] = new Array(dayAssignments.length)
  locked.forEach((a, idx) => { order[idx] = a })
  let qi = 0
  for (let i = 0; i < order.length; i++) {
    if (!order[i]) order[i] = queue[qi++]
  }
  return { order, usedHotel: Boolean(anchors.start || anchors.end) }
}

/**
 * The day's located stops in planned order, bookended by the morning/evening
 * accommodation exactly like the drawn route. Names ride along for the deep
 * links that can label a pin with one. `dayHasCarrier` — a carrier transport
 * with a located endpoint on the day — keeps the no-time bookend default from
 * opening a leg out of a hotel only reached tonight or back into one already
 * left (#2157), same as the drawn route.
 */
export function dayExportStops(
  day: Day,
  days: Day[],
  dayAssignments: Assignment[],
  accommodations: Accommodation[],
  bookendFromAccommodation: boolean,
  dayHasCarrier?: boolean,
): NamedWaypoint[] {
  const located = dayAssignments.filter(a => a.place?.lat != null && a.place?.lng != null)
  const stops = located.map(a => ({ lat: a.place!.lat!, lng: a.place!.lng!, name: a.place!.name }))
  const bookends = bookendFromAccommodation ? getDayBookendHotels(day, days, accommodations) : null
  const firstStop = located[0]
    ? { isPlace: true, time: located[0].place?.place_time ?? null, lat: located[0].place!.lat!, lng: located[0].place!.lng! }
    : undefined
  const last = located[located.length - 1]
  const lastStop = last
    ? { isPlace: true, time: last.place?.place_time ?? null, lat: last.place!.lat!, lng: last.place!.lng! }
    : undefined
  const morning = bookends && shouldDrawMorningLeg(bookends, day, firstStop, dayHasCarrier)
    && bookends.morning?.place_lat != null && bookends.morning?.place_lng != null
    ? { lat: bookends.morning.place_lat, lng: bookends.morning.place_lng, name: bookends.morning.place_name } : null
  const evening = bookends && shouldDrawEveningLeg(bookends, day, lastStop, dayHasCarrier)
    && bookends.evening?.place_lat != null && bookends.evening?.place_lng != null
    ? { lat: bookends.evening.place_lat, lng: bookends.evening.place_lng, name: bookends.evening.place_name } : null
  return [...(morning ? [morning] : []), ...stops, ...(evening ? [evening] : [])]
}

/** Google-Maps directions URL over the day's bookended stops. */
export function dayGoogleMapsUrl(
  day: Day,
  days: Day[],
  dayAssignments: Assignment[],
  accommodations: Accommodation[],
  bookendFromAccommodation: boolean,
  dayHasCarrier?: boolean,
): string | null {
  return generateGoogleMapsUrl(
    dayExportStops(day, days, dayAssignments, accommodations, bookendFromAccommodation, dayHasCarrier),
  ) || null
}

/** The same stops handed to CoMaps for offline navigation, in the day's travel mode (#1904). */
export function dayCoMapsUrl(
  day: Day,
  days: Day[],
  dayAssignments: Assignment[],
  accommodations: Accommodation[],
  bookendFromAccommodation: boolean,
  profile: RouteProfileKey,
  dayHasCarrier?: boolean,
): string | null {
  return generateCoMapsUrl(
    dayExportStops(day, days, dayAssignments, accommodations, bookendFromAccommodation, dayHasCarrier),
    profile,
  ) || null
}
