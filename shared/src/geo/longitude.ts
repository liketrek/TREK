/**
 * A longitude brought back onto the one real world, in [-180, 180].
 *
 * A map that repeats the world sideways (Leaflet and MapLibre both do) reports a
 * point on a neighbouring copy as, say, -220 or 274.9 instead of 140 or -85.1.
 * Stored like that, a place sat on its copy for good: the geocoder found nothing
 * there, and a route to a place on the real world ran across the whole map (#2976).
 *
 * The edges are kept as given, so a stored -180 or 180 does not flip sides. A
 * value that is not a finite number is returned untouched, for the caller's own
 * validation to deal with.
 */
export function wrapLongitude(lng: number): number {
  if (!Number.isFinite(lng) || (lng >= -180 && lng <= 180)) return lng;
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
  // -0 reads as 0 everywhere else; keep it out of storage and snapshots.
  return wrapped === 0 ? 0 : wrapped;
}

/** wrapLongitude for an optional column: null and undefined pass through. */
export function wrapOptionalLongitude<T extends number | null | undefined>(lng: T): T {
  return (typeof lng === 'number' ? wrapLongitude(lng) : lng) as T;
}
