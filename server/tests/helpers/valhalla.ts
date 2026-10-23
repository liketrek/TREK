/**
 * Valhalla's answers as the router reads them, for suites that stub the
 * routing host behind safeFetchAdminConfigured.
 */

function encodeValue(value: number): string {
  let remaining = value < 0 ? ~(value << 1) : value << 1;
  let encoded = '';
  while (remaining >= 32) {
    encoded += String.fromCharCode((32 | (remaining & 31)) + 63);
    remaining >>>= 5;
  }
  return encoded + String.fromCharCode(remaining + 63);
}

/** A line as Valhalla encodes a leg's shape: a polyline at six decimals. */
export function valhallaPolyline(line: ReadonlyArray<readonly [number, number]>): string {
  let lat = 0;
  let lng = 0;
  return line
    .map(([nextLat, nextLng]) => {
      const [y, x] = [Math.round(nextLat * 1e6), Math.round(nextLng * 1e6)];
      const step = encodeValue(y - lat) + encodeValue(x - lng);
      [lat, lng] = [y, x];
      return step;
    })
    .join('');
}

/** Valhalla's /route answer: one leg per line, each with its length in kilometres and its time in seconds. */
export function valhallaRoute(legs: ReadonlyArray<{ line: Array<[number, number]>; km: number; seconds: number }>) {
  return {
    trip: {
      legs: legs.map(({ line, km, seconds }) => ({
        shape: valhallaPolyline(line),
        summary: { length: km, time: seconds },
      })),
    },
  };
}
