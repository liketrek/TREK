import { bookElementId } from './book-ids';
import {
  MAX_BOOK_TITLE,
  bookPageSetupSchema,
  type BookDocument,
  type BookPageSetup,
  type BookSpread,
} from './book.schema';

/**
 * The pages of a book as a whole: which ones are fixed, where an inner spread
 * may go, and the book a journey starts from.
 *
 * Shared because the Studio and the server's book tools must agree on all
 * three: a page the editor refuses to move must be one the assistant cannot
 * move either.
 */

/**
 * Whether a spread may be moved, deleted or duplicated at all.
 *
 * The cover and the back cover are fixed points: a book has exactly one of
 * each, they are single pages rather than spreads. The single first and last
 * pages inside them are fixed the same way (#2317): a bound book opens onto one
 * right-hand page and closes on one left-hand page, and moving either into the
 * middle of the book would put a half-width page between two spreads. So only
 * the inner spreads between them count, and this is the one place that decides
 * what counts as inner.
 */
export function canEditSpread(spread: BookSpread | null | undefined): boolean {
  return !!spread && spread.role === 'inner';
}

/**
 * Where an inner spread may go: after the cover and the first page, before
 * the last page and the back cover.
 *
 * Read from the document each time rather than assumed, because a book from
 * before the single first page existed has none, and a book with no covers at
 * all (the tests build those) has nothing to stay inside of. The lower bound
 * is not decoration either: a book with no inner spreads yet reports its last
 * inner one as -1, which asked for a page at 0: in front of the cover, where
 * it could not be moved back from, because a move only ever swaps with
 * another inner spread.
 */
export function innerSpreadBounds(spreads: readonly BookSpread[]): { first: number; limit: number } {
  let first = 0;
  for (let i = 0; i < spreads.length; i++) {
    const role = spreads[i]?.role;
    if (role === 'cover' || role === 'first') first = i + 1;
    else break;
  }
  let limit = spreads.length;
  for (let i = spreads.length - 1; i >= 0; i--) {
    const role = spreads[i]?.role;
    if (role === 'back' || role === 'last') limit = i;
    else break;
  }
  return { first, limit: Math.max(first, limit) };
}

/**
 * A page with nothing on it, of the given kind.
 *
 * The first and the last page of a book are laid down empty on purpose: the
 * first is where a title page or a dedication goes, the last where a colophon
 * does, and neither is something a layout should decide for a person.
 */
export function blankSpread(role: BookSpread['role'], newId: (prefix: string) => string = bookElementId): BookSpread {
  return { id: newId('sp'), role, background: null, elements: [], parked: [], entryId: null };
}

interface BookPageSize {
  pageWidth: number;
  pageHeight: number;
  bleed: number;
  safe: number;
}

/**
 * The formats a book is made in, in millimetres: what a print shop binds.
 *
 * The Studio's format picker (client/src/components/Studio/pagePresets.ts)
 * carries the same sizes with its labels; a client test holds the two equal.
 * A setup parsed from a preset name alone gets the default square page, which
 * is why a new book in another format reads its size from here.
 */
export const BOOK_PAGE_PRESET_SIZES: Record<BookPageSetup['preset'], BookPageSize> = {
  'square-210': { pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
  'square-300': { pageWidth: 300, pageHeight: 300, bleed: 3, safe: 5 },
  'a4-landscape': { pageWidth: 297, pageHeight: 210, bleed: 3, safe: 5 },
  'a4-portrait': { pageWidth: 210, pageHeight: 297, bleed: 3, safe: 5 },
  'a5-landscape': { pageWidth: 210, pageHeight: 148, bleed: 3, safe: 5 },
  custom: { pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
};

/** The page setup of a format, at its size. */
export function bookPageSetupForPreset(preset: BookPageSetup['preset']): BookPageSetup {
  return bookPageSetupSchema.parse({ preset, ...BOOK_PAGE_PRESET_SIZES[preset] });
}

/**
 * A book nobody has laid out yet: a cover, the first page, one empty spread,
 * the last page and the back cover.
 *
 * What a journey with no book opens on in the Studio, and what the assistant's
 * `create_book` writes. The covers are here rather than left out because a book
 * has them and there is no other way to add one: the pages rail only inserts
 * inner spreads, between the two. The single first and last pages likewise
 * (#2317). Empty, though, in the same way the spread between them is.
 *
 * `startAt` numbers the first page inside the covers. A book from before the
 * single first page existed opened straight onto a spread and started at 2;
 * with a first page in front of that spread the first page is page 1, so a book
 * laid down here starts there, whatever the setup it was handed said. Nothing
 * else of the setup is touched. Without a setup, `preset` names the format
 * (the assistant's `create_book`); without either it is the default square.
 */
export function blankBook(input: {
  title: string;
  page?: BookPageSetup;
  preset?: BookPageSetup['preset'];
  newId?: (prefix: string) => string;
}): BookDocument {
  const page = input.page ?? bookPageSetupForPreset(input.preset ?? 'square-210');
  const newId = input.newId ?? bookElementId;
  return {
    version: 1,
    title: input.title.slice(0, MAX_BOOK_TITLE),
    page: { ...page, pageNumbers: { ...page.pageNumbers, startAt: 1 } },
    spreads: (['cover', 'first', 'inner', 'last', 'back'] as const).map((role) => blankSpread(role, newId)),
  };
}
