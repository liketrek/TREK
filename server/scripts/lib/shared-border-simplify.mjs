/*
 * Simplify the polygons of one country's regions without opening gaps between them.
 *
 * geoBoundaries ships a "_simplified" file per country, so the Atlas builder normally
 * never simplifies anything itself. A region source that only offers full-detail
 * outlines (Tailte Éireann's counties, #2922) needs it done here, and simplifying each
 * polygon on its own would not do: two neighbours would each drop different points of
 * the border they share, leaving slivers that belong to neither county, and a point in
 * a sliver resolves to no region at all.
 *
 * So the rings are cut into arcs the way TopoJSON does it. A vertex is a junction when
 * it does not have the same two neighbours everywhere it appears: where a shared border
 * starts or ends, or where three regions meet. Between two junctions both sides hold
 * the same run of points, and each arc is simplified (Douglas-Peucker) in one canonical
 * direction, so both sides get the same points back. A ring with no junction at all (an
 * island, or an enclave shared whole with its surroundings) is rotated to a canonical
 * start first, for the same reason.
 *
 * Expects rings that are already quantized (identical borders carry identical
 * coordinates) and closed. A ring left with fewer than three distinct points is dropped,
 * a polygon whose outer ring is dropped goes with its holes, and a geometry with nothing
 * left becomes null.
 */

const key = (pt) => `${pt[0]},${pt[1]}`;

// Squared distance from p to the segment a-b.
function segmentDistance2(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return x * x + y * y;
}

/** Douglas-Peucker over an open polyline; both ends are always kept. */
export function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const tol2 = tolerance * tolerance;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDist = -1;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = segmentDistance2(points[i], points[first], points[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (index !== -1 && maxDist > tol2) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// An arc simplified in its canonical direction, handed back in the direction it came in.
function simplifyArc(arc, tolerance) {
  const head = key(arc[0]);
  const tail = key(arc[arc.length - 1]);
  const reversed = head === tail ? key(arc[1]) > key(arc[arc.length - 2]) : head > tail;
  const canonical = reversed ? arc.slice().reverse() : arc;
  const out = douglasPeucker(canonical, tolerance);
  return reversed ? out.reverse() : out;
}

function polygonsOf(geometry) {
  if (!geometry) return [];
  return geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];
}

// A closed ring without its repeated closing point.
const open = (ring) => (ring.length > 1 && key(ring[0]) === key(ring[ring.length - 1]) ? ring.slice(0, -1) : ring);

/** Every vertex whose neighbours differ between the rings (or places) it appears in. */
function findJunctions(rings) {
  const neighbours = new Map();
  const junctions = new Set();
  for (const ring of rings) {
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const k = key(ring[i]);
      const a = key(ring[(i - 1 + n) % n]);
      const b = key(ring[(i + 1) % n]);
      const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
      const seen = neighbours.get(k);
      if (seen === undefined) neighbours.set(k, pair);
      else if (seen !== pair) junctions.add(k);
    }
  }
  return junctions;
}

function simplifyRing(ring, junctions, tolerance) {
  const n = ring.length;
  const cuts = [];
  for (let i = 0; i < n; i++) if (junctions.has(key(ring[i]))) cuts.push(i);

  let points;
  if (cuts.length === 0) {
    // No junction: start at the smallest vertex so a twin ring starts at the same place.
    let start = 0;
    for (let i = 1; i < n; i++) if (key(ring[i]) < key(ring[start])) start = i;
    const rotated = [...ring.slice(start), ...ring.slice(0, start), ring[start]];
    points = simplifyArc(rotated, tolerance).slice(0, -1);
  } else {
    points = [];
    for (let c = 0; c < cuts.length; c++) {
      const from = cuts[c];
      const to = cuts[(c + 1) % cuts.length];
      const arc = [];
      for (let i = from; ; i = (i + 1) % n) {
        arc.push(ring[i]);
        if (arc.length > 1 && i === to) break;
      }
      points.push(...simplifyArc(arc, tolerance).slice(0, -1));
    }
  }
  if (new Set(points.map(key)).size < 3) return null;
  return [...points, points[0]];
}

/**
 * Simplify every feature's (Multi)Polygon with the given tolerance (in coordinate
 * units), keeping the borders that features share identical on both sides. Returns new
 * features; properties are passed through untouched.
 */
export function simplifySharedBorders(features, tolerance) {
  const rings = features.flatMap((f) => polygonsOf(f.geometry).flatMap((poly) => poly.map(open)));
  const junctions = findJunctions(rings);
  return features.map((f) => {
    const polygons = polygonsOf(f.geometry)
      .map((poly) => {
        const [outer, ...holes] = poly.map((ring) => simplifyRing(open(ring), junctions, tolerance));
        return outer ? [outer, ...holes.filter(Boolean)] : null;
      })
      .filter(Boolean);
    const geometry =
      polygons.length === 0
        ? null
        : polygons.length === 1
          ? { type: 'Polygon', coordinates: polygons[0] }
          : { type: 'MultiPolygon', coordinates: polygons };
    return { ...f, geometry };
  });
}
