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
