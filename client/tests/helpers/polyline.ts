/** The router's line as it sends it: Google's polyline encoding at the given precision. */
export function encodePolyline(points: [number, number][], precision: number): string {
  const factor = 10 ** precision;
  let last = [0, 0];
  return points
    .map((point) => {
      const scaled = point.map((value) => Math.round(value * factor));
      const deltas = scaled.map((value, i) => value - last[i]);
      last = scaled;
      return deltas
        .map((delta) => {
          let value = delta < 0 ? ~(delta << 1) : delta << 1;
          let chunk = '';
          while (value >= 0x20) {
            chunk += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
            value >>= 5;
          }
          return chunk + String.fromCharCode(value + 63);
        })
        .join('');
    })
    .join('');
}
