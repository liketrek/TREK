/**
 * The places a stay can be booked at: every place but an imported GPX or KML track
 * or a tour, which is a route to follow, not somewhere to sleep. A city walk saved
 * with its stops only has no line yet and is still a tour.
 *
 * The place a stay already names stays in the list, track or not, so a booking made
 * before tracks were left out still shows what it points at and saves unchanged.
 */
export function stayPlaces<P extends { id: number; route_geometry?: string | null; tour_place_id?: number | null }>(
  places: P[],
  currentPlaceId?: number | string | null,
): P[] {
  return places.filter(place => (!place.route_geometry && place.tour_place_id !== place.id)
    || (currentPlaceId != null && currentPlaceId !== '' && String(place.id) === String(currentPlaceId)))
}
