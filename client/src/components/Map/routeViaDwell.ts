/**
 * How long a route via (a charging stop, a rest area a plugin route places on
 * the drawn day) holds the drive, as both map renderers label it: whole
 * minutes, with the hours split off once there are any. One function for both,
 * so the Leaflet tooltip and the GL label cannot disagree on the wording.
 */
export function formatViaDwell(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
