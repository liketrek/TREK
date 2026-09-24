/**
 * The places a stay can be booked at: every place but an imported GPX or KML track,
 * which is a route to follow, not somewhere to sleep.
 *
 * The place a stay already names stays in the list, track or not, so a booking made
 * before tracks were left out still shows what it points at and saves unchanged.
 */
export function stayPlaces<P extends { id: number; route_geometry?: string | null }>(
  places: P[],
  currentPlaceId?: number | string | null,
): P[] {
  return places.filter(place => !place.route_geometry
    || (currentPlaceId != null && currentPlaceId !== '' && String(place.id) === String(currentPlaceId)))
}
