import type { BookFinding } from './book-ops.schema';
import { bookShapeTakesEdge } from './book-shapes-more';
import type { BookElement, BookSpread } from './book.schema';

/**
 * The print checks of lines, outlines and cut edges, for spreadFindings.
 *
 * `hairline`: a line or an outline under a tenth of a millimetre. A press
 * holds about that much; below it the line breaks up or disappears, and on
 * screen at any zoom it still looks fine, which is why nobody notices.
 *
 * `edge_unused`: a cut edge set on a shape it is not cut along (a heart, a
 * star). The renderer draws the plain outline, so the setting does nothing,
 * and a model that set it should know.
 */

/** The thinnest line a print shop holds, in millimetres. */
const BOOK_HAIRLINE_MM = 0.1;

const mm = (v: number) => `${Math.round(v * 100) / 100}`;

function hairline(el: BookElement): BookFinding | null {
  const width = el.kind === 'line' ? el.strokeWidth : el.kind === 'shape' && el.stroke ? el.strokeWidth : null;
  if (width === null || width <= 0 || width >= BOOK_HAIRLINE_MM) return null;
  return {
    code: 'hairline',
    severity: 'warn',
    elementIds: [el.id],
    message: `${el.kind} ${el.id} is drawn ${mm(width)} mm thin; under ${BOOK_HAIRLINE_MM} mm a line may not print`,
  };
}

function edgeUnused(el: BookElement): BookFinding | null {
  if (el.kind !== 'shape' && el.kind !== 'photo') return null;
  if (!el.edge || el.edge === 'straight') return null;
  const outline = el.kind === 'shape' ? el.shape : el.mask;
  if (bookShapeTakesEdge(outline)) return null;
  return {
    code: 'edge_unused',
    severity: 'info',
    elementIds: [el.id],
    message: `${el.kind} ${el.id} has a ${el.edge} edge, but ${outline} is not cut along one; it draws its plain outline`,
  };
}

/** Every line, outline and edge finding of one page, in paint order. */
export function strokeFindings(spread: BookSpread): BookFinding[] {
  return spread.elements.flatMap((el) => [hairline(el), edgeUnused(el)].filter((f): f is BookFinding => f !== null));
}
