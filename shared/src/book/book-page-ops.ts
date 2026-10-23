import { bookElementId } from './book-ids';
import { applyBookTemplate, classifyBookTexts, findBookTemplate } from './book-layouts';
import { applyBookOps } from './book-ops';
import {
  caught,
  checkedSpread,
  createdIds,
  droppedIds,
  failOp,
  invalidOp,
  journeyEntry,
  type BookEditResult,
  type BookOpsContext,
} from './book-ops-core';
import {
  addBookPagesRequestSchema,
  deleteBookPagesRequestSchema,
  moveBookPageRequestSchema,
  restoreBookPageRequestSchema,
  setBookCoverRequestSchema,
  type BookPageOpInput,
} from './book-ops.schema';
import { blankSpread, canEditSpread, innerSpreadBounds } from './book-pages';
import {
  MAX_SPREADS,
  type BookDocument,
  type BookElement,
  type BookPhotoElement,
  type BookSpread,
} from './book.schema';

/**
 * Operations on the pages of a book rather than on one page: add, move,
 * delete, the cover, and putting a page back for an undo.
 *
 * The same rules as the Studio's page rail, from the same place
 * (book-pages.ts): only inner spreads move or go, and they stay between the
 * first page and the last. Each takes the tool's arguments, parses them again,
 * and answers a result rather than throwing.
 */

const notFound = (id: string) => failOp('spread_not_found', `no page ${id}`, null);

function indexOf(doc: BookDocument, spreadId: string): number {
  const i = doc.spreads.findIndex((s) => s.id === spreadId);
  if (i < 0) throw notFound(spreadId);
  return i;
}

/** Empty inner spreads after a page, kept inside the covers, laid out on a template when one is named. */
export function addBookPages(doc: BookDocument, args: unknown, ctx: BookOpsContext = {}): BookEditResult {
  const parsed = addBookPagesRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const { afterSpreadId, count = 1, template, entryId } = parsed.data;
  return caught(() => {
    const after = indexOf(doc, afterSpreadId);
    if (entryId !== undefined) journeyEntry(entryId, ctx, null);
    if (doc.spreads.length + count > MAX_SPREADS) {
      throw failOp('too_many_spreads', `a book holds at most ${MAX_SPREADS} pages`, null);
    }
    const { first, limit } = innerSpreadBounds(doc.spreads);
    const at = Math.min(Math.max(after + 1, first), limit);
    const tpl = template === undefined ? undefined : findBookTemplate(template);
    const added = Array.from({ length: count }, () => {
      const empty = { ...blankSpread('inner', ctx.newId ?? bookElementId), entryId: entryId ?? null };
      return checkedSpread(tpl ? applyBookTemplate(empty, tpl, doc.page) : empty, null);
    });
    const spreads = [...doc.spreads.slice(0, at), ...added, ...doc.spreads.slice(at)];
    return {
      ok: true,
      doc: { ...doc, spreads },
      spreadIds: added.map((s) => s.id),
      created: createdIds(doc.spreads, spreads),
      dropped: [],
    };
  });
}

/** One inner spread to another place among the inner spreads. */
export function moveBookPage(doc: BookDocument, args: unknown): BookEditResult {
  const parsed = moveBookPageRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const { spreadId, toIndex } = parsed.data;
  return caught(() => {
    const from = indexOf(doc, spreadId);
    const spread = doc.spreads[from];
    if (!canEditSpread(spread)) {
      throw failOp('protected_spread', `${spreadId} is the ${spread?.role} page and keeps its place`, null);
    }
    const { first, limit } = innerSpreadBounds(doc.spreads);
    if (toIndex < first || toIndex >= limit) {
      throw failOp('index_out_of_range', `inner pages sit at index ${first} to ${limit - 1}`, null);
    }
    // A page already there: the very same document back, so a caller can tell nothing changed.
    if (toIndex === from) return { ok: true, doc, spreadIds: [spreadId], created: [], dropped: [] };
    const spreads = doc.spreads.filter((_, i) => i !== from);
    spreads.splice(toIndex, 0, doc.spreads[from] as BookSpread);
    return { ok: true, doc: { ...doc, spreads }, spreadIds: [spreadId], created: [], dropped: [] };
  });
}

/** Inner spreads out of the book. The cover, first, last and back pages refuse. */
export function deleteBookPages(doc: BookDocument, args: unknown): BookEditResult {
  const parsed = deleteBookPagesRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const ids = [...new Set(parsed.data.spreadIds)];
  return caught(() => {
    for (const id of ids) {
      const spread = doc.spreads[indexOf(doc, id)];
      if (!canEditSpread(spread)) {
        throw failOp('protected_spread', `${id} is the ${spread?.role} page and cannot be deleted`, null);
      }
    }
    const gone = new Set(ids);
    return {
      ok: true,
      doc: { ...doc, spreads: doc.spreads.filter((s) => !gone.has(s.id)) },
      spreadIds: ids,
      created: [],
      dropped: [],
    };
  });
}

/**
 * Put pages back as they were, for the assistant's undo: each in its place
 * when the book still has a page with its id, else inserted at its `index`,
 * kept inside the covers when it is an inner spread. The version check is the
 * server's. Several pages deleted at once go back lowest index first, so each
 * index means what it meant before the delete.
 *
 * Never a second cover: a page still in the book is only replaced by one of
 * the same role, and a cover, first, last or back page comes back only into a
 * book that has lost its own. A restore is no way around the rules of an
 * edit: with a gallery in the context, a photo must be in it or already in the
 * book, and a page still in the book keeps every locked element exactly as it
 * is, adding none. An honest undo always passes both, since the change it
 * takes back could touch neither and anything saved since fails the version.
 */
export function restoreBookPage(doc: BookDocument, args: unknown, ctx: BookOpsContext = {}): BookEditResult {
  const parsed = restoreBookPageRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const pages = [...parsed.data.pages].sort((a, b) => a.index - b.index);
  return caught(() => {
    let cur = doc;
    for (const { spread, index } of pages) {
      restorablePhotos(spread, cur, ctx);
      cur = putBack(cur, spread, index);
    }
    const restored = [...new Set(pages.map((p) => p.spread.id))];
    return { ok: true, doc: cur, spreadIds: restored, created: [], dropped: [] };
  });
}

/** One page back into the book: replaced where it is, or inserted at `index`. */
function putBack(doc: BookDocument, spread: BookSpread, index: number): BookDocument {
  const at = doc.spreads.findIndex((s) => s.id === spread.id);
  if (at >= 0) {
    const current = doc.spreads[at] as BookSpread;
    if (current.role !== spread.role) {
      throw failOp(
        'invalid_op',
        `${spread.id} is the ${current.role} page now and cannot become the ${spread.role}`,
        null,
      );
    }
    sameLocks(current, spread);
    const spreads = doc.spreads.slice();
    spreads[at] = spread;
    return { ...doc, spreads };
  }
  if (spread.role !== 'inner' && doc.spreads.some((s) => s.role === spread.role)) {
    throw failOp('protected_spread', `the book already has its ${spread.role} page`, null);
  }
  if (doc.spreads.length >= MAX_SPREADS) {
    throw failOp('too_many_spreads', `a book holds at most ${MAX_SPREADS} pages`, null);
  }
  const { first, limit } = innerSpreadBounds(doc.spreads);
  const to = spread.role === 'inner' ? Math.min(Math.max(index, first), limit) : Math.min(index, doc.spreads.length);
  return { ...doc, spreads: [...doc.spreads.slice(0, to), spread, ...doc.spreads.slice(to)] };
}

/** The photos a page shows: its photo frames, placed or parked, and the pictures on its map markers. */
function photoIdsOf(spread: BookSpread): number[] {
  return [...spread.elements, ...spread.parked].flatMap((e) => {
    if (e.kind === 'photo') return e.photoId == null ? [] : [e.photoId];
    if (e.kind === 'map') return e.points.flatMap((p) => (p.photoId == null ? [] : [p.photoId]));
    return [];
  });
}

/** With a gallery known, every photo of a page coming back is in it or somewhere in the book already. */
function restorablePhotos(spread: BookSpread, doc: BookDocument, ctx: BookOpsContext): void {
  if (!ctx.photos) return;
  const known = new Set([...ctx.photos.map((p) => p.photoId), ...doc.spreads.flatMap(photoIdsOf)]);
  const stray = photoIdsOf(spread).find((id) => !known.has(id));
  if (stray !== undefined) {
    throw failOp('photo_not_in_gallery', `photo ${stray} is neither in this journey's gallery nor in the book`, null);
  }
}

/** Key order aside, the same value: a parsed and a stored element list their fields in different orders. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    entries.sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** A page replaced in place keeps each of its locked elements as it is and gains no new one. */
function sameLocks(current: BookSpread, spread: BookSpread): void {
  const lockedOf = (s: BookSpread) =>
    new Map([...s.elements, ...s.parked].filter((e) => e.locked).map((e) => [e.id, e] as const));
  const before = lockedOf(current);
  const after = new Map([...spread.elements, ...spread.parked].map((e) => [e.id, e] as const));
  for (const [id, el] of before) {
    const back = after.get(id);
    if (!back || canonical(back) !== canonical(el)) {
      throw failOp('locked', `${id} is locked and stays as it is`, null, id);
    }
  }
  for (const [id] of lockedOf(spread)) {
    if (!before.has(id)) {
      throw failOp('locked', `${id} is not locked on the page now and cannot come back locked`, null, id);
    }
  }
}

const isBoundTo = (el: BookElement, source: 'journey.title' | 'journey.subtitle') =>
  el.kind === 'text' && el.binding?.source === source;

/**
 * The cover: its layout, its photo, its title and its subtitle.
 *
 * Each is an ordinary page operation on the cover spread, so the rules of
 * `edit_book_page` hold (locks, the gallery, bound text). The title goes into
 * the text bound to the journey's title, else the cover's heading, else a new
 * heading bound to the title; the subtitle likewise with the meta line. A cover
 * with no free photo frame gets a full-bleed one, behind everything else.
 */
export function setBookCover(doc: BookDocument, args: unknown, ctx: BookOpsContext = {}): BookEditResult {
  const parsed = setBookCoverRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const { template, photoId, title, subtitle } = parsed.data;
  const cover = doc.spreads.find((s) => s.role === 'cover');
  if (!cover) return { ok: false, error: { code: 'no_cover', message: 'this book has no cover page', opIndex: null } };
  return caught(() => {
    let cur = doc;
    const run = (ops: BookPageOpInput[]) => {
      const r = applyBookOps(cur, { spreadId: cover.id, ops }, ctx);
      // `=== false` rather than `!r.ok`: the client compiles this file without
      // strictNullChecks, where a truthiness test does not narrow the union.
      if (r.ok === false) throw failOp(r.error.code, r.error.message, null, r.error.elementId);
      cur = r.doc;
    };
    const page = () => cur.spreads.find((s) => s.id === cover.id) as BookSpread;
    if (template !== undefined) run([{ op: 'layout', template }]);
    if (photoId !== undefined) {
      // An empty frame first, so a picture the cover already holds stays unless it is the only frame.
      const frames = page().elements.filter((e): e is BookPhotoElement => e.kind === 'photo');
      const empty = frames.findIndex((e) => !e.locked && e.photoId == null);
      const free = empty >= 0 ? empty : frames.findIndex((e) => !e.locked);
      if (free >= 0) {
        run([{ op: 'place_photo', photoId, target: { slot: free } }]);
      } else {
        run([{ op: 'place_photo', photoId, target: 'new' }]);
        cur = fullBleedAtBack(cur, cover.id);
      }
    }
    if (title !== undefined) run([coverText(page(), 'journey.title', title)]);
    if (subtitle !== undefined) run([coverText(page(), 'journey.subtitle', subtitle)]);
    return {
      ok: true,
      doc: cur,
      spreadIds: [cover.id],
      created: createdIds(doc.spreads, cur.spreads),
      dropped: droppedIds([cover], [page()]),
    };
  });
}

/** A cover with no frame to fill gets a full-bleed one, at the back, so the title stays on top of it. */
function fullBleedAtBack(doc: BookDocument, coverId: string): BookDocument {
  const { pageWidth, pageHeight, bleed } = doc.page;
  return {
    ...doc,
    spreads: doc.spreads.map((s) => {
      if (s.id !== coverId) return s;
      const added = s.elements[s.elements.length - 1] as BookElement;
      const frame = { x: -bleed, y: -bleed, w: pageWidth + bleed * 2, h: pageHeight + bleed * 2 };
      return { ...s, elements: [{ ...added, frame }, ...s.elements.slice(0, -1)] };
    }),
  };
}

/**
 * The cover's title or subtitle: the text bound to it, else the cover's
 * heading (for the title) or its other text (for the subtitle), else a new
 * text bound to it.
 */
function coverText(cover: BookSpread, source: 'journey.title' | 'journey.subtitle', words: string): BookPageOpInput {
  const texts = cover.elements.filter((e) => e.kind === 'text');
  const other = source === 'journey.title' ? 'journey.subtitle' : 'journey.title';
  // The other line's own text is never this one's fallback.
  const roles = classifyBookTexts(texts.filter((e) => !isBoundTo(e, other)));
  const fallback = source === 'journey.title' ? roles.heading : (roles.meta ?? roles.body);
  const target = texts.find((e) => isBoundTo(e, source)) ?? fallback;
  if (target) return { op: 'text', elementId: target.id, text: words };
  return { op: 'text', role: source === 'journey.title' ? 'heading' : 'meta', text: words, binding: { source } };
}
