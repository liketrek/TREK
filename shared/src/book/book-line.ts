import type { BookLineCap } from './book-line.schema';
import type { BookFrame, BookLineElement } from './book.schema';

/**
 * The geometry of a line element, in one place for the editor's handles and
 * the book engine alike: where its points are on the spread, and the frame and
 * fractions that put them back there.
 *
 * A line's points live as fractions of its frame (book-line.schema.ts). The
 * frame is the box around the points, padded so the stroke and its heads stay
 * inside it, and never thinner than `LINE_MIN_EXTENT`: a level rule has no
 * height of its own, and a frame of zero height is one the contract refuses
 * and nobody can click.
 */

type Pt = readonly [number, number];

/** The thinnest a line's frame gets across, so a level rule still has something to hold. */
export const LINE_MIN_EXTENT = 2;

const r2 = (v: number) => Math.round(v * 100) / 100;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

/** How long an end's head is, in millimetres, for a line of this width: readable on a hairline, not a club on a thick one. */
export function bookLineCapSize(width: number): number {
  return r2(1.6 + width * 3.2);
}

/** How far the frame reaches past the points: half the stroke, and most of a head where there is one. */
export function bookLinePad(width: number, caps: readonly BookLineCap[] = []): number {
  const capped = caps.some((c) => c !== 'none');
  return r2(width / 2 + (capped ? bookLineCapSize(width) * 0.6 : 0) + 0.5);
}

function rotate([x, y]: Pt, [cx, cy]: Pt, deg: number): [number, number] {
  if (!deg) return [x, y];
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

/** The points of a line on the spread, in millimetres, its turn applied: where they are drawn. */
export function bookLinePoints(el: Pick<BookLineElement, 'frame' | 'points' | 'rotation'>): [number, number][] {
  const { x, y, w, h } = el.frame;
  const centre: Pt = [x + w / 2, y + h / 2];
  return el.points.map((p) => rotate([x + p.x * w, y + p.y * h], centre, el.rotation));
}

/**
 * The frame and the fractions for points on the spread, the line turned by
 * `rotation`.
 *
 * Turned lines are the reason this is not a bounding box: the frame is
 * measured in the line's own turned axes, and its centre is turned back onto
 * the spread, so every point lands exactly where it was given whatever the
 * angle. A line at 0 degrees is the plain box around its points.
 */
export function bookLineFrame(
  points: readonly Pt[],
  opts: { rotation?: number; pad?: number } = {},
): { frame: BookFrame; points: { x: number; y: number }[] } {
  const rotation = opts.rotation ?? 0;
  const pad = opts.pad ?? 1;
  const local = points.map((p) => rotate(p, [0, 0], -rotation));
  const xs = local.map((p) => p[0]);
  const ys = local.map((p) => p[1]);
  let x0 = Math.min(...xs) - pad;
  let x1 = Math.max(...xs) + pad;
  let y0 = Math.min(...ys) - pad;
  let y1 = Math.max(...ys) + pad;
  if (x1 - x0 < LINE_MIN_EXTENT) {
    const mid = (x0 + x1) / 2;
    x0 = mid - LINE_MIN_EXTENT / 2;
    x1 = mid + LINE_MIN_EXTENT / 2;
  }
  if (y1 - y0 < LINE_MIN_EXTENT) {
    const mid = (y0 + y1) / 2;
    y0 = mid - LINE_MIN_EXTENT / 2;
    y1 = mid + LINE_MIN_EXTENT / 2;
  }
  const w = r2(x1 - x0);
  const h = r2(y1 - y0);
  const [cx, cy] = rotate([(x0 + x1) / 2, (y0 + y1) / 2], [0, 0], rotation);
  const frame = { x: r2(cx - w / 2), y: r2(cy - h / 2), w, h };
  const fractions = local.map(([px, py]) => ({
    x: r4(Math.min(1, Math.max(0, (px - x0) / w))),
    y: r4(Math.min(1, Math.max(0, (py - y0) / h))),
  }));
  return { frame, points: fractions };
}

/** A line refitted around new points on the spread, keeping its turn and padding for its stroke and heads. */
export function bookLineWithPoints<T extends BookLineElement>(el: T, points: readonly Pt[]): T {
  const pad = bookLinePad(el.strokeWidth, [el.startCap, el.endCap]);
  const fit = bookLineFrame(points, { rotation: el.rotation, pad });
  return { ...el, frame: fit.frame, points: fit.points };
}

/** How long the line runs from its first point to its last, in millimetres, along its points. */
export function bookLineLength(points: readonly Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}
