import { type BookLineCap, type BookLineElement, type BookLineOrnament, bookLineCapSize } from '@trek/shared';

import { type Pt, seeded, seedOf } from './shapeDraw';

/**
 * A line element as geometry: the stroked body and the parts drawn on it, in
 * the millimetres of its own frame. LineView turns this into SVG; the panel's
 * previews draw the same thing at tile size.
 *
 * Everything is a path, never an SVG `<marker>`. A marker is sized in the
 * stroke's own units and drawn by rules browsers and print engines have never
 * agreed on, while a path is exactly where it says it is, in every one of
 * them and in the PDF.
 *
 * ── The order things happen in ───────────────────────────────────────────
 *
 * 1. The points become a centre line: straight between them, or a smooth
 *    curve through them.
 * 2. The body is cut back where a head sits on an end, so a thick line does
 *    not poke through the point of its own arrow, and opened in the middle
 *    where an ornament sits.
 * 3. A wave or a zigzag is laid along it, then the hand-drawn wobble.
 * 4. Heads and the ornament are placed on the clean centre line, so they
 *    point the way the line goes rather than the way the last wiggle went.
 */

export interface LineGeometry {
  /** The stroked parts of the body: one, or two either side of an ornament. */
  body: string[];
  /** Shapes filled in the line's colour: a filled head, a dot, the ornament. */
  fills: string[];
  /** Strokes drawn at the line's own width beside the body: an open head, a bar. */
  strokes: string[];
  dash: string | undefined;
  cap: 'round' | 'butt';
}

type LineLook = Pick<
  BookLineElement,
  'points' | 'curve' | 'strokeWidth' | 'dash' | 'squiggle' | 'startCap' | 'endCap' | 'wobble' | 'ornament'
>;

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = ([x, y]: Pt) => `${r2(x)} ${r2(y)}`;
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** A Catmull-Rom curve through the points, sampled about every half millimetre. */
function smoothThrough(pts: readonly Pt[]): Pt[] {
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(6, Math.min(120, Math.ceil(dist(p1, p2) / 0.5)));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const at = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([at(p0[0], p1[0], p2[0], p3[0]), at(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/** Cumulative lengths along a polyline. */
function lengths(pts: readonly Pt[]): number[] {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + dist(pts[i - 1], pts[i]));
  return out;
}

/** The point and the direction `s` millimetres along a polyline. */
function along(pts: readonly Pt[], acc: readonly number[], s: number): { p: Pt; dir: Pt } {
  let i = 1;
  while (i < pts.length - 1 && acc[i] < s) i++;
  const a = pts[i - 1];
  const b = pts[i];
  const seg = acc[i] - acc[i - 1] || 1;
  const t = Math.min(1, Math.max(0, (s - acc[i - 1]) / seg));
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: [(b[0] - a[0]) / seg, (b[1] - a[1]) / seg] };
}

/** The part of a polyline between two lengths along it, resampled no coarser than `step`. */
function slice(pts: readonly Pt[], acc: readonly number[], from: number, to: number, step: number): Pt[] {
  if (to - from <= 0.01) return [];
  const n = Math.max(1, Math.ceil((to - from) / step));
  const out: Pt[] = [];
  // Every original corner inside the slice stays, or a zigzag of points loses its corners.
  const marks = new Set<number>();
  for (let k = 0; k <= n; k++) marks.add(from + ((to - from) * k) / n);
  for (const s of acc) if (s > from && s < to) marks.add(s);
  for (const s of [...marks].sort((a, b) => a - b)) out.push(along(pts, acc, s).p);
  return out;
}

/** Lay a wave or a zigzag along a centre line. */
function squiggled(pts: Pt[], kind: LineLook['squiggle'], width: number): Pt[] {
  if (kind === 'none' || pts.length < 2) return pts;
  const acc = lengths(pts);
  const total = acc[acc.length - 1];
  const wave = Math.max(3, width * 8);
  const periods = Math.max(1, Math.round(total / wave));
  const lambda = total / periods;
  const amp = Math.max(0.8, width * 2.2);
  const step = kind === 'zigzag' ? lambda / 4 : Math.min(0.5, lambda / 12);
  const out: Pt[] = [];
  for (let s = 0; s <= total + 1e-6; s += step) {
    const { p, dir } = along(pts, acc, s);
    const phase = s / lambda;
    const off = kind === 'wave' ? Math.sin(phase * Math.PI * 2) : [0, 1, 0, -1][Math.round(phase * 4) % 4];
    // Calmer over the last half wave at each end, so the line runs straight into a head.
    const hold = kind === 'wave' ? Math.min(1, s / (lambda / 2), (total - s) / (lambda / 2)) : 1;
    out.push([p[0] - dir[1] * amp * off * hold, p[1] + dir[0] * amp * off * hold]);
  }
  return out;
}

/** The tremor of a line drawn by hand: a slow sideways drift, the same every time for the same element. */
function wobbled(pts: Pt[], amount: number, width: number, seed: number): Pt[] {
  if (amount <= 0 || pts.length < 2) return pts;
  const rnd = seeded(seed);
  const acc = lengths(pts);
  const total = acc[acc.length - 1];
  const knots = Array.from({ length: Math.ceil(total / 9) + 3 }, () => rnd() * 2 - 1);
  const drift = (s: number) => {
    const x = s / 9;
    const k = Math.floor(x);
    const f = x - k;
    const e = f * f * (3 - 2 * f);
    return knots[k] * (1 - e) + knots[k + 1] * e;
  };
  const amp = amount * (0.5 + width * 1.2);
  const dense = slice(pts, acc, 0, total, 0.6);
  const dacc = lengths(dense);
  return dense.map((p, i) => {
    const { dir } = along(dense, dacc, dacc[i]);
    // Held still at the very ends, so a hand-drawn arrow still meets its head.
    const hold = Math.min(1, dacc[i] / 3, (total - dacc[i]) / 3);
    const off = drift(dacc[i]) * amp * hold;
    return [p[0] - dir[1] * off, p[1] + dir[0] * off] as Pt;
  });
}

const path = (pts: readonly Pt[]) => (pts.length < 2 ? '' : `M${pts.map(fmt).join('L')}`);
const closed = (pts: readonly Pt[]) => `${path(pts)}Z`;

/** A circle as a closed path, four cubics. */
function disc([cx, cy]: Pt, r: number): string {
  const k = r * 0.5523;
  return (
    `M${fmt([cx, cy - r])}C${fmt([cx + k, cy - r])} ${fmt([cx + r, cy - k])} ${fmt([cx + r, cy])}` +
    `C${fmt([cx + r, cy + k])} ${fmt([cx + k, cy + r])} ${fmt([cx, cy + r])}` +
    `C${fmt([cx - k, cy + r])} ${fmt([cx - r, cy + k])} ${fmt([cx - r, cy])}` +
    `C${fmt([cx - r, cy - k])} ${fmt([cx - k, cy - r])} ${fmt([cx, cy - r])}Z`
  );
}

/** A point `a` along the direction and `b` across it from `p`. */
const at = (p: Pt, dir: Pt, a: number, b: number): Pt => [
  p[0] + dir[0] * a - dir[1] * b,
  p[1] + dir[1] * a + dir[0] * b,
];

/** How far a head cuts the body back from its end. */
function capTrim(cap: BookLineCap, size: number, width: number): number {
  if (cap === 'arrow') return size * 0.7;
  if (cap === 'open') return width * 0.5;
  return 0;
}

/** A head at `tip`, pointing along `dir` (the way the line arrives there). */
function capShape(
  cap: BookLineCap,
  [tip, dir]: [Pt, Pt],
  { size, width }: { size: number; width: number },
  g: LineGeometry
): void {
  if (cap === 'arrow') {
    g.fills.push(
      closed([tip, at(tip, dir, -size, size * 0.42), at(tip, dir, -size * 0.78, 0), at(tip, dir, -size, -size * 0.42)])
    );
  } else if (cap === 'open') {
    const back = size * 0.9;
    g.strokes.push(path([at(tip, dir, -back, back * 0.55), tip, at(tip, dir, -back, -back * 0.55)]));
  } else if (cap === 'dot') {
    g.fills.push(disc(tip, Math.max(width * 1.6, 0.8)));
  } else if (cap === 'bar') {
    g.strokes.push(path([at(tip, dir, 0, size * 0.45), at(tip, dir, 0, -size * 0.45)]));
  }
}

/** The motif in the middle, centred on `p` and turned along the line. */
function ornamentShape(kind: BookLineOrnament, p: Pt, dir: Pt, size: number): string {
  const s = size / 2;
  switch (kind) {
    case 'diamond':
      return closed([at(p, dir, -s, 0), at(p, dir, 0, -s * 0.62), at(p, dir, s, 0), at(p, dir, 0, s * 0.62)]);
    case 'dot':
      return disc(p, s * 0.55);
    case 'star': {
      const pts: Pt[] = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (Math.PI / 5) * i;
        const r = i % 2 === 0 ? s : s * 0.42;
        pts.push([p[0] + r * Math.cos(a), p[1] + r * Math.sin(a)]);
      }
      return closed(pts);
    }
    case 'sun': {
      const pts: Pt[] = [];
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI / 12) * i;
        const r = i % 2 === 0 ? s : s * 0.62;
        pts.push([p[0] + r * Math.cos(a), p[1] + r * Math.sin(a)]);
      }
      return closed(pts);
    }
    case 'heart': {
      const pts: Pt[] = [];
      for (let i = 0; i < 32; i++) {
        const t = (i / 32) * Math.PI * 2;
        const x = (16 * Math.sin(t) ** 3) / 17;
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
        pts.push([p[0] + x * s, p[1] + y * s]);
      }
      return closed(pts);
    }
    default:
      return '';
  }
}

/** The dash pattern for a line of this width, in millimetres, kept visible on a hairline. */
export function lineDash(dash: BookLineElement['dash'], width: number): string | undefined {
  if (dash === 'dashed') return `${r2(Math.max(width * 3, 1.2))} ${r2(Math.max(width * 2, 0.9))}`;
  if (dash === 'dotted') return `0.01 ${r2(Math.max(width * 2, 0.6))}`;
  return undefined;
}

/** The whole line, in the millimetres of a frame `w` by `h`. */
export function lineGeometry(el: LineLook, w: number, h: number, id = 'line'): LineGeometry {
  const width = el.strokeWidth;
  const raw = el.points.map((p) => [p.x * w, p.y * h] as Pt);
  const centre = el.curve === 'smooth' && raw.length > 2 ? smoothThrough(raw) : raw;
  const acc = lengths(centre);
  const total = acc[acc.length - 1];
  const size = bookLineCapSize(width);
  const g: LineGeometry = {
    body: [],
    fills: [],
    strokes: [],
    dash: lineDash(el.dash, width),
    cap: el.dash === 'dotted' || el.wobble > 0 ? 'round' : 'butt',
  };
  if (total < 0.01) return g;

  const start = Math.min(total / 2, capTrim(el.startCap, size, width));
  const end = Math.max(total / 2, total - capTrim(el.endCap, size, width));
  const ornSize = el.ornament === 'none' ? 0 : 2.4 + width * 5;
  const gap = ornSize ? ornSize / 2 + Math.max(1.2, ornSize * 0.45) : 0;
  const mid = total / 2;
  const pieces = gap ? [[start, mid - gap] as const, [mid + gap, end] as const] : [[start, end] as const];

  const seed = seedOf(id);
  pieces.forEach(([from, to], i) => {
    const piece = slice(centre, acc, from, to, el.squiggle === 'none' && !el.wobble ? Infinity : 0.5);
    const body = wobbled(squiggled(piece, el.squiggle, width), el.wobble, width, seed + i);
    const d = path(body);
    if (d) g.body.push(d);
  });

  const first = along(centre, acc, Math.min(0.01, total));
  const last = along(centre, acc, Math.max(0, total - 0.01));
  capShape(el.startCap, [centre[0], [-first.dir[0], -first.dir[1]]], { size, width }, g);
  capShape(el.endCap, [centre[centre.length - 1], last.dir], { size, width }, g);
  if (ornSize) {
    const m = along(centre, acc, mid);
    g.fills.push(ornamentShape(el.ornament, m.p, m.dir, ornSize));
  }
  return g;
}
