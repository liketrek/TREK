import { TRACK_COLOR_FALLBACK } from '@trek/shared'
import type { Place } from '../../types'

/**
 * The colour a track's polyline is drawn in (#776): a manually picked colour
 * wins, then the category colour, then the blue every imported track used to
 * get. Both map renderers and the sidebar chip go through here so a track
 * never reads as one colour in the list and another on the map.
 *
 * `category_color` is a SQL alias joined onto the row, not part of the place
 * contract, which is why it needs the cast.
 */
export function resolveTrackColor(place: Place): string {
  const withCategory = place as Place & { category_color?: string | null }
  return place.route_color || withCategory.category_color || TRACK_COLOR_FALLBACK
}

/**
 * What the track would fall back to if its colour were cleared — the category
 * colour, or the old blue. Deliberately ignores route_color: this is what the
 * picker's auto cell previews, and previewing the current colour there would
 * promise the opposite of what clicking it does.
 */
export function inheritedTrackColor(place: Place): string {
  const withCategory = place as Place & { category_color?: string | null }
  return withCategory.category_color || TRACK_COLOR_FALLBACK
}

/** True once a track carries a deliberately chosen colour rather than an inherited one. */
export function hasManualTrackColor(place: Place): boolean {
  return Boolean(place.route_color)
}
