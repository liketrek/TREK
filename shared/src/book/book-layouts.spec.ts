import {
  BOOK_COVER_TEMPLATES,
  BOOK_TEMPLATES,
  applyBookTemplate,
  classifyBookTexts,
  findBookTemplate,
  isBookOrnamentText,
} from './book-layouts';
import { bookElementPhotoIds, bookSpreadPhotoIds } from './book-photo-refs';
import { applySavedBookLayout, bookLayoutFromSpread, bookLayoutPreview } from './book-saved-layouts';
import {
  bookPageSetupSchema,
  bookPhotoElementSchema,
  bookSpreadSchema,
  bookTextElementSchema,
  type BookElement,
  type BookLayout,
  type BookPageSetup,
  type BookSpread,
} from './book.schema';

import { describe, expect, it } from 'vitest';

/**
 * Layouts (#1973), moved with their code from the Studio
 * (client/tests/unit/studio/templates.test.ts).
 *
 * The cover set exists because a cover is a different problem from a spread:
 * one page, type as the subject rather than as a caption. A spread layout
 * applied to it lands half its frames past the edge of the page, which is why
 * the two sets are kept apart rather than filtered out of one.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({
  preset: 'square-210',
  pageWidth: 210,
  pageHeight: 210,
});

describe('the layout catalogue', () => {
  it('BOOKLAY-001: gives every layout a unique id across both sets', () => {
    const ids = [...BOOK_TEMPLATES, ...BOOK_COVER_TEMPLATES].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('BOOKLAY-002: gives every layout at least one slot', () => {
    for (const tpl of [...BOOK_TEMPLATES, ...BOOK_COVER_TEMPLATES]) {
      expect(tpl.build(page).length, tpl.id).toBeGreaterThan(0);
    }
  });

  it('BOOKLAY-003: counts its photo slots honestly', () => {
    for (const tpl of [...BOOK_TEMPLATES, ...BOOK_COVER_TEMPLATES]) {
      const drawn = tpl.build(page).filter((s) => s.kind === 'photo').length;
      expect(drawn, tpl.id).toBe(tpl.photoSlots);
    }
  });

  it('BOOKLAY-004: gives every slot a frame with a positive size', () => {
    for (const tpl of [...BOOK_TEMPLATES, ...BOOK_COVER_TEMPLATES]) {
      for (const slot of tpl.build(page)) {
        expect(slot.frame.w, tpl.id).toBeGreaterThan(0);
        expect(slot.frame.h, tpl.id).toBeGreaterThan(0);
      }
    }
  });

  it('BOOKLAY-005: finds a layout by id in either set, and nothing for an unknown id', () => {
    expect(findBookTemplate('grid-4')?.photoSlots).toBe(4);
    expect(findBookTemplate('cover-band')?.role).toBe('single');
    expect(findBookTemplate('nope')).toBeUndefined();
  });
});

describe('the cover set', () => {
  it('BOOKLAY-006: is marked as single-page throughout', () => {
    for (const tpl of BOOK_COVER_TEMPLATES) {
      expect(tpl.role, tpl.id).toBe('single');
    }
  });

  /*
   * The rule that makes them a separate set: everything stays on one page.
   * A frame reaching past pageWidth would be half in the fold of a book that
   * has no fold there.
   */
  it('BOOKLAY-007: keeps every frame on the one page', () => {
    for (const tpl of BOOK_COVER_TEMPLATES) {
      for (const slot of tpl.build(page)) {
        expect(slot.frame.x, `${tpl.id} x`).toBeGreaterThanOrEqual(-page.bleed - 0.01);
        expect(slot.frame.x + slot.frame.w, `${tpl.id} right`).toBeLessThanOrEqual(page.pageWidth + page.bleed + 0.01);
        expect(slot.frame.y + slot.frame.h, `${tpl.id} bottom`).toBeLessThanOrEqual(
          page.pageHeight + page.bleed + 0.01,
        );
      }
    }
  });

  it('BOOKLAY-008: always has somewhere for the title', () => {
    for (const tpl of BOOK_COVER_TEMPLATES) {
      expect(
        tpl.build(page).some((s) => s.kind === 'heading'),
        tpl.id,
      ).toBe(true);
    }
  });

  it('BOOKLAY-009: includes one that needs no photograph at all', () => {
    expect(BOOK_COVER_TEMPLATES.some((t) => t.photoSlots === 0)).toBe(true);
  });
});

describe('the spread set', () => {
  it('BOOKLAY-010: is not marked single, so the panel keeps the two apart', () => {
    for (const tpl of BOOK_TEMPLATES) {
      expect(tpl.role ?? 'inner', tpl.id).toBe('inner');
    }
  });

  it('BOOKLAY-011: stays within the spread', () => {
    for (const tpl of BOOK_TEMPLATES) {
      for (const slot of tpl.build(page)) {
        expect(slot.frame.x + slot.frame.w, `${tpl.id} right`).toBeLessThanOrEqual(
          page.pageWidth * 2 + page.bleed + 0.01,
        );
      }
    }
  });

  it('BOOKLAY-012: offers a range of photo counts rather than five versions of one idea', () => {
    const counts = new Set(BOOK_TEMPLATES.map((t) => t.photoSlots));
    expect(counts.size).toBeGreaterThanOrEqual(6);
  });
});

describe('applying a cover layout', () => {
  const spread = {
    id: 'c1',
    role: 'cover' as const,
    background: null,
    parked: [],
    entryId: null,
    elements: [
      {
        id: 'p1',
        kind: 'photo' as const,
        frame: { x: 0, y: 0, w: 50, h: 50 },
        rotation: 0,
        opacity: 1,
        locked: false,
        photoId: 42,
        fit: 'cover' as const,
        focalX: 0.5,
        focalY: 0.5,
        radius: 0,
        filter: 'none' as const,
        mask: null,
        frameStyle: 'none' as const,
      },
      {
        id: 't1',
        kind: 'text' as const,
        frame: { x: 0, y: 60, w: 100, h: 20 },
        rotation: 0,
        opacity: 1,
        locked: false,
        text: 'Iceland',
        font: 'sans' as const,
        size: 30,
        weight: 700 as const,
        italic: false,
        align: 'left' as const,
        leading: 1.1,
        tracking: 0,
        color: '#111111',
        binding: null,
        overridden: false,
      },
    ],
  };
  const full = BOOK_COVER_TEMPLATES[0] as (typeof BOOK_COVER_TEMPLATES)[number];
  const quiet = BOOK_COVER_TEMPLATES.find((t) => t.photoSlots === 0) as (typeof BOOK_COVER_TEMPLATES)[number];

  it('BOOKLAY-013: pours the existing picture and title into the new arrangement', () => {
    const next = applyBookTemplate(spread, full, page);
    const photo = next.elements.find((e) => e.kind === 'photo');
    const text = next.elements.find((e) => e.kind === 'text');
    expect(photo?.kind === 'photo' && photo.photoId).toBe(42);
    expect(text?.kind === 'text' && text.text).toBe('Iceland');
  });

  /*
   * Trying the type-only cover must not cost the photograph: it comes back
   * the moment a layout with a frame is applied.
   */
  it('BOOKLAY-014: parks what a type-only cover has no room for', () => {
    const next = applyBookTemplate(spread, quiet, page);
    expect(next.elements.some((e) => e.kind === 'photo')).toBe(false);
    expect(next.parked.some((e) => e.kind === 'photo' && e.photoId === 42)).toBe(true);
  });

  it('BOOKLAY-015: brings the parked picture back on a layout that has room', () => {
    const parked = applyBookTemplate(spread, quiet, page);
    const back = applyBookTemplate(parked, full, page);
    const photo = back.elements.find((e) => e.kind === 'photo');
    expect(photo?.kind === 'photo' && photo.photoId).toBe(42);
  });
});

describe('which text plays which part', () => {
  const t = (id: string, text: string, size: number) => ({ id, kind: 'text', text, size }) as BookElement;

  it('BOOKLAY-016: takes the largest type of 14 pt or more as the heading, the longest of the rest as the story', () => {
    const roles = classifyBookTexts([t('m', 'MAY', 7.5), t('b', 'A long story', 10), t('h', 'Title', 22)]);
    expect([roles.heading?.id, roles.body?.id, roles.meta?.id]).toEqual(['h', 'b', 'm']);
  });

  it('BOOKLAY-017: leaves the heading empty when nothing is set large', () => {
    const roles = classifyBookTexts([t('a', 'Short', 9), t('b', 'Longer words', 9)]);
    expect([roles.heading, roles.body?.id, roles.meta?.id]).toEqual([null, 'b', 'a']);
  });

  it('BOOKLAY-018: never takes a mark set as text, a large quotation mark, for the heading or the story', () => {
    expect(isBookOrnamentText(t('q', '\u201c', 140))).toBe(true);
    expect(isBookOrnamentText(t('n', 'No. 7', 9))).toBe(false);
    expect(isBookOrnamentText(t('e', '  ', 9))).toBe(false);
    const roles = classifyBookTexts([
      t('q', '\u201c', 140),
      t('h', 'Sintra', 30),
      t('d', '\u2605 \u2605 \u2605', 9),
      t('b', 'A long story', 10),
    ]);
    expect([roles.heading?.id, roles.body?.id, roles.meta]).toEqual(['h', 'b', null]);
  });
});

describe('a mark set as text on a page laid out again', () => {
  const text = (id: string, words: string, size: number) =>
    bookTextElementSchema.parse({ id, kind: 'text', frame: { x: 10, y: 10, w: 40, h: 40 }, text: words, size });
  const quoted = bookSpreadSchema.parse({
    id: 'sp',
    role: 'inner',
    elements: [text('q', '\u201c', 140), text('h', 'Sintra', 30), text('b', 'Up through the fog to the palace.', 10)],
  });

  it('BOOKLAY-019: goes with the old design on a built-in layout, neither set as words nor parked', () => {
    const hero = findBookTemplate('hero-story');
    if (!hero) throw new Error('hero-story is missing');
    const next = applyBookTemplate(quoted, hero, page);
    const words = next.elements.flatMap((e) => (e.kind === 'text' ? [e.text] : []));
    expect(words).toContain('Sintra');
    expect(words).not.toContain('\u201c');
    expect(next.parked.some((e) => e.kind === 'text' && e.text === '\u201c')).toBe(false);
  });

  it('BOOKLAY-020: stays the design of a saved layout, and is no box for the words of the page it is laid on', () => {
    const layout = bookLayoutFromSpread(quoted, page, 'Quote');
    const other = bookSpreadSchema.parse({ id: 'sp2', role: 'inner', elements: [text('t', 'Porto', 30)] });
    const next = applySavedBookLayout(other, layout, page);
    const texts = next.elements.flatMap((e) => (e.kind === 'text' ? [{ text: e.text, size: e.size }] : []));
    expect(texts).toContainEqual({ text: '\u201c', size: 140 });
    expect(texts).toContainEqual({ text: 'Porto', size: 30 });
    expect(next.parked).toEqual([]);
  });
});

describe('the page background a saved layout brings', () => {
  it("BOOKLAY-030: replaces the page's colour and its link to a theme colour, so a theme cannot paint over it", () => {
    const from = bookSpreadSchema.parse({ id: 'a', role: 'inner', background: '#123456', elements: [] });
    const layout = bookLayoutFromSpread(from, page, 'Navy');
    const linked = bookSpreadSchema.parse({
      id: 'b',
      role: 'inner',
      background: '#ffffff',
      backgroundToken: 'paper',
      elements: [],
    });
    const next = applySavedBookLayout(linked, layout, page);
    expect(next.background).toBe('#123456');
    expect(next).not.toHaveProperty('backgroundToken');
  });
});

describe('letters filled with a photo in a saved layout', () => {
  const frame = { x: 10, y: 10, w: 80, h: 40 };
  const filledWith = (photoId: number) => ({ type: 'photo' as const, photoId, focalX: 0.5, focalY: 0.5, zoom: 1 });
  const title = (photoId: number) =>
    bookTextElementSchema.parse({
      id: 'h',
      kind: 'text',
      frame,
      text: 'Sintra',
      size: 40,
      fillPaint: filledWith(photoId),
    });
  const pictured = (id: string, photoId: number) =>
    bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId, focalX: 0.2, focalY: 0.7 });
  const spread = (id: string, elements: BookElement[]): BookSpread =>
    bookSpreadSchema.parse({ id, role: 'inner', elements });
  const fills = (sp: BookSpread) => sp.elements.flatMap((e) => (e.kind === 'text' ? [e.fillPaint ?? null] : []));

  it('BOOKLAY-021: keeps no photo of the page it was saved from, in its frames or in its letters', () => {
    const layout = bookLayoutFromSpread(spread('a', [pictured('p', 42), title(42)]), page, 'Title');
    expect(layout.elements.map((e) => e.kind)).toEqual(['photo', 'text']);
    expect(bookElementPhotoIds(layout.elements)).toEqual([]);
    const next = applySavedBookLayout(spread('b', [pictured('q', 7), title(7)]), layout, page);
    expect(fills(next)).toEqual([null]);
    expect(bookSpreadPhotoIds(next)).toEqual([7]);
  });

  it("BOOKLAY-022: an older layout's filled title takes the page's own photo, or its colour without one", () => {
    const saved: BookLayout = {
      ...bookLayoutFromSpread(spread('a', [pictured('p', 42)]), page, 'Old'),
      elements: [bookPhotoElementSchema.parse({ id: 'p', kind: 'photo', frame }), title(42)],
    };
    const onPhotos = applySavedBookLayout(spread('b', [pictured('q', 7), title(7)]), saved, page);
    expect(fills(onPhotos)).toEqual([{ type: 'photo', photoId: 7, focalX: 0.2, focalY: 0.7, zoom: 1 }]);
    const bare = applySavedBookLayout(spread('c', [title(7)]), saved, page);
    expect(fills(bare)).toEqual([null]);
    expect(fills(bookLayoutPreview(saved, page))).toEqual([null]);
  });
});
