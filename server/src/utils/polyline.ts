/**
 * Google-encoded polyline codec, shared by the domains that read one: the
 * transit backends (Google merges a walk split across several steps and needs
 * the encoder to put the joined path back on the wire) and wanderer, whose
 * search results carry each trail's simplified line this way. The client
 * carries its own decoder for drawing on the map
 * (client/src/components/Map/transitGeometry.ts).
 */
export function decodePolyline(encoded: string, precision: number): [number, number][] {
  const factor = 10 ** precision;
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1] as const) {
      let result = 0;
      let shift = 0;
      let byte = 0x20;
      while (byte >= 0x20) {
        if (index >= encoded.length) return points;
        byte = (encoded.codePointAt(index++) ?? 0) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      }
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    points.push([lat / factor, lng / factor]);
  }
  return points;
}

function encodeSigned(value: number): string {
  let remaining = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (remaining >= 0x20) {
    out += String.fromCharCode((0x20 | (remaining & 0x1f)) + 63);
    remaining >>= 5;
  }
  return out + String.fromCharCode(remaining + 63);
}

export function encodePolyline(points: [number, number][], precision: number): string {
  const factor = 10 ** precision;
  let out = '';
  let lastLat = 0;
  let lastLng = 0;
  for (const [lat, lng] of points) {
    const scaledLat = Math.round(lat * factor);
    const scaledLng = Math.round(lng * factor);
    out += encodeSigned(scaledLat - lastLat) + encodeSigned(scaledLng - lastLng);
    lastLat = scaledLat;
    lastLng = scaledLng;
  }
  return out;
}

/** At most `max` points, evenly picked, the first and the last always kept. */
export function thinLine<T>(points: readonly T[], max: number): T[] {
  if (points.length <= max) return [...points];
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}
