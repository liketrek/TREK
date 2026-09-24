import type { RoadtripStopType } from '@trek/shared'
import { projectOntoRoute, type LatLng } from './corridor'

/**
 * What the place form and the planner agree on when a stop is added to a drive by hand.
 *
 * Its own module rather than the section's, so the planner hook can take the shapes and
 * the arithmetic without importing a component: the file stays free of React and of the
 * api client, the way `roadtripModel` and `corridor` do.
 */

/** Where a stop added by hand goes: a card of the rail, and the position in its chain. */
export interface ManualStopTarget {
  dayId: number
  /** Counted along the card's stops, the same index space a corridor hit is placed at. */
  position: number
  /** How far the place sits from the road being driven; zero when nothing has routed. */
  offRouteKm: number
}

/** What the drive looks like from the form: one routed day, by the stops it drives between. */
export interface ServiceStopDay {
  dayId: number
  dayNumber: number
  /** Stop names in driving order. Fewer than two and the day has no leg to sit on. */
  stops: string[]
  /**
   * The road each leg is actually driven on, cut out of the day's line at the two stops
   * it runs between, index-aligned with the leg that leaves `stops[i]`.
   *
   * Absent while a day is between rebuilds, and then no leg of it can say how far the
   * place lies from it. That is a missing measurement, never a distance of zero.
   */
  legLines?: LatLng[][]
}

/** Everything the form needs to ask where a service stop belongs, and nothing else. */
export interface ServiceStopMode {
  /**
   * The kind the form opens on, from what the corridor panel is looking for.
   *
   * Absent or null when the panel had nothing selected, and then `DEFAULT_SERVICE_KIND`
   * stands in. Optional so a caller with no panel behind it stays unchanged.
   */
  defaultKind?: RoadtripStopType | null
  days: ServiceStopDay[]
  /** Where a stop goes at the end of the day the panel is on, routed or not. */
  appendDay: { dayId: number; dayNumber: number; position: number } | null
  /** Where a point falls on the drive, from the planner's own projection. */
  targetFor: (lat: number, lng: number) => ManualStopTarget | null
}

/** One choice in "Add between": a stretch of one day, and the position at its far end. */
export interface ServiceStopLeg {
  /** `<dayId>:<index>`, the value the select round-trips. */
  value: string
  dayId: number
  dayNumber: number
  position: number
  from: string
  to: string
  /**
   * How far the place lies from this stretch of road, or null when nothing measured it.
   *
   * Null and zero are different answers: zero means the place stands on this leg, null
   * means this leg has no drawn road to measure against yet.
   */
  offRouteKm: number | null
}

/** The one choice that is not a stretch of road: the end of the day the panel is on. */
export interface ServiceStopEnd {
  /** `<dayId>:end`, which no leg value can collide with. */
  value: string
  dayId: number
  dayNumber: number
  position: number
}

/** Where the stop lands, in the shape the planner assigns at. */
export interface ServiceStopPlacement {
  dayId: number
  position: number
  /**
   * How far the place sits from the road being driven, on THIS leg.
   *
   * Null where that could not be measured, which is a leg whose drawn road came back
   * empty. Null rather than zero, because zero is a real answer that means the place is
   * on the road, and the note under the select is the one thing that would print it.
   */
  offRouteKm: number | null
}

export interface ServiceStopChoice {
  legs: ServiceStopLeg[]
  /** The end of the panel's own day, always on offer while it has one. */
  end: ServiceStopEnd | null
  /** Whether the form has a point at all. Without one nothing can be put on a drive. */
  located: boolean
  /** What the drive makes of the coordinates, before anybody overruled it. */
  projected: ManualStopTarget | null
  /** The leg the select shows: the one chosen, the one projected, or the nearest. */
  legValue: string
  /** Where it actually goes. Null while there is nowhere at all to put it. */
  placement: ServiceStopPlacement | null
}

/**
 * The kind the form opens on when nothing better is known.
 *
 * Nothing better means the panel had no category switched on at all; normally the form
 * opens on what the corridor is looking for (`manualStopKindFor`), because that is the
 * traveller's own answer rather than a guess. Opening on nothing would be worse than
 * either: a stop left without a kind is a numbered destination that counts in every
 * total, which is the very thing this path exists to avoid.
 */
export const DEFAULT_SERVICE_KIND: RoadtripStopType = 'fuel'

/**
 * Past this far from the road, the projected leg is worth a second look, in kilometres.
 *
 * The same figure `addRoadtripVia` refuses a click at, and here it only prompts, which is
 * the whole difference between placing a via and adding a stop the search missed.
 */
export const OFF_ROUTE_NOTE_KM = 2

/** Sorting key: a leg nothing could measure goes behind every leg that could. */
function nearness(leg: ServiceStopLeg): number {
  return leg.offRouteKm ?? Number.POSITIVE_INFINITY
}

/**
 * Every leg of every routed day, nearest to the place first.
 *
 * Flat rather than per day because a stop belongs to the drive and not to whichever card
 * the panel happens to be showing: the charger the search missed is as likely to be on
 * tomorrow's stretch as on today's.
 *
 * Ordered by how far the place lies from each stretch rather than by trip order, so the
 * preselected leg visibly IS the nearest one and overruling it is an informed choice
 * instead of a guess. With no point to measure from, driving order is the only order
 * there is and the list keeps it.
 */
export function serviceStopLegs(days: ServiceStopDay[], at?: LatLng | null): ServiceStopLeg[] {
  const out: ServiceStopLeg[] = []
  for (const day of days) {
    for (let i = 0; i < day.stops.length - 1; i++) {
      const line = day.legLines?.[i]
      out.push({
        value: `${day.dayId}:${i}`,
        dayId: day.dayId,
        dayNumber: day.dayNumber,
        position: i + 1,
        from: day.stops[i] ?? '',
        to: day.stops[i + 1] ?? '',
        offRouteKm: at && line && line.length > 1 ? projectOntoRoute(at, line)?.offRouteKm ?? null : null,
      })
    }
  }
  // A stable sort, so legs nothing could measure, and legs exactly as far apart, keep the
  // order they are driven in.
  return out.sort((a, b) => (nearness(a) === nearness(b) ? 0 : nearness(a) - nearness(b)))
}

/** The last stretch of one day, for a projection that landed past its final stop. */
function lastLegOf(legs: ServiceStopLeg[], dayId: number): ServiceStopLeg | undefined {
  let last: ServiceStopLeg | undefined
  for (const leg of legs) {
    if (leg.dayId === dayId && (!last || leg.position > last.position)) last = leg
  }
  return last
}

/**
 * Which leg is on offer and where the stop would land, given where the place is.
 *
 * One function rather than two, so what the select shows and what the save writes cannot
 * disagree: a dropdown reading "Hamburg to Berlin" while the stop lands on another day is
 * a lie told quietly.
 *
 * The projection is the DEFAULT and never a gate. The charger this whole path exists for
 * is exactly the one sitting a little too far off the line to be a via, so a distance
 * that would refuse one is accepted here and only preselects the leg it landed nearest.
 */
export function serviceStopChoice(
  mode: ServiceStopMode,
  lat: number | null,
  lng: number | null,
  chosenLeg: string,
): ServiceStopChoice {
  const located = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
  if (!located) {
    // A name on its own cannot be put on a drive. Nothing projects it onto a leg, so
    // every leg is as good an answer as every other, and picking one anyway would file a
    // petrol stop into the middle of a day nobody named. It goes to the trip's places
    // instead, where it can be dragged onto the day it belongs to, and the section says
    // so rather than letting it happen quietly.
    return { legs: [], end: null, located: false, projected: null, legValue: '', placement: null }
  }
  const at: LatLng = { lat, lng }
  const legs = serviceStopLegs(mode.days, at)
  // Always on offer, routed or not: the day the panel is on is the day the traveller is
  // looking at, and a stop meant for it has to be reachable even while its own line is
  // still being drawn and every other day already has one.
  const end: ServiceStopEnd | null = mode.appendDay
    ? { value: `${mode.appendDay.dayId}:end`, ...mode.appendDay }
    : null
  const projected = mode.targetFor(lat, lng)
  // Past a day's last stop the projection names a position no leg carries, because legs
  // run between stops and there is nothing beyond the final one. The day it named is
  // still the right day, so its last stretch is the answer; the first leg of the trip,
  // which is what an unfiltered fallback reaches for, is days and hundreds of kilometres
  // from where the place was measured.
  const projectedLeg = projected
    ? legs.find(leg => leg.dayId === projected.dayId && leg.position === projected.position)
      ?? lastLegOf(legs, projected.dayId)
    : undefined
  // A leg the traveller picked wins: a drive that passes the same junction twice can only
  // be guessed at once, and they are the one who knows which time they mean to stop.
  const chosen = legs.some(leg => leg.value === chosenLeg) || end?.value === chosenLeg
  const legValue = chosen ? chosenLeg : projectedLeg?.value ?? legs[0]?.value ?? end?.value ?? ''
  const leg = legs.find(item => item.value === legValue)
  let placement: ServiceStopPlacement | null = null
  if (leg) {
    // This leg's own measurement first: overruling the projection onto another stretch
    // moves the place relative to the road, and the distance has to move with it.
    //
    // The projection's own figure stands in only for the leg it actually named. It was
    // measured against the day's whole spine rather than that one stretch, which is the
    // same answer for the stretch it landed on and a different answer for any other. A
    // day that drives out and back reaches this: a stop that projects onto the spine
    // before the one ahead of it leaves the slice between them empty, so that leg has
    // no measurement of its own. Borrowing across legs would print a number that
    // belongs to a stretch nobody chose, so anything else reports null and says nothing.
    const isProjected = !!projected && leg.dayId === projected.dayId && leg.position === projected.position
    placement = {
      dayId: leg.dayId,
      position: leg.position,
      offRouteKm: leg.offRouteKm ?? (isProjected ? projected.offRouteKm : null),
    }
  } else if (end && legValue === end.value) {
    placement = { dayId: end.dayId, position: end.position, offRouteKm: 0 }
  }
  return { legs, end, located: true, projected, legValue, placement }
}
