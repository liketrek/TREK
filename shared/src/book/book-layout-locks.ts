import { MAX_SPREAD_ELEMENTS, type BookSpread } from './book.schema';

/**
 * A page laid out again around its locked elements.
 *
 * A lock protects a finished part of a page while the rest is reworked, so a
 * layout arranges only what is not locked: every locked element stays where
 * it is, at its place in the paint order, and a locked group keeps its name
 * through a layout that writes the page's groups anew. One rule for the
 * assistant's `layout` operation and for the Studio's layouts, so a lock holds
 * whichever of them lays the page out.
 *
 * `lay` gets the page without its locked elements and answers it laid out,
 * or null when it lays nothing. The answer is null too when the layout and
 * the locked elements together would not fit on one page.
 */
export function layoutAroundLocks(spread: BookSpread, lay: (free: BookSpread) => BookSpread | null): BookSpread | null {
  const locked = spread.elements.flatMap((el, i) => (el.locked ? [{ el, i }] : []));
  const next = lay({ ...spread, elements: spread.elements.filter((e) => !e.locked) });
  if (!next) return null;
  const elements = next.elements.slice();
  for (const { el, i } of locked) elements.splice(Math.min(i, elements.length), 0, el);
  if (elements.length > MAX_SPREAD_ELEMENTS) return null;
  const have = new Set((next.groups ?? []).map((g) => g.id));
  const lost = (spread.groups ?? []).filter((g) => !have.has(g.id) && locked.some(({ el }) => el.group === g.id));
  return { ...next, elements, ...(lost.length ? { groups: [...(next.groups ?? []), ...lost] } : {}) };
}
