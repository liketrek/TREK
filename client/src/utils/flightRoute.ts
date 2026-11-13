/** A point on the globe, degrees. */
export interface LatLng {
  lat: number;
  lng: number;
}

const RAD = Math.PI / 180;

function toVector({ lat, lng }: LatLng): [number, number, number] {
  const φ = lat * RAD;
  const λ = lng * RAD;
  return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
}

/**
 * The great circle from `a` to `b` in `steps` equal pieces: the line an
 * airliner roughly flies, which on a flat map bows towards the pole. The
 * longitudes run on without a jump, so a route across the date line stays one
 * line (Leaflet draws 190° as just past 180°) instead of wrapping round the map.
 */
export function greatCircle(a: LatLng, b: LatLng, steps = 64): LatLng[] {
  const va = toVector(a);
  const vb = toVector(b);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const ω = Math.acos(dot);
  if (ω < 1e-9) return [a, b];
  const points: LatLng[] = [];
  let lastLng = a.lng;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ka = Math.sin((1 - t) * ω) / Math.sin(ω);
    const kb = Math.sin(t * ω) / Math.sin(ω);
    const x = ka * va[0] + kb * vb[0];
    const y = ka * va[1] + kb * vb[1];
    const z = ka * va[2] + kb * vb[2];
    const lat = Math.atan2(z, Math.hypot(x, y)) / RAD;
    let lng = Math.atan2(y, x) / RAD;
    while (lng - lastLng > 180) lng -= 360;
    while (lng - lastLng < -180) lng += 360;
    lastLng = lng;
    points.push({ lat, lng });
  }
  return points;
}

/** Initial bearing from `a` towards `b`, degrees clockwise from north. */
export function bearing(a: LatLng, b: LatLng): number {
  const φ1 = a.lat * RAD;
  const φ2 = b.lat * RAD;
  const Δλ = (b.lng - a.lng) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/** The route cut at `progress` (0 to 1): what is flown, what is left, and the point and heading in between. */
export function splitRoute(
  route: LatLng[],
  progress: number
): { flown: LatLng[]; ahead: LatLng[]; at: LatLng; heading: number } {
  const last = route.length - 1;
  const exact = Math.min(1, Math.max(0, progress)) * last;
  const i = Math.min(last - 1, Math.floor(exact));
  const f = exact - i;
  const p = route[i];
  const q = route[i + 1];
  const at = { lat: p.lat + (q.lat - p.lat) * f, lng: p.lng + (q.lng - p.lng) * f };
  return { flown: [...route.slice(0, i + 1), at], ahead: [at, ...route.slice(i + 1)], at, heading: bearing(p, q) };
}
