import {
  BOOK_COVER_TEMPLATES,
  BOOK_TEMPLATES,
  applyBookTemplate,
  classifyBookTexts,
  findBookTemplate,
} from './book-layouts';
import { bookPageSetupSchema, type BookElement, type BookPageSetup } from './book.schema';

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
});
