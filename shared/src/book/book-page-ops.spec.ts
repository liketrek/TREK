import type { BookEditResult } from './book-ops-core';
import { addBookPages, deleteBookPages, moveBookPage, restoreBookPage, setBookCover } from './book-page-ops';
import { blankBook, blankSpread, bookPageSetupForPreset, canEditSpread, innerSpreadBounds } from './book-pages';
import {
  MAX_SPREADS,
  bookDocumentSchema,
  bookPageSetupSchema,
  bookPhotoElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookPhotoElement,
  type BookSpread,
  type BookTextElement,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * The operations on a book's pages rather than on one page: the blank book,
 * which pages are fixed, add, move, delete, the cover and the undo restore.
 */

let seq = 0;
const newId = (p: string) => `${p}-n${++seq}`;

/** Cover, first, `inner` inner spreads, last, back, with readable ids. */
function book(inner = 2): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId });
  const spreads: BookSpread[] = [
    { ...blankSpread('cover'), id: 'sp-cover' },
    { ...blankSpread('first'), id: 'sp-first' },
    ...Array.from({ length: inner }, (_, i) => ({ ...blankSpread('inner'), id: `sp-in${i + 1}` })),
    { ...blankSpread('last'), id: 'sp-last' },
    { ...blankSpread('back'), id: 'sp-back' },
  ];
  return { ...doc, spreads };
}

const ids = (doc: BookDocument) => doc.spreads.map((s) => s.id);

function ok(result: BookEditResult): BookDocument {
  if (result.ok === false) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  return result.doc;
}

function refused(result: BookEditResult): string {
  if (result.ok) throw new Error('expected a refusal');
  return result.error.code;
}

describe('the blank book and the fixed pages', () => {
  it('BOOKPG-001: lays down cover, first, one inner spread, last and back, all empty and valid', () => {
    const doc = blankBook({ title: 'Iceland', newId });
    expect(doc.spreads.map((s) => s.role)).toEqual(['cover', 'first', 'inner', 'last', 'back']);
    expect(doc.spreads.every((s) => s.elements.length === 0 && s.parked.length === 0)).toBe(true);
    expect(new Set(ids(doc)).size).toBe(5);
    expect(bookDocumentSchema.safeParse(doc).success).toBe(true);
  });

  it('BOOKPG-002: starts the page numbers at 1 and keeps the rest of the setup it was handed', () => {
    const page = bookPageSetupSchema.parse({ pageWidth: 300, pageHeight: 200 });
    const doc = blankBook({
      title: 'x'.repeat(500),
      page: { ...page, pageNumbers: { ...page.pageNumbers, startAt: 2 } },
    });
    expect(doc.page.pageNumbers.startAt).toBe(1);
    expect(doc.page.pageWidth).toBe(300);
    expect(doc.title.length).toBeLessThan(500);
  });

  it("BOOKPG-022: lays a new book down in the format it is asked for, at that format's size", () => {
    const doc = blankBook({ title: 'Iceland', preset: 'a4-landscape', newId });
    expect(doc.page).toMatchObject({ preset: 'a4-landscape', pageWidth: 297, pageHeight: 210, bleed: 3, safe: 5 });
    expect(doc.page.pageNumbers.startAt).toBe(1);
    const square = blankBook({ title: 'x', newId }).page;
    expect(square).toMatchObject({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 });
    expect(bookPageSetupForPreset('a5-landscape')).toMatchObject({ pageWidth: 210, pageHeight: 148 });
  });

  it('BOOKPG-003: counts only inner spreads as movable, and finds the range between the fixed pages', () => {
    const doc = book(2);
    expect(doc.spreads.map((s) => canEditSpread(s))).toEqual([false, false, true, true, false, false]);
    expect(canEditSpread(undefined)).toBe(false);
    expect(innerSpreadBounds(doc.spreads)).toEqual({ first: 2, limit: 4 });
    expect(innerSpreadBounds(book(0).spreads)).toEqual({ first: 2, limit: 2 });
    expect(innerSpreadBounds([])).toEqual({ first: 0, limit: 0 });
  });
});

describe('add, move and delete', () => {
  it('BOOKPG-004: adds empty inner spreads after a page and answers their ids', () => {
    const r = addBookPages(book(1), { afterSpreadId: 'sp-in1', count: 2, entryId: 7 }, { newId });
    const doc = ok(r);
    expect(doc.spreads.map((s) => s.role)).toEqual(['cover', 'first', 'inner', 'inner', 'inner', 'last', 'back']);
    expect(r.ok && r.spreadIds).toEqual([doc.spreads[3]?.id, doc.spreads[4]?.id]);
    expect(doc.spreads[3]?.entryId).toBe(7);
  });

  it('BOOKPG-005: keeps added pages inside the covers, whichever page they follow', () => {
    expect(ok(addBookPages(book(1), { afterSpreadId: 'sp-cover' }, { newId })).spreads[2]?.role).toBe('inner');
    const atEnd = ok(addBookPages(book(1), { afterSpreadId: 'sp-back' }, { newId }));
    expect(atEnd.spreads.slice(-2).map((s) => s.id)).toEqual(['sp-last', 'sp-back']);
  });

  it('BOOKPG-006: lays added pages out on a template when one is named', () => {
    const doc = ok(addBookPages(book(1), { afterSpreadId: 'sp-in1', template: 'grid-9' }, { newId }));
    expect(doc.spreads[3]?.elements.length).toBeGreaterThan(0);
  });

  it('BOOKPG-020: ties an added page only to an entry the journey has, when the journey is known', () => {
    const journey = { title: 'Iceland', entries: [{ id: 7 }] };
    const added = ok(addBookPages(book(1), { afterSpreadId: 'sp-in1', entryId: 7 }, { newId, journey }));
    expect(added.spreads[3]?.entryId).toBe(7);
    const stray = addBookPages(book(1), { afterSpreadId: 'sp-in1', entryId: 8 }, { newId, journey });
    expect(refused(stray)).toBe('entry_not_found');
  });

  it('BOOKPG-007: refuses an unknown page, more than ten pages, and a book at its page cap', () => {
    expect(refused(addBookPages(book(1), { afterSpreadId: 'sp-nope' }))).toBe('spread_not_found');
    expect(refused(addBookPages(book(1), { afterSpreadId: 'sp-in1', count: 11 }))).toBe('invalid_op');
    expect(refused(addBookPages(book(MAX_SPREADS - 4), { afterSpreadId: 'sp-in1' }))).toBe('too_many_spreads');
  });

  it('BOOKPG-008: moves an inner spread within the inner range', () => {
    const doc = ok(moveBookPage(book(3), { spreadId: 'sp-in1', toIndex: 4 }));
    expect(ids(doc)).toEqual(['sp-cover', 'sp-first', 'sp-in2', 'sp-in3', 'sp-in1', 'sp-last', 'sp-back']);
  });

  it('BOOKPG-023: answers the very same document for a move to where the page already is', () => {
    const before = book(3);
    expect(ok(moveBookPage(before, { spreadId: 'sp-in2', toIndex: 3 }))).toBe(before);
  });

  it('BOOKPG-009: refuses to move a fixed page or to move a spread outside the covers', () => {
    for (const id of ['sp-cover', 'sp-first', 'sp-last', 'sp-back']) {
      expect(refused(moveBookPage(book(2), { spreadId: id, toIndex: 2 }))).toBe('protected_spread');
    }
    expect(refused(moveBookPage(book(2), { spreadId: 'sp-in1', toIndex: 0 }))).toBe('index_out_of_range');
    expect(refused(moveBookPage(book(2), { spreadId: 'sp-in1', toIndex: 4 }))).toBe('index_out_of_range');
  });

  it('BOOKPG-010: deletes inner spreads, once each even when named twice', () => {
    const r = deleteBookPages(book(3), { spreadIds: ['sp-in1', 'sp-in3', 'sp-in1'] });
    expect(ids(ok(r))).toEqual(['sp-cover', 'sp-first', 'sp-in2', 'sp-last', 'sp-back']);
    expect(r.ok && r.spreadIds).toEqual(['sp-in1', 'sp-in3']);
  });

  it('BOOKPG-011: refuses to delete the cover, first, last or back page, and deletes nothing then', () => {
    for (const id of ['sp-cover', 'sp-first', 'sp-last', 'sp-back']) {
      expect(refused(deleteBookPages(book(2), { spreadIds: ['sp-in1', id] }))).toBe('protected_spread');
    }
    expect(refused(deleteBookPages(book(2), { spreadIds: [] }))).toBe('invalid_op');
    expect(refused(deleteBookPages(book(2), { spreadIds: Array.from({ length: 11 }, (_, i) => `sp-${i}`) }))).toBe(
      'invalid_op',
    );
  });
});

describe('restore', () => {
  it('BOOKPG-012: puts a page back in its place when the book still has it', () => {
    const before = book(2);
    const changed = { ...(before.spreads[2] as BookSpread), background: '#112233' };
    const doc = ok(restoreBookPage(before, { pages: [{ spread: changed, index: 5 }], expectedVersion: 3 }));
    expect(ids(doc)).toEqual(ids(before));
    expect(doc.spreads[2]?.background).toBe('#112233');
  });

  it('BOOKPG-013: re-inserts a deleted inner spread at its index, kept inside the covers', () => {
    const before = book(2);
    const gone = before.spreads[3] as BookSpread;
    const without = ok(deleteBookPages(before, { spreadIds: [gone.id] }));
    const back = ok(restoreBookPage(without, { pages: [{ spread: gone, index: 3 }], expectedVersion: 1 }));
    expect(ids(back)).toEqual(ids(before));
    const clamped = ok(restoreBookPage(without, { pages: [{ spread: gone, index: 0 }], expectedVersion: 1 }));
    expect(clamped.spreads[2]?.id).toBe(gone.id);
  });

  it('BOOKPG-014: refuses a page that is not a page', () => {
    const notAPage = { pages: [{ spread: { id: 'x', role: 'middle' }, index: 2 }], expectedVersion: 1 };
    expect(refused(restoreBookPage(book(1), notAPage))).toBe('invalid_op');
    expect(refused(restoreBookPage(book(1), { pages: [], expectedVersion: 1 }))).toBe('invalid_op');
  });

  it('BOOKPG-019: never makes a second cover, and never turns a page into another kind', () => {
    const doc = book(1);
    const asCover = { ...(doc.spreads[2] as BookSpread), role: 'cover' as const };
    expect(refused(restoreBookPage(doc, { pages: [{ spread: asCover, index: 2 }], expectedVersion: 1 }))).toBe(
      'invalid_op',
    );
    for (const role of ['cover', 'first', 'last', 'back'] as const) {
      const extra = { ...blankSpread(role), id: `sp-extra-${role}` };
      expect(refused(restoreBookPage(doc, { pages: [{ spread: extra, index: 2 }], expectedVersion: 1 }))).toBe(
        'protected_spread',
      );
    }
    const lost = { ...doc, spreads: doc.spreads.filter((s) => s.role !== 'back') };
    const back = doc.spreads[doc.spreads.length - 1] as BookSpread;
    const restored = ok(
      restoreBookPage(lost, { pages: [{ spread: back, index: lost.spreads.length }], expectedVersion: 1 }),
    );
    expect(ids(restored)).toEqual(ids(doc));
  });

  it('BOOKPG-024: puts several deleted pages back in one call, lowest index first whatever order they come in', () => {
    const before = book(4);
    const without = ok(deleteBookPages(before, { spreadIds: ['sp-in1', 'sp-in3', 'sp-in4'] }));
    const previous = before.spreads.flatMap((spread, index) =>
      ['sp-in1', 'sp-in3', 'sp-in4'].includes(spread.id) ? [{ index, spread }] : [],
    );
    const result = restoreBookPage(without, { pages: [...previous].reverse(), expectedVersion: 2 });
    expect(ids(ok(result))).toEqual(ids(before));
    expect(result.ok && result.spreadIds).toEqual(['sp-in1', 'sp-in3', 'sp-in4']);
  });

  it('BOOKPG-025: refuses a photo that is neither in the gallery nor in the book, and takes one the book holds', () => {
    const base = book(2);
    const frame = (id: string, photoId: number) =>
      bookPhotoElementSchema.parse({ id, kind: 'photo', frame: { x: 10, y: 10, w: 80, h: 80 }, photoId });
    const withPhoto = {
      ...base,
      spreads: base.spreads.map((s) => (s.id === 'sp-in1' ? { ...s, elements: [frame('p-kept', 7)] } : s)),
    };
    const page = withPhoto.spreads[3] as BookSpread;
    const photos = [{ photoId: 1 }];
    const stray = { ...page, elements: [frame('p-stray', 99)] };
    const args = (spread: BookSpread) => ({ pages: [{ spread, index: 3 }], expectedVersion: 1 });
    expect(refused(restoreBookPage(withPhoto, args(stray), { photos }))).toBe('photo_not_in_gallery');
    const fromBook = { ...page, elements: [frame('p-again', 7)] };
    expect(ok(restoreBookPage(withPhoto, args(fromBook), { photos })).spreads[3]?.elements[0]?.id).toBe('p-again');
    const fromGallery = { ...page, elements: [frame('p-new', 1)] };
    expect(ok(restoreBookPage(withPhoto, args(fromGallery), { photos })).spreads[3]?.elements[0]?.id).toBe('p-new');
    // Without a gallery in the context the engine cannot tell, and leaves it to the caller.
    expect(ok(restoreBookPage(withPhoto, args(stray))).spreads[3]?.elements[0]?.id).toBe('p-stray');
  });

  it('BOOKPG-026: keeps a locked element as it is on a page put back in place, and adds no locked one', () => {
    const base = book(1);
    const lockedText = bookTextElementSchema.parse({
      id: 't-lock',
      kind: 'text',
      frame: { x: 20, y: 20, w: 100, h: 20 },
      text: 'Kept',
      locked: true,
    });
    const doc = {
      ...base,
      spreads: base.spreads.map((s) => (s.id === 'sp-in1' ? { ...s, elements: [lockedText] } : s)),
    };
    const page = doc.spreads[2] as BookSpread;
    const args = (spread: BookSpread) => ({ pages: [{ spread, index: 2 }], expectedVersion: 1 });
    // The same element with its keys in another order is the same element.
    const backwards = Object.fromEntries(Object.entries(lockedText).reverse()) as BookTextElement;
    const reordered = { ...page, background: '#223344', elements: [backwards] };
    expect(ok(restoreBookPage(doc, args(reordered))).spreads[2]?.background).toBe('#223344');
    const changed = { ...page, elements: [{ ...lockedText, text: 'Changed' }] };
    expect(refused(restoreBookPage(doc, args(changed)))).toBe('locked');
    expect(refused(restoreBookPage(doc, args({ ...page, elements: [] })))).toBe('locked');
    const newLock = { ...lockedText, id: 't-new' };
    expect(refused(restoreBookPage(doc, args({ ...page, elements: [lockedText, newLock] })))).toBe('locked');
  });
});

describe('the cover', () => {
  const coverOf = (doc: BookDocument) => doc.spreads[0] as BookSpread;
  const textsOf = (doc: BookDocument) => coverOf(doc).elements.filter((e): e is BookTextElement => e.kind === 'text');

  it('BOOKPG-015: lays the cover out, fills its photo frame and sets the title bound to the journey', () => {
    const doc = ok(setBookCover(book(1), { template: 'cover-full', photoId: 5, title: 'Iceland 2026' }, { newId }));
    const photos = coverOf(doc).elements.filter((e): e is BookPhotoElement => e.kind === 'photo');
    expect(photos[0]?.photoId).toBe(5);
    const title = textsOf(doc).find((t) => t.text === 'Iceland 2026');
    expect(title).toBeDefined();
  });

  it('BOOKPG-016: keeps a bound title bound when the words are what the journey says, and the subtitle apart', () => {
    const base = book(1);
    const bound = bookTextElementSchema.parse({
      id: 't-title',
      kind: 'text',
      frame: { x: 20, y: 20, w: 170, h: 30 },
      text: 'Iceland',
      size: 30,
      binding: { source: 'journey.title' },
    });
    const sub = bookTextElementSchema.parse({
      id: 't-sub',
      kind: 'text',
      frame: { x: 20, y: 60, w: 170, h: 10 },
      text: 'Summer',
      size: 9,
      binding: { source: 'journey.subtitle' },
    });
    const withTexts = {
      ...base,
      spreads: base.spreads.map((s, i) => (i === 0 ? { ...s, elements: [bound, sub] } : s)),
    };
    const ctx = { newId, journey: { title: 'Iceland', subtitle: 'Summer' } };
    const same = ok(setBookCover(withTexts, { title: 'Iceland' }, ctx));
    expect(textsOf(same).find((t) => t.id === 't-title')?.overridden).toBe(false);
    const other = ok(setBookCover(withTexts, { subtitle: 'Winter' }, ctx));
    expect(textsOf(other).find((t) => t.id === 't-sub')).toMatchObject({ text: 'Winter', overridden: true });
    expect(textsOf(other).find((t) => t.id === 't-title')?.text).toBe('Iceland');
  });

  it('BOOKPG-017: gives a cover with no free frame a full-bleed photo behind everything else', () => {
    const doc = ok(setBookCover(book(1), { photoId: 9, title: 'Iceland' }, { newId }));
    const first = coverOf(doc).elements[0];
    expect(first?.kind).toBe('photo');
    expect(first?.frame).toEqual({ x: -3, y: -3, w: 216, h: 216 });
  });

  it('BOOKPG-021: fills an empty frame before one that already holds a picture', () => {
    const base = book(1);
    const frame = (id: string, photoId: number | null, x: number) =>
      bookPhotoElementSchema.parse({ id, kind: 'photo', frame: { x, y: 20, w: 80, h: 80 }, photoId });
    const elements = [frame('p-full', 1, 10), frame('p-empty', null, 110)];
    const cover = { ...(base.spreads[0] as BookSpread), elements };
    const twoFrames = { ...base, spreads: [cover, ...base.spreads.slice(1)] };
    const photos = coverOf(ok(setBookCover(twoFrames, { photoId: 2 }, { newId }))).elements as BookPhotoElement[];
    expect(photos.map((e) => [e.id, e.photoId])).toEqual([
      ['p-full', 1],
      ['p-empty', 2],
    ]);
  });

  it('BOOKPG-018: refuses a photo outside the gallery, a locked frame, and a book without a cover', () => {
    expect(refused(setBookCover(book(1), { photoId: 9 }, { photos: [{ photoId: 1 }] }))).toBe('photo_not_in_gallery');
    const base = book(1);
    const locked = bookPhotoElementSchema.parse({
      id: 'p-lock',
      kind: 'photo',
      frame: { x: 0, y: 0, w: 210, h: 210 },
      photoId: 1,
      locked: true,
    });
    const lockedCover = {
      ...base,
      spreads: base.spreads.map((s, i) => (i === 0 ? { ...s, elements: [locked] } : s)),
    };
    // The only frame is locked, so the photo gets a new one and the locked frame stays as it was.
    const doc = ok(setBookCover(lockedCover, { photoId: 2 }, { newId }));
    expect(coverOf(doc).elements.find((e) => e.id === 'p-lock')).toEqual(locked);
    const noCover = { ...base, spreads: base.spreads.slice(1) };
    expect(refused(setBookCover(noCover, { title: 'x' }))).toBe('no_cover');
  });
});
