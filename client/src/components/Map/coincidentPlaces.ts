/**
 * Stops that land on the same spot on screen.
 *
 * A trip often models one building as several stops — drop the bags, check in, the
 * museum inside the hotel, the tour — and every one of them carries the same
 * coordinates. No zoom level can pull those apart, so each renderer draws the pile as a
 * single thing instead. This is the grouping the GL side does that with, kept clear of
 * Leaflet and of the GL SDKs so it can be reasoned about without a map.
 *
 * The two renderers fold at deliberately different distances, because a fold costs them
 * different things. Leaflet folds into a cluster bubble that carries a count and fans
 * open on click, so a stop inside one is still reachable and the generous
 * `STACK_RADIUS_PX` is a straight improvement on two pins overlapping. MapLibre and
 * Mapbox have no spiderfy: a folded-away stop there has no marker at all, and with it no
 * hover card, no click target, no drag onto a day and no order badge. So the GL side
 * folds at `COINCIDENT_RADIUS_PX`, which reaches no further than pins that are
 * effectively the same point — where nothing was reachable before the fold either. The
 * two numbers are not meant to be brought in line: a fold is only safe where the
 * renderer can undo it.
 */

/**
 * How close two pins have to be before Leaflet stacks them into a cluster.
 *
 * A place pin is 36 px across (44 while selected), so a third of a pin is already
 * enough overlap to swallow whatever is underneath: two stops two metres apart sit
 * about 7 px apart at the map's maximum zoom.
 */
export const STACK_RADIUS_PX = 12

/**
 * How close two pins have to be before the GL renderer draws the pile as one pin.
 *
 * Two pixels is the rounding of a projection rather than a distance on the ground. Pins
 * that close overlap by more than nine tenths of their width, so the buried one had
 * nothing left to hover or click before the fold either. Two stops a few hundred metres
 * apart — the neighbours a city day is made of — sit further apart than that from the
 * overview zooms upwards, and keep a marker each.
 */
export const COINCIDENT_RADIUS_PX = 2

export interface CoincidentGroup<T> {
  /** The one member drawn for the whole group. */
  lead: T
  /** Every member, in id order. */
  members: T[]
}

/**
 * Bundle the items whose projected pixels sit within `COINCIDENT_RADIUS_PX` of each other.
 *
 * `project` is the caller's map: a GL `map.project`, or a plain stub under test. An item
 * it cannot place — no coordinates, a projection that came back NaN — is given a group
 * of its own rather than grouped at the origin or dropped, so a projection that fails
 * costs nobody their pin. Grouping runs in id order so the same input always produces
 * the same groups, and `leadId` (the selected stop, normally) decides which member of a
 * group is the one drawn.
 */
export function groupCoincidentPlaces<T extends { id: number }>(
  items: T[],
  project: (item: T) => { x: number; y: number } | null | undefined,
  leadId: number | null = null,
): CoincidentGroup<T>[] {
  const groups: { members: T[]; at: { x: number; y: number } | null }[] = []
  const unique = new Map(items.map(item => [item.id, item]))
  for (const item of [...unique.values()].sort((a, b) => a.id - b.id)) {
    const point = project(item)
    const at = point && Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null
    // An unplaceable item anchors its group nowhere, so nothing joins it and nothing is
    // folded into it: hiding a pin is only ever allowed where another pin covers it.
    const stack = at && groups.find(group => group.at && Math.hypot(at.x - group.at.x, at.y - group.at.y) < COINCIDENT_RADIUS_PX)
    if (stack) stack.members.push(item)
    else groups.push({ members: [item], at })
  }
  return groups.map(({ members }) => ({
    members,
    lead: members.find(member => member.id === leadId) ?? members[0],
  }))
}
