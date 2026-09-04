import type { SnappedWaypoint } from '../../types'

/**
 * The gap between a place and the road the drive actually reaches it from.
 *
 * A router snaps every waypoint to the nearest road before it starts, and OSRM does it
 * with no distance limit. A place set back from the road is therefore driven to from
 * somewhere else, and the line drawn for that drive begins at the somewhere else without
 * saying so — which is what a viewpoint above a valley, a farmhouse down a track or a
 * marina at the end of a pier all look like today: a route that stops short for no
 * visible reason, or worse, one that appears to cut across open ground.
 *
 * Drawn as a dashed spur rather than hidden or silently absorbed, which is the same
 * answer Google gives: the drive ends at the road, the rest is not driving, and the
 * picture should say which is which.
 */

/**
 * Below this, the gap is map precision rather than missing road.
 *
 * Thirty metres is roughly the width of a dual carriageway plus its verge, and a place
 * pinned from an aerial photo lands that far from the centreline it belongs to all the
 * time. Drawing those would put a dash on almost every stop and teach people to ignore
 * the mark entirely.
 */
export const ACCESS_SPUR_MIN_M = 30

/**
 * Above this, the spur is worth a number as well as a line.
 *
 * A quarter of a kilometre is where "the car park is over there" turns into something
 * that changes the plan: a walk with luggage, a locked gate, a track a hire car should
 * not be on. Below it the dash alone says enough.
 */
export const ACCESS_LABEL_MIN_M = 250

/** The two-point line from a place to the road it was routed from, or null if there is none worth drawing. */
export function spurFor(snapped: SnappedWaypoint | undefined | null): [[number, number], [number, number]] | null {
  if (!snapped) return null
  if (!(snapped.meters >= ACCESS_SPUR_MIN_M)) return null
  return [snapped.asked, snapped.at]
}

/** Whether this gap is far enough that the rail should print the distance beside it. */
export function spurWorthLabelling(meters: number | null | undefined): boolean {
  return typeof meters === 'number' && meters >= ACCESS_LABEL_MIN_M
}
