import { bookLetterMm, textHeightNeeded } from './book-findings';
import { bookTextCurvePath } from './book-text-curve';
import { bookTextIsDrawn } from './book-text-effects.schema';
import type { BookDocument, BookElement, BookSpread, BookTextElement } from './book.schema';

/**
 * Text set to fit its frame, solved when it is edited and stored.
 *
 * A fitted text keeps two sizes: `fitMax`, the size somebody chose, and
 * `size`, the largest size up to it at which the words hold the frame. The
 * renderer reads `size` like any other text, so the page stays synchronous and
 * a reader from before fitting existed draws the fitted size, which is the one
 * that was designed. The solver uses the overflow check's letter measure with
 * `FIT_HEADROOM` on top, so a text it fitted is never reported as overflowing,
 * and the words still hold the frame in the type the page really sets.
 *
 * Who runs it: the Studio after every change to the document, and the edit
 * engine after a page's operations, both through `fitSpreadTexts`. A size that
 * changed in that edit is a new choice and becomes the new `fitMax`; one that
 * did not keeps the old ceiling, so a frame made smaller and then larger again
 * gives the words their size back.
 */

/** The smallest size the solver goes to: the document's own floor. */
const MIN_SIZE = 4;

/**
 * The headroom on letter width a text is fitted with. The letter measure is a
 * family's average letter, and real type runs wider in places: set in the
 * browser, the bold weights of the condensed faces and several scripts came
 * out up to 9 % wider than it, capitals of the heavy display faces about as
 * much. A fit solved at exactly the measure lands on the edge of a line
 * break, so a few percent too wide wraps the last word onto a line the frame
 * has no room for. Eight percent keeps the words inside the frame and costs a
 * fitted text well under one percent of its size on average.
 */
const FIT_HEADROOM = 1.08;

const ptToMm = (pt: number) => (pt * 25.4) / 72;

/** The words as they are cased on the page: what the measure counts and the SVG draws. */
export function bookCasedText(el: Pick<BookTextElement, 'text' | 'transform'>): string {
  if (el.transform === 'upper') return el.text.toUpperCase();
  if (el.transform === 'lower') return el.text.toLowerCase();
  return el.text;
}

/** The lines of a text that is drawn as written: its paragraphs, a curved text's joined into one. */
export function bookDrawnLines(el: Pick<BookTextElement, 'text' | 'transform' | 'curve'>): string[] {
  const lines = bookCasedText(el)
    .split('\n')
    .map((l) => l.trimEnd());
  return el.curve ? [lines.filter(Boolean).join(' ')] : lines;
}

/** How wide a run of characters sets, roughly, in millimetres. */
export function bookTextRunMm(el: BookTextElement, run: string): number {
  return [...run].length * bookLetterMm(el);
}

/** Whether a text at its current size holds its frame, measured with the fit's headroom (`FIT_HEADROOM`). */
export function bookTextFits(el: BookTextElement): boolean {
  if (!el.text.trim()) return true;
  const letter = bookLetterMm(el, FIT_HEADROOM);
  const run = (s: string) => [...s].length * letter;
  if (bookTextIsDrawn(el)) {
    const lines = bookDrawnLines(el);
    const widest = Math.max(0, ...lines.map(run));
    if (el.curve) {
      const path = bookTextCurvePath(el.curve, el.frame.w, el.frame.h, ptToMm(el.size));
      return widest <= path.length * 0.98;
    }
    return widest <= el.frame.w && lines.length * ptToMm(el.size) * el.leading <= el.frame.h * 1.02;
  }
  const longest = Math.max(0, ...bookCasedText(el).split(/\s+/).map(run));
  return longest <= el.frame.w && textHeightNeeded(el, FIT_HEADROOM) <= el.frame.h * 1.02;
}

/** The size a fitted text is set at: its ceiling when that holds, else the largest quarter point that does. */
export function solveBookTextFit(el: BookTextElement, ceiling: number = el.fitMax ?? el.size): number {
  const top = Math.max(MIN_SIZE, ceiling);
  if (bookTextFits({ ...el, size: top })) return top;
  let lo = MIN_SIZE * 4;
  let hi = Math.floor(top * 4) - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (bookTextFits({ ...el, size: mid / 4 })) lo = mid;
    else hi = mid - 1;
  }
  return lo / 4;
}

/** One text fitted, or the same object when it is not fitted or already right. */
function fitted(el: BookElement, before: BookElement | undefined): BookElement {
  if (el.kind !== 'text' || el.fit !== 'shrink') return el;
  const chose = before?.kind === 'text' && before.size !== el.size;
  const ceiling = chose || el.fitMax === undefined ? el.size : el.fitMax;
  const size = solveBookTextFit(el, ceiling);
  return size === el.size && ceiling === el.fitMax ? el : { ...el, size, fitMax: ceiling };
}

/**
 * Every fitted text of a spread set at its solved size. `before` is the spread
 * as it was before the edit, when there was one, to tell a size somebody chose
 * from one the solver set. The same spread comes back when nothing moved.
 */
export function fitSpreadTexts(spread: BookSpread, before?: BookSpread): BookSpread {
  const prior = new Map((before?.elements ?? []).map((e) => [e.id, e]));
  let changed = false;
  const elements = spread.elements.map((el) => {
    const next = fitted(el, prior.get(el.id));
    if (next !== el) changed = true;
    return next;
  });
  return changed ? { ...spread, elements } : spread;
}

/** `fitSpreadTexts` over the spreads an edit changed, against the document before it. */
export function fitBookTexts(next: BookDocument, before: BookDocument | null): BookDocument {
  const prior = new Map((before?.spreads ?? []).map((s) => [s.id, s]));
  let changed = false;
  const spreads = next.spreads.map((sp) => {
    const was = prior.get(sp.id);
    if (was === sp) return sp;
    const out = fitSpreadTexts(sp, was);
    if (out !== sp) changed = true;
    return out;
  });
  return changed ? { ...next, spreads } : next;
}
