import './selectedMarker.css'
import { safeHexColor } from '../../utils/safeColor'

/**
 * Two ways a place marker can be told apart from the rest, set on the place object the
 * planner hands to the map. Underscored because they are the map's reading of the plan,
 * never fields of a stored place.
 */
export interface PlaceMarkerFlags {
  /** Not planned into any day, drawn small and without its photo (#2024). */
  _compact?: boolean
  /** Its stay's booking still waits for a confirmation (#2281). */
  _pending?: boolean
}

export interface PlaceMarkerLook {
  size: number
  borderWidth: number
  showPhoto: boolean
  showRating: boolean
  iconSize: number
  /** Extra CSS for the round marker: a dashed ring and a faded face for a pending stay. */
  circleCss: string
  /** Part of the icon cache key, so a changed look is never served from the cache. */
  key: string
}

/**
 * How a place marker is drawn, the same way on the Leaflet and the GL map. A selected
 * marker always shows in full: whatever made it quiet, it is the one being looked at.
 */
export function placeMarkerLook(place: PlaceMarkerFlags, selected: boolean): PlaceMarkerLook {
  const compact = !!place._compact && !selected
  const pending = !!place._pending
  return {
    size: selected ? 44 : compact ? 24 : 36,
    borderWidth: selected ? 3 : compact ? 2 : 2.5,
    showPhoto: !compact,
    showRating: !compact,
    iconSize: selected ? 18 : compact ? 12 : 15,
    circleCss: pending ? 'border-style:dashed;opacity:0.62;' : '',
    key: `${compact ? 'c' : ''}${pending ? 'p' : ''}`,
  }
}

/**
 * How the selected place stands out from every other pin, the same on both renderers.
 *
 * Map paint rather than theme: it sits on tiles that are light, dark or a photo, beside
 * pins whose border is their category colour. The old near-black border and grey halo
 * vanished on dark tiles (#2991); a white border inside a saturated blue ring reads on
 * all of them, and the class adds a slow pulse (selectedMarker.css) that stops under reduced motion.
 */
export const SELECTED_MARKER = {
  border: '#ffffff', // theme-lint-disable: map paint, has to read on any tile
  ring: '0 0 0 3px #0a84ff, 0 4px 14px rgba(0,0,0,0.35)',
  className: 'trek-marker-selected',
} as const

/** The border colour and shadow of a round place marker, selected or not. */
export function placeMarkerFrame(
  selected: boolean,
  categoryColor: string | null | undefined
): { borderColor: string; shadow: string; className: string } {
  return selected
    ? { borderColor: SELECTED_MARKER.border, shadow: SELECTED_MARKER.ring, className: SELECTED_MARKER.className }
    : { borderColor: safeHexColor(categoryColor, 'white'), shadow: '0 2px 8px rgba(0,0,0,0.22)', className: '' }
}
