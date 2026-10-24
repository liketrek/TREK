import { bookLineLength, bookLinePoints } from './book-line';
import type { BookLineElement, BookPhotoElement, BookShapeElement } from './book.schema';

/**
 * The words describe-spread.ts says for a line and for a cut edge: what a
 * model needs to move a line's end or to know a frame is a postage stamp.
 */

const n = (v: number) => `${Math.round(v * 10) / 10}`;

/** A shape's or a photo's cut edge, or nothing when it keeps its drawn outline. */
export function bookEdgeWords(el: Pick<BookShapeElement | BookPhotoElement, 'edge' | 'edgeSize'>): string | null {
  if (!el.edge || el.edge === 'straight') return null;
  return `${el.edge} edge ${n(el.edgeSize ?? 3)} mm`;
}

/** A line: where its points are on the spread, how long it runs, and how it is drawn. */
export function bookLineWords(el: BookLineElement): string {
  const pts = bookLinePoints(el);
  const shown = pts.slice(0, 6).map(([x, y]) => `(${n(x)}, ${n(y)})`);
  const more = pts.length > 6 ? ` and ${pts.length - 6} more` : '';
  const parts = [
    `line through ${shown.join(' ')}${more}, ${n(bookLineLength(pts))} mm long`,
    `${el.stroke} ${n(el.strokeWidth)} mm ${el.dash}`,
  ];
  if (el.curve === 'smooth' && pts.length > 2) parts.push('smooth curve');
  if (el.squiggle !== 'none') parts.push(`drawn as a ${el.squiggle}`);
  if (el.startCap !== 'none' || el.endCap !== 'none') parts.push(`ends ${el.startCap} / ${el.endCap}`);
  if (el.wobble > 0) parts.push(`hand-drawn wobble ${n(el.wobble)}`);
  if (el.ornament !== 'none') parts.push(`${el.ornament} in the middle`);
  return parts.join(', ');
}
