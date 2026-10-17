/**
 * Walking time the way hiking signposts in the Alps state it (DIN 33466, as the
 * DAV and the Swiss hiking trails use it): 4 km an hour on the flat, 300 m of
 * climb and 500 m of descent an hour, and of the time for the distance and the
 * time for the height only the larger counts in full, the smaller by half.
 *
 * The router's own estimate is a walking pace along the line and barely sees a
 * slope, so a short steep climb came out far too quick.
 */
const FLAT_KM_PER_HOUR = 4;
const CLIMB_M_PER_HOUR = 300;
const DESCENT_M_PER_HOUR = 500;

export function hikingTimeMinutes(distanceKm: number, climbM: number, descentM: number): number {
  const flat = distanceKm / FLAT_KM_PER_HOUR;
  const height = climbM / CLIMB_M_PER_HOUR + descentM / DESCENT_M_PER_HOUR;
  const hours = Math.max(flat, height) + Math.min(flat, height) / 2;
  return Math.round(hours * 60);
}
