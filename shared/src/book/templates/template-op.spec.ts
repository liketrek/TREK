import { applyBookOps } from '../book-ops';
import type { BookOpsContext } from '../book-ops-core';
import { bookPageOpSchema } from '../book-ops.schema';
import { blankBook } from '../book-pages';
import {
  bookPhotoElementSchema,
  bookShapeElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from '../book.schema';
import { bookThemeOf } from '../theme/book-theme';

import { describe, expect, it } from 'vitest';

// TPLOP-001 to TPLOP-007

/**
 * The page operation `layout` with a decorated template, as the assistant's
 * edit_book_page and revise_book_design send it: the same apply the Studio
 * runs, given the journey's words and the book's theme, refused on the other
 * kind of page, and an id the catalogue does not hold refused by the schema.
 */

let seq = 0;
const newId = (p: string) => `${p}-o${++seq}`;

const photo = (id: string, photoId: number) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame: { x: 10, y: 10, w: 40, h: 30 }, photoId });

function book(cover: BookElement[], inner: BookElement[] = [], over: Partial<BookDocument> = {}): BookDocument {
  const doc = blankBook({ title: 'Portugal' });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  spreads[0] = { ...(spreads[0] as BookSpread), elements: cover };
  spreads[2] = { ...(spreads[2] as BookSpread), elements: inner, entryId: 9 };
  return { ...doc, spreads, ...over };
}

const run = (doc: BookDocument, spreadId: string, template: string, ctx: BookOpsContext = {}) =>
  applyBookOps(doc, { spreadId, ops: [{ op: 'layout', template }] }, { newId, ...ctx });

function laid(result: ReturnType<typeof applyBookOps>, index: number): BookSpread {
  if (!result.ok) throw new Error(`refused: ${result.error.code} ${result.error.message}`);
  return result.doc.spreads[index] as BookSpread;
}

const texts = (spread: BookSpread) => spread.elements.flatMap((e) => (e.kind === 'text' ? [e.text] : []));

describe('the layout operation with a decorated template', () => {
  it('TPLOP-001: lays the cover out on a decorated template, in the book title, its photo poured in', () => {
    const cover = laid(run(book([photo('c1', 12)]), 'sp-cover', 'minimal-serif-classic'), 0);
    expect(texts(cover)).toContain('Portugal');
    expect(cover.elements.find((e) => e.kind === 'photo')).toMatchObject({ photoId: 12 });
    expect(cover.elements.find((e) => e.kind === 'line')).toMatchObject({ ornament: 'sun' });
  });

  it('TPLOP-002: sets a page made from an entry in the words of the journal entry, bound to it', () => {
    const ctx: BookOpsContext = {
      journey: {
        title: 'Portugal',
        entries: [{ id: 9, title: 'Sintra', story: 'Up through the fog.', location: null }],
      },
    };
    const inner = laid(run(book([], [photo('i1', 13)]), 'sp-in', 'story-quote', ctx), 2);
    const title = inner.elements.find((e) => e.kind === 'text' && e.text === 'Sintra');
    expect(title?.kind === 'text' && title.binding).toEqual({ source: 'entry.title', entryId: 9 });
    expect(texts(inner)).toContain('Up through the fog.');
  });

  it('TPLOP-003: sets the page in the book theme', () => {
    const theme = bookThemeOf('alpine');
    const cover = laid(run(book([], [], { theme }), 'sp-cover', 'postcard-houses'), 0);
    const title = cover.elements.find((e) => e.kind === 'text' && e.text === 'Portugal');
    expect(title).toMatchObject({ color: theme.palette.ink, font: theme.fonts.display.font });
    expect(cover.background).toBe(theme.palette.paper);
  });

  it('TPLOP-004: refuses a cover template on a double spread and a spread template on a cover', () => {
    const wrong = run(book([]), 'sp-in', 'poster-pop-sunburst');
    expect(wrong).toMatchObject({ ok: false, error: { code: 'layout_role', opIndex: 0 } });
    expect(run(book([]), 'sp-cover', 'grid-tight')).toMatchObject({ ok: false, error: { code: 'layout_role' } });
  });

  it('TPLOP-006: keeps the locked elements of a cover and the name of their group, as the Studio does', () => {
    const locked = (id: string) =>
      bookShapeElementSchema.parse({
        id,
        kind: 'shape',
        frame: { x: 2, y: 2, w: 6, h: 6 },
        locked: true,
        group: 'g-keep',
      });
    const doc = book([locked('k1'), locked('k2'), photo('c1', 12)]);
    const named = {
      ...doc,
      spreads: doc.spreads.map((s, i) => (i === 0 ? { ...s, groups: [{ id: 'g-keep', name: 'My lockup' }] } : s)),
    };
    const cover = laid(run(named, 'sp-cover', 'minimal-serif-classic'), 0);
    expect(cover.elements.filter((e) => e.group === 'g-keep').map((e) => e.id)).toEqual(['k1', 'k2']);
    expect(cover.groups).toContainEqual({ id: 'g-keep', name: 'My lockup' });
  });

  it("TPLOP-007: sets a cover in the journey's subtitle, bound to it, as the Studio's panel does", () => {
    const ctx: BookOpsContext = { journey: { title: 'Azores', subtitle: 'Nine islands in the Atlantic', entries: [] } };
    const cover = laid(run(book([]), 'sp-cover', 'minimal-serif-classic', ctx), 0);
    const subtitle = cover.elements.find((e) => e.kind === 'text' && e.text === 'Nine islands in the Atlantic');
    expect(subtitle?.kind === 'text' && subtitle.binding).toEqual({ source: 'journey.subtitle' });
  });

  it('TPLOP-005: takes any id of either set as a plain string and refuses one the catalogue does not hold', () => {
    expect(bookPageOpSchema.safeParse({ op: 'layout', template: 'postcard-coast' }).success).toBe(true);
    expect(bookPageOpSchema.safeParse({ op: 'layout', template: 'two-up' }).success).toBe(true);
    const unknown = bookPageOpSchema.safeParse({ op: 'layout', template: 'made-up-layout' });
    expect(unknown.success).toBe(false);
    expect(run(book([]), 'sp-in', 'made-up-layout')).toMatchObject({ ok: false, error: { code: 'invalid_op' } });
    const builtIn = laid(run(book([]), 'sp-in', 'quiet-text'), 2);
    expect(builtIn.elements.every((e) => e.kind === 'text' || e.kind === 'photo')).toBe(true);
  });
});
