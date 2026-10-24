import type { BookPattern } from '@trek/shared';

/**
 * The twelve repeats a pattern paint draws, as plain geometry.
 *
 * Not SVG `<pattern>`: a pattern tile has never been through this print path,
 * and a RIP that rasterises tiles at its own resolution prints seams. Each
 * repeat is drawn out in full instead, as a handful of `<path>` elements whose
 * `d` holds every primitive, and clipped to the shape by the caller. The DOM
 * stays a few nodes per element whatever the scale.
 *
 * Everything is in millimetres in the caller's user space, rounded to
 * hundredths as the document stores its own numbers, and every repeat is
 * capped at `MAX_PATTERN_PRIMITIVES`: past that the cell grows rather than the
 * page, so a tiny scale on a whole spread costs no more than it looks worth.
 */

export const MAX_PATTERN_PRIMITIVES = 2000;
/** The cell of a pattern at scale 1. */
export const PATTERN_CELL_MM = 8;

export interface PatternBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One colour layer: every primitive of it in one path, at a share of the ink's opacity. */
interface PatternLayer {
  d: string;
  opacity: number;
}

interface PatternGeometry {
  layers: PatternLayer[];
  /** How many primitives the layers hold together. */
  count: number;
  /** Turns the drawing about the box's centre; absent when it is not turned. */
  transform?: string;
  /** The cell the repeat was drawn at, after the cap had its say. */
  cell: number;
}

/** Hundredths of a millimetre, and never minus zero, which would print as "-0". */
const r2 = (v: number) => Math.round(v * 100) / 100 || 0;
const f = (v: number) => String(r2(v));

/** Threads per cell each way in linen: fine enough to read as cloth, few enough for a whole page under the cap. */
const LINEN_THREADS = 6;
/** Specks per cell in grain. */
const GRAIN_SPECKS = 3;

/**
 * How many primitives a repeat needs over a region: `area` primitives per
 * cell squared, `lin` per cell along the width and the height. Read before
 * drawing, so the cap moves the cell once instead of drawing twice, and on
 * the high side, so the cap grows the cell rather than leaving a corner of
 * the box undrawn.
 */
const DENSITY: Record<BookPattern, { area: number; lin: number }> = {
  checker: { area: 2, lin: 0 },
  gingham: { area: 0, lin: 1 },
  stripes: { area: 0, lin: 1 },
  pinstripe: { area: 0, lin: 2 },
  dots: { area: 4, lin: 0 },
  polka: { area: 2, lin: 0 },
  zigzag: { area: 2, lin: 0 },
  waves: { area: 2, lin: 0 },
  grid: { area: 0, lin: 2 },
  scales: { area: 2, lin: 0 },
  sunburst: { area: 0, lin: 0 },
  confetti: { area: 1.2, lin: 0 },
  linen: { area: 0, lin: 2 * LINEN_THREADS },
  grain: { area: GRAIN_SPECKS, lin: 0 },
};

/** A primitive count estimate for a repeat over a region at a cell size. */
export function estimatePrimitives(pattern: BookPattern, cell: number, w: number, h: number): number {
  if (pattern === 'sunburst') return sunburstRays(cell);
  const d = DENSITY[pattern];
  // The repeats that need room to tuck in start a cell before the region and end a cell after it.
  const pw = w + cell * 2;
  const ph = h + cell * 2;
  return (d.area * pw * ph) / (cell * cell) + (d.lin * (pw + ph)) / cell;
}

/** The cell a repeat is drawn at: its own, or larger where the cap would be passed. */
export function fittedCell(
  pattern: BookPattern,
  cell: number,
  w: number,
  h: number,
  cap = MAX_PATTERN_PRIMITIVES
): number {
  let c = cell;
  // Two rounds cover the linear term, which grows only with the square root.
  for (let i = 0; i < 3; i++) {
    const n = estimatePrimitives(pattern, c, w, h);
    if (n <= cap * 0.95) break;
    c *= Math.sqrt(n / (cap * 0.95)) * 1.02;
  }
  return c;
}

/** Collects primitives into a path, refusing any past the cap. */
class Pen {
  parts: string[] = [];
  count = 0;
  constructor(private readonly cap: number) {}

  get full(): boolean {
    return this.count >= this.cap;
  }

  private push(d: string) {
    if (this.full) return;
    this.parts.push(d);
    this.count++;
  }

  rect(x: number, y: number, w: number, h: number) {
    this.push(`M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`);
  }

  circle(cx: number, cy: number, r: number) {
    this.push(`M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`);
  }

  polygon(points: readonly (readonly [number, number])[]) {
    if (points.length < 3) return;
    this.push(`M${points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}Z`);
  }

  /** Raw path data counted as `n` primitives, for a band drawn as one outline. */
  raw(d: string, n: number) {
    if (this.full) return;
    this.parts.push(d);
    this.count += n;
  }

  get d(): string {
    return this.parts.join('');
  }
}

interface Region {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Values of `start + k * step` from at or below `from` up to `to`, aligned to the region's origin. */
function steps(from: number, to: number, step: number, offset = 0): number[] {
  const out: number[] = [];
  const first = Math.floor((from - offset) / step) * step + offset;
  for (let v = first; v < to && out.length < 4000; v += step) out.push(v);
  return out;
}

type Draw = (pen: Pen, region: Region, cell: number, alt: Pen) => void;

const DRAW: Record<Exclude<BookPattern, 'sunburst'>, Draw> = {
  checker: (pen, g, s) => {
    const half = s / 2;
    steps(g.y0, g.y1, half).forEach((y, j) => {
      steps(g.x0, g.x1, half).forEach((x, i) => {
        if ((i + j) % 2 === 0) pen.rect(x, y, half, half);
      });
    });
  },
  // Two layers of half-opaque bands, so where they cross reads darker: the weave.
  gingham: (pen, g, s, alt) => {
    for (const y of steps(g.y0, g.y1, s)) pen.rect(g.x0, y, g.x1 - g.x0, s / 2);
    for (const x of steps(g.x0, g.x1, s)) alt.rect(x, g.y0, s / 2, g.y1 - g.y0);
  },
  stripes: (pen, g, s) => {
    for (const x of steps(g.x0, g.x1, s)) pen.rect(x, g.y0, s / 2, g.y1 - g.y0);
  },
  pinstripe: (pen, g, s) => {
    const w = Math.max(0.2, s * 0.06);
    for (const x of steps(g.x0, g.x1, s / 2)) pen.rect(x, g.y0, w, g.y1 - g.y0);
  },
  dots: (pen, g, s) => {
    const p = s / 2;
    for (const y of steps(g.y0, g.y1 + p, p))
      for (const x of steps(g.x0, g.x1 + p, p)) pen.circle(x + p / 2, y + p / 2, s * 0.07);
  },
  // A square lattice with a second one in its gaps: the polka of a sundress.
  polka: (pen, g, s) => {
    const r = s * 0.17;
    for (const y of steps(g.y0 - s, g.y1 + s, s)) {
      for (const x of steps(g.x0 - s, g.x1 + s, s)) {
        pen.circle(x, y, r);
        pen.circle(x + s / 2, y + s / 2, r);
      }
    }
  },
  zigzag: (pen, g, s) => {
    const half = s / 2;
    const amp = s / 4;
    const t = s * 0.14;
    for (const y of steps(g.y0 - s, g.y1 + s, s)) {
      const xs = steps(g.x0 - s, g.x1 + s, half);
      const top = xs.map((x, i) => [x, y + (i % 2 ? amp : 0)] as const);
      const bottom = [...top].reverse().map(([x, yy]) => [x, yy + t] as const);
      pen.raw(`M${[...top, ...bottom].map(([x, yy]) => `${f(x)} ${f(yy)}`).join('L')}Z`, Math.max(1, xs.length - 1));
    }
  },
  waves: (pen, g, s) => {
    const half = s / 2;
    const amp = s * 0.18;
    const t = s * 0.12;
    for (const y of steps(g.y0 - s, g.y1 + s, s)) {
      const xs = steps(g.x0 - s, g.x1 + s, half);
      if (xs.length < 2) continue;
      const curve = (dy: number, list: number[], dir: 1 | -1) =>
        list
          .slice(1)
          .map((x, i) => {
            const from = list[i] ?? x;
            const k = dir === 1 ? i : list.length - 2 - i;
            const bend = k % 2 ? amp : -amp;
            return `Q${f((from + x) / 2)} ${f(y + dy + bend)} ${f(x)} ${f(y + dy)}`;
          })
          .join('');
      const back = [...xs].reverse();
      const first = xs[0] ?? 0;
      const last = back[0] ?? 0;
      pen.raw(`M${f(first)} ${f(y)}${curve(0, xs, 1)}L${f(last)} ${f(y + t)}${curve(t, back, -1)}Z`, xs.length - 1);
    }
  },
  grid: (pen, g, s) => {
    const w = Math.max(0.2, s * 0.05);
    for (const x of steps(g.x0, g.x1, s)) pen.rect(x, g.y0, w, g.y1 - g.y0);
    for (const y of steps(g.y0, g.y1, s)) pen.rect(g.x0, y, g.x1 - g.x0, w);
  },
  // Lower half rings in rows half a cell apart, every other row shifted, so each scale tucks under the next.
  scales: (pen, g, s) => {
    const r = s / 2;
    const t = Math.max(0.2, s * 0.08);
    steps(g.y0 - s, g.y1 + s, s / 2).forEach((y, row) => {
      for (const x of steps(g.x0 - s, g.x1 + s, s, row % 2 ? r : 0)) {
        const cx = x + r;
        pen.raw(
          `M${f(cx - r)} ${f(y)}A${f(r)} ${f(r)} 0 0 0 ${f(cx + r)} ${f(y)}` +
            `L${f(cx + r - t)} ${f(y)}A${f(r - t)} ${f(r - t)} 0 0 1 ${f(cx - r + t)} ${f(y)}Z`,
          1
        );
      }
    });
  },
  confetti: (pen, g, s) => {
    const rand = mulberry32(Math.round(s * 1000) + 17);
    const area = (g.x1 - g.x0) * (g.y1 - g.y0);
    const n = Math.round((area / (s * s)) * 1.2);
    for (let i = 0; i < n && !pen.full; i++) {
      const x = g.x0 + rand() * (g.x1 - g.x0);
      const y = g.y0 + rand() * (g.y1 - g.y0);
      const turn = rand() * Math.PI;
      if (rand() < 0.35) {
        pen.circle(x, y, s * (0.04 + rand() * 0.03));
        continue;
      }
      const len = s * (0.12 + rand() * 0.1);
      const wid = s * 0.05;
      const cos = Math.cos(turn);
      const sin = Math.sin(turn);
      const corner = (u: number, v: number) => [x + u * cos - v * sin, y + u * sin + v * cos] as const;
      pen.polygon([
        corner(-len / 2, -wid / 2),
        corner(len / 2, -wid / 2),
        corner(len / 2, wid / 2),
        corner(-len / 2, wid / 2),
      ]);
    }
  },
  // Threads of uneven weight both ways, on two half-clear layers: where they cross the cloth reads denser.
  linen: (pen, g, s, alt) => {
    const rand = mulberry32(Math.round(s * 1000) + 31);
    const pitch = s / LINEN_THREADS;
    for (const y of steps(g.y0, g.y1, pitch)) pen.rect(g.x0, y, g.x1 - g.x0, pitch * (0.2 + rand() * 0.35));
    for (const x of steps(g.x0, g.x1, pitch)) alt.rect(x, g.y0, pitch * (0.2 + rand() * 0.35), g.y1 - g.y0);
  },
  // Specks of a few sizes, the larger ones fainter, scattered the same way on every render.
  grain: (pen, g, s, alt) => {
    const rand = mulberry32(Math.round(s * 1000) + 43);
    const n = Math.round((((g.x1 - g.x0) * (g.y1 - g.y0)) / (s * s)) * GRAIN_SPECKS);
    for (let i = 0; i < n && !pen.full && !alt.full; i++) {
      const x = g.x0 + rand() * (g.x1 - g.x0);
      const y = g.y0 + rand() * (g.y1 - g.y0);
      if (rand() < 0.6) pen.circle(x, y, s * (0.012 + rand() * 0.012));
      else alt.circle(x, y, s * (0.025 + rand() * 0.02));
    }
  },
};

/** A seeded generator, so a confetti page draws the same scatter on every render and in print. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** How many rays a sunburst has at a cell size: more as the cell shrinks, between 8 and 72. */
export function sunburstRays(cell: number): number {
  const n = Math.round((24 * PATTERN_CELL_MM) / Math.max(0.1, cell));
  return Math.max(8, Math.min(72, n - (n % 2)));
}

function sunburst(pen: Pen, box: PatternBox, cell: number, angle: number) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  // Past the corners whichever way it turns.
  const reach = Math.hypot(box.w, box.h);
  const n = sunburstRays(cell);
  const step = (Math.PI * 2) / n;
  const start = (angle * Math.PI) / 180 - Math.PI / 2;
  for (let i = 0; i < n; i += 2) {
    const a = start + i * step;
    pen.polygon([
      [cx, cy],
      [cx + Math.cos(a) * reach, cy + Math.sin(a) * reach],
      [cx + Math.cos(a + step) * reach, cy + Math.sin(a + step) * reach],
    ]);
  }
}

/** The repeats drawn on two layers, and how clear each layer is: textures stay quiet over their ground. */
const LAYER_OPACITY: Partial<Record<BookPattern, readonly [number, number]>> = {
  gingham: [0.5, 0.5],
  linen: [0.32, 0.32],
  grain: [0.5, 0.28],
};

/**
 * A repeat over a box. The geometry covers the box however it is turned: the
 * region drawn is the square around the box's circumscribed circle, and the
 * caller turns it with `transform` and clips it to the shape.
 */
export function patternGeometry(
  paint: { pattern: BookPattern; scale: number; angle: number },
  box: PatternBox,
  cap = MAX_PATTERN_PRIMITIVES
): PatternGeometry {
  const empty = { layers: [], count: 0, cell: PATTERN_CELL_MM * paint.scale };
  if (!(box.w > 0 && box.h > 0) || !Number.isFinite(paint.scale) || paint.scale <= 0) return empty;

  const turned = ((paint.angle % 360) + 360) % 360 !== 0;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const radius = Math.hypot(box.w, box.h) / 2;
  const region: Region =
    turned && paint.pattern !== 'sunburst'
      ? { x0: cx - radius, y0: cy - radius, x1: cx + radius, y1: cy + radius }
      : { x0: box.x, y0: box.y, x1: box.x + box.w, y1: box.y + box.h };
  const rw = region.x1 - region.x0;
  const rh = region.y1 - region.y0;
  const cell = fittedCell(paint.pattern, PATTERN_CELL_MM * paint.scale, rw, rh, cap);

  const pen = new Pen(cap);
  if (paint.pattern === 'sunburst') {
    sunburst(pen, box, cell, paint.angle);
    return { layers: [{ d: pen.d, opacity: 1 }], count: pen.count, cell };
  }

  // The second layer holds gingham's and linen's cross bands and grain's larger specks;
  // the cell fitted above keeps both under the cap together.
  const alt = new Pen(cap);
  DRAW[paint.pattern](pen, region, cell, alt);
  const count = pen.count + alt.count;
  const two = LAYER_OPACITY[paint.pattern];
  const layers = two
    ? [
        { d: pen.d, opacity: two[0] },
        { d: alt.d, opacity: two[1] },
      ]
    : [{ d: pen.d, opacity: 1 }];
  return {
    layers: layers.filter((l) => l.d),
    count,
    cell,
    ...(turned ? { transform: `rotate(${f(paint.angle)} ${f(cx)} ${f(cy)})` } : {}),
  };
}
