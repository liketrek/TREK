/** Metres per degree of latitude, the figure the paddle code reckons with throughout. */
const M_PER_DEG = 111_195;

export function metresBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const cos = Math.cos((((aLat + bLat) / 2) * Math.PI) / 180);
  return Math.hypot((bLat - aLat) * M_PER_DEG, (bLng - aLng) * M_PER_DEG * cos);
}

/**
 * A flat frame in metres around one spot, good for the few kilometres a lake
 * or a stretch of river spans: x east, y north.
 */
export class LocalFrame {
  readonly cos: number;

  constructor(
    readonly lat0: number,
    readonly lng0: number,
  ) {
    this.cos = Math.cos((lat0 * Math.PI) / 180);
  }

  x(lng: number): number {
    return (lng - this.lng0) * M_PER_DEG * this.cos;
  }

  y(lat: number): number {
    return (lat - this.lat0) * M_PER_DEG;
  }

  lat(y: number): number {
    return this.lat0 + y / M_PER_DEG;
  }

  lng(x: number): number {
    return this.lng0 + x / (M_PER_DEG * this.cos);
  }
}

/**
 * Where a point falls on a segment: the share along it (clamped to the
 * segment) and the distance to it, in metres.
 */
export function projectOnSegment(
  lat: number,
  lng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): { t: number; distance: number } {
  const cos = Math.cos((lat * Math.PI) / 180);
  const ax = (aLng - lng) * cos;
  const ay = aLat - lat;
  const dx = (bLng - aLng) * cos;
  const dy = bLat - aLat;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length2));
  return { t, distance: Math.hypot(ax + t * dx, ay + t * dy) * M_PER_DEG };
}

/** The length of a [lat, lng] line in metres. */
export function lineLength(points: ReadonlyArray<readonly [number, number]>): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as readonly [number, number];
    const b = points[i] as readonly [number, number];
    total += metresBetween(a[0], a[1], b[0], b[1]);
  }
  return total;
}
