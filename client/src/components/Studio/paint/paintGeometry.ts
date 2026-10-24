import type { BookShapeElement } from '@trek/shared';
import { SHAPE_PATHS, scalePath } from '../shapes';
import type { PatternBox } from './patterns';

/** The outlines and lines paint is laid along, in millimetres. */

/** Hundredths of a millimetre, and never minus zero, which would print as "-0". */
export const r2 = (v: number) => Math.round(v * 100) / 100 || 0;

/**
 * Where a linear gradient's line runs over a box, the way CSS places it: through
 * the centre at `angle` (0 towards the top, clockwise), long enough that the
 * first and last stop land on the box's far corners.
 */
export function linearLine(angle: number, box: PatternBox): { x1: number; y1: number; x2: number; y2: number } {
  const a = (angle * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(box.w * dx) + Math.abs(box.h * dy)) / 2;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return { x1: r2(cx - dx * half), y1: r2(cy - dy * half), x2: r2(cx + dx * half), y2: r2(cy + dy * half) };
}

/** A rectangle's outline as path data, with its corners rounded to `radius`. */
export function roundedRectPath(w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (r <= 0) return `M0 0H${r2(w)}V${r2(h)}H0Z`;
  const a = `A${r2(r)} ${r2(r)} 0 0 1`;
  return (
    `M${r2(r)} 0H${r2(w - r)}${a} ${r2(w)} ${r2(r)}V${r2(h - r)}${a} ${r2(w - r)} ${r2(h)}` +
    `H${r2(r)}${a} 0 ${r2(h - r)}V${r2(r)}${a} ${r2(r)} 0Z`
  );
}

/** An ellipse filling a box, as path data. */
export function ellipsePath(w: number, h: number): string {
  const rx = r2(w / 2);
  const ry = r2(h / 2);
  return `M0 ${ry}A${rx} ${ry} 0 1 0 ${r2(w)} ${ry}A${rx} ${ry} 0 1 0 0 ${ry}Z`;
}

/** The dash a stroke style draws, proportional to the stroke so its rhythm holds at any width. */
export function strokeDash(style: BookShapeElement['strokeStyle'], sw: number): string | undefined {
  if (style === 'dashed') return `${sw * 3} ${sw * 2}`;
  if (style === 'dotted') return `${sw * 0.01} ${sw * 2}`;
  return undefined;
}

/** The outline of a shape in a box of `w` × `h` millimetres. */
export function shapeOutline(
  el: Pick<BookShapeElement, 'shape' | 'radius'>,
  w: number,
  h: number,
  inset: number
): string {
  if (el.shape === 'rect') return roundedRectPath(w, h, Math.max(0, el.radius - inset));
  if (el.shape === 'ellipse') return ellipsePath(w, h);
  return scalePath(SHAPE_PATHS[el.shape], w, h);
}
