/**
 * Lines that look drawn by hand: a frame, a rule, a circle, hatching, each a
 * little off true the way a pen goes, for the sketch looks of the travel
 * elements.
 *
 * The wobble is seeded from what the element says, never from the clock or
 * Math.random, so a page draws the same every time it is opened and the same
 * in print as on screen. Every function returns an SVG path in the caller's
 * units (the element's millimetres).
 */

/** A small fast generator seeded from a string: the same words always wobble the same way. */
export function seeded(text: string): () => number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The hand that draws: where its wobble comes from, and how far off true a stroke may run. */
export interface Pen {
  rand: () => number;
  wobble: number;
}

/** A box in the caller's units. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A point nudged by up to `w` either way. */
const nudge = (rand: () => number, w: number) => (rand() - 0.5) * 2 * w;

/**
 * A stroke from one point to another that bows a little and overshoots its
 * ends, the way a ruled line drawn freehand does.
 */
export function roughLine(x1: number, y1: number, x2: number, y2: number, { rand, wobble }: Pen): string {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const over = wobble * 0.8;
  const sx = x1 - ux * over * rand() + nudge(rand, wobble * 0.4);
  const sy = y1 - uy * over * rand() + nudge(rand, wobble * 0.4);
  const ex = x2 + ux * over * rand() + nudge(rand, wobble * 0.4);
  const ey = y2 + uy * over * rand() + nudge(rand, wobble * 0.4);
  const mx = (sx + ex) / 2 - uy * nudge(rand, wobble) + nudge(rand, wobble * 0.3);
  const my = (sy + ey) / 2 + ux * nudge(rand, wobble) + nudge(rand, wobble * 0.3);
  return `M${r2(sx)} ${r2(sy)} Q${r2(mx)} ${r2(my)} ${r2(ex)} ${r2(ey)}`;
}

/** A box drawn as four freehand strokes, each running a little past the corner. */
export function roughBox({ x, y, w, h }: Box, pen: Pen): string {
  return [
    roughLine(x, y, x + w, y, pen),
    roughLine(x + w, y, x + w, y + h, pen),
    roughLine(x + w, y + h, x, y + h, pen),
    roughLine(x, y + h, x, y, pen),
  ].join(' ');
}

/** A loop that does not quite close, as a circle drawn in one stroke does. */
export function roughCircle(cx: number, cy: number, r: number, { rand, wobble }: Pen): string {
  const steps = 18;
  const start = rand() * Math.PI * 2;
  const sweep = Math.PI * 2 * (1.04 + rand() * 0.06);
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const a = start + (sweep * i) / steps;
    const rr = r + nudge(rand, wobble);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as const;
  });
  const [first, ...rest] = pts;
  if (!first) return '';
  return `M${r2(first[0])} ${r2(first[1])} ${rest.map(([px, py]) => `L${r2(px)} ${r2(py)}`).join(' ')}`;
}

/**
 * Diagonal hatching across a box, each stroke freehand, for a fill drawn the
 * way a pencil shades rather than flat.
 */
export function hatch({ x, y, w, h }: Box, gap: number, pen: Pen): string {
  const lines: string[] = [];
  for (let d = gap; d < w + h; d += gap) {
    const x1 = x + Math.max(0, d - h);
    const y1 = y + Math.min(h, d);
    const x2 = x + Math.min(w, d);
    const y2 = y + Math.max(0, d - w);
    lines.push(roughLine(x1, y1, x2, y2, pen));
  }
  return lines.join(' ');
}
