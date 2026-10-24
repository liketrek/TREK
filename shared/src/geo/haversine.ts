/**
 * Great-circle distance in metres.
 *
 * The clamp keeps `asin` defined: floating point can push the argument a hair
 * over 1 for near-antipodal points, and a NaN distance silently fails every
 * comparison it feeds rather than throwing.
 */
export function haversineMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}
