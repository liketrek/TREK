import { duplicateBookPage, removeBookLayout, restoreBookLayout, saveBookLayout, setBookSetup } from './book-doc-ops';
import { blankBook } from './book-pages';
import {
  MAX_BOOK_LAYOUTS,
  bookDocumentSchema,
  bookPhotoElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookLayout,
  type BookSpread,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/** The operations on a whole book: its setup, a copy of a page, and its own layouts. */

let seq = 0;
const newId = (p: string) => `${p}-d${++seq}`;

const frame = { x: 230, y: 20, w: 100, h: 20 };
const text = (id: string, words: string) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: words }) as BookElement;

function book(): BookDocument {
  const doc = blankBook({ title: 'Iceland', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[2] = { ...(spreads[2] as BookSpread), elements: [text('t-1', 'Hello')], entryId: 4 };
  return { ...doc, spreads };
}

function ok<R extends { ok: boolean }>(result: R): Extract<R, { ok: true }> {
  if (!result.ok) throw new Error('refused');
  return result as Extract<R, { ok: true }>;
}

describe('book setup', () => {
  it('BOOKDOC-001: changes the format to a preset size, keeps the elements, and answers the setup it replaced', () => {
    const doc = book();
    const done = ok(setBookSetup(doc, { preset: 'a4-portrait' }));
    expect(done.doc.page).toMatchObject({ preset: 'a4-portrait', pageWidth: 210, pageHeight: 297 });
    expect(done.doc.spreads).toBe(doc.spreads);
    expect(done.previousSetup).toEqual(doc.page);
    expect(bookDocumentSchema.safeParse(done.doc).success).toBe(true);
  });

  it('BOOKDOC-002: a size of its own makes the format custom, a folio colour turns its auto colour off', () => {
    const done = ok(setBookSetup(book(), { pageWidth: 240.004, pageNumbers: { show: true, color: '#112233' } }));
    expect(done.doc.page).toMatchObject({ preset: 'custom', pageWidth: 240 });
    expect(done.doc.page.pageNumbers).toMatchObject({ show: true, color: '#112233', autoColor: false });
    const resized = ok(setBookSetup(book(), { preset: 'a4-portrait', pageHeight: 280 }));
    expect(resized.doc.page).toMatchObject({ preset: 'custom', pageWidth: 210, pageHeight: 280 });
    const same = ok(setBookSetup(book(), { preset: 'a4-portrait', pageWidth: 210 }));
    expect(same.doc.page).toMatchObject({ preset: 'a4-portrait', pageWidth: 210, pageHeight: 297 });
  });

  it('BOOKDOC-003: refuses an empty setup and answers the same book when nothing moves', () => {
    expect(setBookSetup(book(), {})).toMatchObject({ ok: false, error: { code: 'invalid_op' } });
    const doc = book();
    expect(ok(setBookSetup(doc, { bleed: doc.page.bleed })).doc).toBe(doc);
    expect(setBookSetup(doc, { pageWidth: 10 })).toMatchObject({ ok: false, error: { code: 'invalid_op' } });
  });
});

describe('pages and layouts', () => {
  it('BOOKDOC-004: copies an inner page with new ids right after it, and refuses the covers', () => {
    const doc = book();
    const done = ok(duplicateBookPage(doc, { spreadId: 'sp-in' }, { newId }));
    const copy = done.doc.spreads[3] as BookSpread;
    expect(done.doc.spreads).toHaveLength(6);
    expect(copy.id).not.toBe('sp-in');
    expect(copy.entryId).toBe(4);
    expect(copy.elements[0]).toMatchObject({ kind: 'text', text: 'Hello' });
    expect(copy.elements[0]?.id).not.toBe('t-1');
    expect(done.spreadIds).toEqual([copy.id]);
    expect(duplicateBookPage(doc, { spreadId: 'sp-cover' })).toMatchObject({ error: { code: 'protected_spread' } });
    expect(duplicateBookPage(doc, { spreadId: 'sp-nope' })).toMatchObject({ error: { code: 'spread_not_found' } });
  });

  it('BOOKDOC-005: keeps a page as a layout of the book, names it, and stops at the cap', () => {
    const done = ok(saveBookLayout(book(), { spreadId: 'sp-in' }, { newId }));
    const layout = done.doc.layouts?.[0];
    expect(layout).toMatchObject({ name: 'Layout 1', role: 'inner' });
    expect(done.created).toEqual([layout?.id]);
    const named = ok(saveBookLayout(book(), { spreadId: 'sp-in', name: 'Harbour' }));
    expect(named.doc.layouts?.[0]?.name).toBe('Harbour');
    const kept = layout as NonNullable<typeof layout>;
    const full = { ...book(), layouts: Array.from({ length: MAX_BOOK_LAYOUTS }, () => kept) };
    expect(saveBookLayout(full, { spreadId: 'sp-in' })).toMatchObject({ error: { code: 'layouts_full' } });
  });

  it('BOOKDOC-006: takes a layout away, answers it, and puts it back as it was', () => {
    const saved = ok(saveBookLayout(book(), { spreadId: 'sp-in' }, { newId })).doc;
    const layout = saved.layouts?.[0];
    const removed = ok(removeBookLayout(saved, { layoutId: layout?.id }));
    expect(removed.doc.layouts).toEqual([]);
    expect(removed.previousLayout).toEqual(layout);
    const back = ok(restoreBookLayout(removed.doc, removed.previousLayout));
    expect(back.doc.layouts).toEqual([layout]);
    const broken = restoreBookLayout(removed.doc, { ...removed.previousLayout, role: 'sideways' });
    expect(broken).toMatchObject({ ok: false, error: { code: 'invalid_op' } });
    expect(removeBookLayout(saved, { layoutId: 'ly-nope' })).toMatchObject({ error: { code: 'layout_not_found' } });
  });

  it('BOOKDOC-007: puts a layout back only with photos of the gallery or of the book, a letter fill counted', () => {
    const saved = ok(saveBookLayout(book(), { spreadId: 'sp-in' }, { newId })).doc;
    const layout = saved.layouts?.[0] as BookLayout;
    const removed = ok(removeBookLayout(saved, { layoutId: layout.id })).doc;
    const ctx = { photos: [{ photoId: 5 }] };
    const framed = (photoId: number): BookLayout => ({
      ...layout,
      elements: [...layout.elements, bookPhotoElementSchema.parse({ id: 'p-1', kind: 'photo', frame, photoId })],
    });
    const lettered = (photoId: number): BookLayout => ({
      ...layout,
      elements: [
        bookTextElementSchema.parse({
          id: 't-2',
          kind: 'text',
          frame,
          text: 'Fjord',
          fillPaint: { type: 'photo', photoId },
        }),
      ],
    });
    const stray = { ok: false, error: { code: 'photo_not_in_gallery' } };

    expect(restoreBookLayout(removed, framed(999), ctx)).toMatchObject(stray);
    expect(restoreBookLayout(removed, lettered(999), ctx)).toMatchObject(stray);
    expect(ok(restoreBookLayout(removed, framed(5), ctx)).doc.layouts).toHaveLength(1);
    expect(ok(restoreBookLayout(removed, lettered(5), ctx)).doc.layouts).toHaveLength(1);

    // A photo on a page of the book already may come back, and without a gallery nothing is checked.
    const pictured = (removed.spreads[2] as BookSpread).elements.concat(framed(999).elements.slice(-1));
    const holding = {
      ...removed,
      spreads: removed.spreads.map((sp, i) => (i === 2 ? { ...sp, elements: pictured } : sp)),
    };
    expect(ok(restoreBookLayout(holding, lettered(999), ctx)).doc.layouts).toHaveLength(1);
    expect(ok(restoreBookLayout(removed, framed(999))).doc.layouts).toHaveLength(1);
  });
});
