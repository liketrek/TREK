/**
 * Straight-line distance between two coordinates, in kilometres.
 *
 * Lifted out of useTransportRoutes so the day-route builder can share the one
 * implementation instead of adding a fourth copy. The map overlays keep their own
 * `[lat, lng]`-tuple variants — different call shape, and they only sum arc lengths.
 */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const la1 = a.lat * Math.PI / 180
  const la2 = b.lat * Math.PI / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * How far a day out of a hotel and back plausibly reaches, straight-line.
 *
 * Consulted where a stay records no check-in/check-out time and the shape of the day is
 * therefore a guess (#2157): a stop inside this radius is somewhere the hotel sent you out
 * to for the day, a stop outside it is where you travelled from or to. It has to be a
 * road-day radius rather than the booking-geometry MAX_DRIVE_KM in @trek/shared: 2000 km
 * spans the whole of Europe, so every car journey on the continent passed as a day trip
 * and kept the phantom hotel leg the issue reported.
 */
export const MAX_DAY_TRIP_KM = 150

/** Whether a stop is near enough a hotel to be a day out from it and back. */
export function withinDayTripRange(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return haversineKm(a, b) <= MAX_DAY_TRIP_KM
}
