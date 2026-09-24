import { formatDistance } from '../../../../utils/units'
import type { DistanceUnit } from '../../../../types'

/**
 * What the two bars of the road trip tab put in their badges, kept out of their markup.
 *
 * Phone only: the shell's stage header and the stage bar over the map are the two places
 * that draw these figures as badges, and the desktop has neither of them.
 */

/**
 * A distance as a badge reads it, or null when there is nothing to read.
 *
 * Nothing measured is no badge rather than a "0 m" one. A stage sits at zero while its
 * legs are still routing, and a zero in a badge reads as a drive that goes nowhere, which
 * is a claim, where a missing badge only says that the figure is not there yet.
 */
export function distanceBadge(meters: number, unit: DistanceUnit): string | null {
  return Number.isFinite(meters) && meters > 0 ? formatDistance(meters / 1000, unit) : null
}

/**
 * The accessible name of a button made of badges.
 *
 * The eye separates two pills by their edges, but the name a screen reader builds from
 * them runs the texts together ("Sat 2123 km"), so the button spells the separators out.
 * A comma rather than Intl.ListFormat: the parts are facts in a row, not a list with an
 * "and" before its last item, and the client's ES2020 lib does not type that API anyway.
 */
export function badgeLabel(parts: readonly (string | null | undefined)[]): string {
  return parts.filter((part): part is string => !!part).join(', ')
}
