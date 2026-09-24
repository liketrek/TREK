/** A place the map can go to. */
export interface MapTarget {
  id: number
  lat?: number | null
  lng?: number | null
}

/**
 * Where the map goes when a place is selected, the same in both renderers.
 *
 * Its pin first, then the open day's stop, then the selected place itself. A filter
 * that hides the pin (Unplanned, a category) keeps the pin off the map but not the
 * map away from the place, and a stay shown as a chip in the day list is neither a
 * pin under Unplanned nor one of the day's stops, so a click on it used to leave the
 * map where it was while a click on a stop moved it (#2488).
 */
export function selectedPlaceTarget<P extends MapTarget>(
  selectedPlaceId: number | null | undefined,
  places: P[],
  dayPlaces: P[],
  selectedPlace?: P | null,
): P | null {
  if (!selectedPlaceId) return null
  return places.find(p => p.id === selectedPlaceId)
    ?? dayPlaces.find(p => p.id === selectedPlaceId)
    ?? (selectedPlace?.id === selectedPlaceId ? selectedPlace : null)
}
