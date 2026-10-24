import { bookElementId } from './book-ids';
import {
  caught,
  checkedSpread,
  createdIds,
  failOp,
  invalidOp,
  round2,
  type BookEditResult,
  type BookOpError,
  type BookOpsContext,
} from './book-ops-core';
import {
  duplicateBookPageRequestSchema,
  removeBookLayoutRequestSchema,
  saveBookLayoutRequestSchema,
  setBookSetupRequestSchema,
} from './book-ops.schema';
import { BOOK_PAGE_PRESET_SIZES, canEditSpread } from './book-pages';
import { bookElementPhotoIds, checkRestorablePhotos } from './book-photo-refs';
import { bookLayoutFromSpread, nextBookLayoutName } from './book-saved-layouts';
import {
  MAX_BOOK_LAYOUTS,
  MAX_SPREADS,
  bookLayoutSchema,
  type BookDocument,
  type BookLayout,
  type BookPageSetup,
} from './book.schema';

/**
 * Operations on the book as a whole rather than on a page: its format and
 * page numbers, a copy of a page, and the book's own layouts. Each takes its
 * tool's arguments, parses them again, and answers a result rather than
 * throwing, like the page operations. What a write changed comes back with it
 * (`previousSetup`, `previousLayout`), so the assistant can set it back.
 */

type BookEditDone = Extract<BookEditResult, { ok: true }>;

export type BookDocOpResult =
  (BookEditDone & { previousSetup?: BookPageSetup; previousLayout?: BookLayout }) | { ok: false; error: BookOpError };

const done = (doc: BookDocument, extra: Partial<BookEditDone> = {}): BookEditDone => ({
  ok: true,
  doc,
  spreadIds: [],
  created: [],
  dropped: [],
  ...extra,
});

const refused = (code: BookOpError['code'], message: string): BookDocOpResult => ({
  ok: false,
  error: { code, message, opIndex: null },
});

/**
 * The format and the page numbers. A preset brings its page size unless a
 * size is given, and a size that is not the preset's makes the format custom;
 * elements are not rescaled, as in the Studio. Choosing a folio colour turns
 * its automatic colour off, as the inspector does.
 */
export function setBookSetup(doc: BookDocument, args: unknown): BookDocOpResult {
  const parsed = setBookSetupRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const a = parsed.data;
  const named = [a.preset, a.pageWidth, a.pageHeight, a.bleed, a.safe, a.pageNumbers].some((v) => v !== undefined);
  if (!named) return refused('invalid_op', 'name at least one field of the setup');
  const before = doc.page;
  const size = a.preset !== undefined && a.preset !== 'custom' ? BOOK_PAGE_PRESET_SIZES[a.preset] : null;
  const numbers = a.pageNumbers ?? {};
  const pickedColour = numbers.color !== undefined && numbers.autoColor === undefined;
  const sized = a.pageWidth !== undefined || a.pageHeight !== undefined;
  const pageWidth = round2(a.pageWidth ?? size?.pageWidth ?? before.pageWidth);
  const pageHeight = round2(a.pageHeight ?? size?.pageHeight ?? before.pageHeight);
  const presetSize = size !== null && pageWidth === size.pageWidth && pageHeight === size.pageHeight;
  const customSize = sized && !presetSize;
  const page: BookPageSetup = {
    ...before,
    preset: customSize ? 'custom' : (a.preset ?? before.preset),
    pageWidth,
    pageHeight,
    bleed: round2(a.bleed ?? before.bleed),
    safe: round2(a.safe ?? before.safe),
    pageNumbers: {
      ...before.pageNumbers,
      ...numbers,
      ...(numbers.margin !== undefined ? { margin: round2(numbers.margin) } : {}),
      ...(pickedColour ? { autoColor: false } : {}),
    },
  };
  // Nothing moved: the very same document back, so a caller can tell nothing changed.
  if (JSON.stringify(page) === JSON.stringify(before)) return { ...done(doc), previousSetup: before };
  return { ...done({ ...doc, page }), previousSetup: before };
}

/** A copy of an inner page with new ids throughout, right after it. The cover, first, last and back refuse. */
export function duplicateBookPage(doc: BookDocument, args: unknown, ctx: BookOpsContext = {}): BookDocOpResult {
  const parsed = duplicateBookPageRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const newId = ctx.newId ?? bookElementId;
  return caught(() => {
    const index = doc.spreads.findIndex((s) => s.id === parsed.data.spreadId);
    const source = doc.spreads[index];
    if (!source) throw failOp('spread_not_found', `no page ${parsed.data.spreadId}`, null);
    if (!canEditSpread(source)) {
      throw failOp('protected_spread', `${source.id} is the ${source.role} page and cannot be copied`, null);
    }
    if (doc.spreads.length + 1 > MAX_SPREADS) {
      throw failOp('too_many_spreads', `a book holds at most ${MAX_SPREADS} pages`, null);
    }
    const fresh = <E extends { id: string; kind: string }>(e: E): E => ({ ...e, id: newId(e.kind.charAt(0)) });
    const copy = checkedSpread(
      { ...source, id: newId('sp'), elements: source.elements.map(fresh), parked: source.parked.map(fresh) },
      null,
    );
    const spreads = [...doc.spreads.slice(0, index + 1), copy, ...doc.spreads.slice(index + 1)];
    return done({ ...doc, spreads }, { spreadIds: [copy.id], created: createdIds(doc.spreads, spreads) });
  });
}

/** A page's arrangement kept as one of the book's own layouts, named "Layout n" unless a name is given. */
export function saveBookLayout(doc: BookDocument, args: unknown, ctx: BookOpsContext = {}): BookDocOpResult {
  const parsed = saveBookLayoutRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const newId = ctx.newId ?? bookElementId;
  const spread = doc.spreads.find((s) => s.id === parsed.data.spreadId);
  if (!spread) return refused('spread_not_found', `no page ${parsed.data.spreadId}`);
  const layouts = doc.layouts ?? [];
  if (layouts.length >= MAX_BOOK_LAYOUTS) {
    return refused('layouts_full', `a book keeps at most ${MAX_BOOK_LAYOUTS} layouts; remove one first`);
  }
  const name = parsed.data.name ?? nextBookLayoutName(layouts, 'Layout');
  const layout = { ...bookLayoutFromSpread(spread, doc.page, name), id: newId('ly') };
  return done({ ...doc, layouts: [...layouts, layout] }, { created: [layout.id] });
}

/** One of the book's own layouts taken away; `previousLayout` is what puts it back (`restoreBookLayout`). */
export function removeBookLayout(doc: BookDocument, args: unknown): BookDocOpResult {
  const parsed = removeBookLayoutRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const layouts = doc.layouts ?? [];
  const layout = layouts.find((l) => l.id === parsed.data.layoutId);
  if (!layout) return refused('layout_not_found', `this book keeps no layout ${parsed.data.layoutId}`);
  const rest = layouts.filter((l) => l.id !== layout.id);
  return { ...done({ ...doc, layouts: rest }), previousLayout: layout };
}

/**
 * A removed layout put back as it was, for the assistant's undo of
 * `remove_book_layout`. The layout comes from a stored undo record, so it is
 * parsed again like every other argument, and held to a page restore's rule:
 * with a gallery in the context, a photo it names (a frame's, a marker's, a
 * letter fill's) is in the gallery or on a page of the book already, since a
 * layout laid on a page brings its photos along.
 */
export function restoreBookLayout(doc: BookDocument, raw: unknown, ctx: BookOpsContext = {}): BookDocOpResult {
  const parsed = bookLayoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const layout = parsed.data;
  const layouts = doc.layouts ?? [];
  if (layouts.some((l) => l.id === layout.id)) return done(doc);
  if (layouts.length >= MAX_BOOK_LAYOUTS) {
    return refused('layouts_full', `a book keeps at most ${MAX_BOOK_LAYOUTS} layouts; remove one first`);
  }
  return caught(() => {
    checkRestorablePhotos(bookElementPhotoIds(layout.elements), doc, ctx);
    return done({ ...doc, layouts: [...layouts, layout] }, { created: [layout.id] });
  });
}
