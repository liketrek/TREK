/**
 * Drawing tools for the hand-made shapes: smooth outlines through points,
 * arcs as cubics, strokes that taper, and a seeded random source for the
 * shapes that are meant to look cut by hand.
 *
 * Everything here returns path text in the subset `scalePath` reads (absolute
 * M, L, C, Z, x and y alternating) or plain point lists for it. Coordinates are
 * free: the shape table normalises every path to its 0..100 box afterwards, so
 * a shape is drawn at whatever size its arithmetic is easiest in.
 */

export type Pt = [number, number];

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A point as path text, to two decimals. */
export const fmt = ([x, y]: Pt) => `${r2(x)} ${r2(y)}`;

/**
 * Twice the signed area of a ring, with the sign the shape tests read: a ring
 * drawn the way `circle()` is (clockwise on screen) comes out positive.
 */
export function signedArea(pts: readonly Pt[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  }
  return a / 2;
}

/**
 * The ring wound clockwise on screen, the way every outline in the table is.
 *
 * Two parts of one shape that overlap must wind the same way, or under the
 * non-zero fill rule the overlap cancels into a hole.
 */
export function clockwise(pts: readonly Pt[]): Pt[] {
  return signedArea(pts) < 0 ? [...pts].reverse() : [...pts];
}

/** The opposite winding, for the inner ring of a shape with a hole. */
export function anticlockwise(pts: readonly Pt[]): Pt[] {
  return clockwise(pts).reverse();
}

/** A closed polygon through the points, straight between them. */
export function polyPath(pts: readonly Pt[]): string {
  return `M${pts.map(fmt).join('L')}Z`;
}

/**
 * A smooth closed outline through every point: a Catmull-Rom spline written as
 * cubics. `tension` 0 is the plain spline; towards 1 the curve tightens onto
 * the points, which is how a cut-out keeps a crisp tip without a corner.
 *
 * `sharp` names points the outline turns at rather than curves through, the
 * tip of a leaf or the point of a star.
 */
export function smoothPath(pts: readonly Pt[], tension = 0, sharp: ReadonlySet<number> = new Set()): string {
  const n = pts.length;
  const at = (i: number) => pts[((i % n) + n) % n];
  const k = (1 - tension) / 6;
  let d = `M${fmt(at(0))}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k1 = sharp.has(i) ? 0 : k;
    const k2 = sharp.has((i + 1) % n) ? 0 : k;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2];
    d += `C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return `${d}Z`;
}

/** Points on a circle, angles in degrees clockwise from three o'clock (screen convention). */
export function onCircle(cx: number, cy: number, r: number, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/**
 * An arc as cubics, from `a0` to `a1` degrees (either direction), without the
 * move to its start: what follows an `M` or an `L` that already stands there.
 * Split into pieces of at most 90 degrees, where a cubic is exact to 0.03%.
 */
export function arcTo(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const pieces = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
  const step = (a1 - a0) / pieces;
  const h = (4 / 3) * Math.tan((step * Math.PI) / 720) * r;
  let d = '';
  for (let i = 0; i < pieces; i++) {
    const s = a0 + step * i;
    const e = s + step;
    const [sx, sy] = onCircle(cx, cy, r, s);
    const [ex, ey] = onCircle(cx, cy, r, e);
    const sa = (s * Math.PI) / 180;
    const ea = (e * Math.PI) / 180;
    const c1: Pt = [sx - h * Math.sin(sa), sy + h * Math.cos(sa)];
    const c2: Pt = [ex + h * Math.sin(ea), ey - h * Math.cos(ea)];
    d += `C${fmt(c1)} ${fmt(c2)} ${fmt([ex, ey])}`;
  }
  return d;
}

/** A point list along a circular arc, ends included. */
export function arcPoints([cx, cy]: Pt, r: number, [a0, a1]: [number, number], n: number): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => onCircle(cx, cy, r, a0 + ((a1 - a0) * i) / n));
}

/**
 * The outline of a stroke along a centre line, `width(t)` wide at each point
 * (t from 0 to 1 along it): one side out, the other side back. A width of zero
 * at an end gives it a point, which is how a leaf tip or a flourish's tail is
 * cut. Returned as points, wound clockwise, for `smoothPath`.
 */
export function taper(centre: readonly Pt[], width: (t: number) => number): Pt[] {
  const n = centre.length;
  const sideA: Pt[] = [];
  const sideB: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = centre[Math.max(0, i - 1)];
    const b = centre[Math.min(n - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const half = width(n > 1 ? i / (n - 1) : 0) / 2;
    const p = centre[i];
    sideA.push([p[0] + nx * half, p[1] + ny * half]);
    sideB.push([p[0] - nx * half, p[1] - ny * half]);
  }
  // A zero width at an end draws the same point twice; keep one.
  const same = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= 0.01;
  const ring = [...sideA, ...sideB.reverse()].filter((p, i, all) => i === 0 || !same(p, all[i - 1]));
  if (ring.length > 1 && same(ring[0], ring[ring.length - 1])) ring.pop();
  return clockwise(ring);
}

/** A leaf of the laurel and fleuron kind: pointed at both ends, `w` wide, along the line from `a` to `b`. */
export function leafAlong(a: Pt, b: Pt, w: number, bend = 0): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const pts: Pt[] = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const half = (w / 2) * Math.sin(Math.PI * t) ** 0.85 * (1 + bend * (t - 0.5));
    const sag = bend * len * 0.08 * Math.sin(Math.PI * t);
    pts.push([a[0] + dx * t + nx * (half + sag), a[1] + dy * t + ny * (half + sag)]);
  }
  for (let i = steps - 1; i > 0; i--) {
    const t = i / steps;
    const half = (w / 2) * Math.sin(Math.PI * t) ** 0.85 * (1 - bend * (t - 0.5));
    const sag = bend * len * 0.08 * Math.sin(Math.PI * t);
    pts.push([a[0] + dx * t - nx * (half - sag), a[1] + dy * t - ny * (half - sag)]);
  }
  return clockwise(pts);
}

/**
 * A small seeded random source (mulberry32), for the shapes and edges that are
 * meant to look cut by hand. Seeded, so a torn edge tears the same way every
 * time it is drawn, on screen and in the print.
 */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number from a string, the same every time: an element id as the seed of its torn edge. */
export function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
