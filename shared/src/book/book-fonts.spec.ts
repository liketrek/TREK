import {
  bookFacesUsed,
  bookFontCountsInMix,
  bookFontFace,
  bookFontHasItalic,
  bookFontHasWeight,
  bookFontIndex,
  bookFontRole,
  bookFontSuits,
  bookFontsUsed,
  bookWeightWord,
  isBookFontId,
  nearestBookWeight,
  withRealWeight,
} from './book-fonts';
import { BOOK_FONT_FACES, BOOK_FONTS_IDS, BOOK_FONTS_PRECACHED, BOOK_WEIGHTS } from './book-fonts.data';
import { bookFontIdSchema, bookWeightSchema } from './book-op-enums';
import { applyBookOps } from './book-ops';
import { blankBook } from './book-pages';
import {
  bookStatsElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
} from './book.schema';
import { describeSpread } from './describe-spread';

import { describe, expect, it } from 'vitest';

// BKFONT-001 to BKFONT-010

/**
 * The book's typefaces as one catalogue: the schema's ids, the weights and
 * italics each family really ships, what each is for, and the snap the
 * Studio and the page operations share, so the assistant never sets a weight
 * the editor would not.
 */

const frame = { x: 230, y: 40, w: 120, h: 30 };
const text = (id: string, over: Record<string, unknown> = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: 'Lisbon', ...over }) as BookElement;

function book(elements: BookElement[]): BookDocument {
  const doc = blankBook({ title: 'Lisbon', newId: (p) => `${p}-x` });
  const ids = ['sp-cover', 'sp-first', 'sp-in', 'sp-last', 'sp-back'];
  const spreads = doc.spreads.map((s, i) => ({ ...s, id: ids[i] as string }));
  const inner = { ...(spreads[2] as BookSpread), role: 'inner' as const, elements };
  return { ...doc, spreads: [spreads[0], spreads[1], inner, spreads[3], spreads[4]] as BookSpread[] };
}

let seq = 0;
const run = (doc: BookDocument, ops: Parameters<typeof applyBookOps>[1]['ops']) =>
  applyBookOps(doc, { spreadId: 'sp-in', ops }, { newId: (p) => `${p}-n${++seq}` });
const inner = (doc: BookDocument) => doc.spreads[2] as BookSpread;

describe('the catalogue', () => {
  it('BKFONT-001: names every family the schema takes, once, with a face, a stack ending in a generic and a weight', () => {
    expect([...BOOK_FONTS_IDS].sort()).toEqual(Object.keys(BOOK_FONT_FACES).sort());
    expect(new Set(BOOK_FONTS_IDS).size).toBe(BOOK_FONTS_IDS.length);
    expect(BOOK_FONTS_IDS.slice(0, 7)).toEqual(['sans', 'inter', 'serif', 'garamond', 'playfair', 'display', 'bebas']);
    for (const id of BOOK_FONTS_IDS) {
      const face = BOOK_FONT_FACES[id];
      expect(face.stack.startsWith(`"${face.name}"`), id).toBe(true);
      expect(['sans-serif', 'serif', 'cursive', 'monospace'], id).toContain(face.stack.split(',').pop()?.trim());
      expect(face.weights.length, id).toBeGreaterThan(0);
      expect(
        [...face.weights].sort((a, b) => a - b),
        id,
      ).toEqual([...face.weights]);
      for (const w of face.italics) expect(face.weights, `${id} italic ${w}`).toContain(w);
      expect(face.letterEm, id).toBeGreaterThan(0.2);
      expect(face.letterEm, id).toBeLessThan(0.7);
      // A measured bold only where the family ships one, and never narrower than its regular.
      const bold = (face as { boldEm?: number }).boldEm;
      if (bold !== undefined) {
        expect(face.weights as readonly number[], id).toContain(700);
        expect(bold, id).toBeGreaterThanOrEqual(face.letterEm);
      }
      expect(face.roles.length, id).toBeGreaterThan(0);
    }
  });

  it('BKFONT-002: has real italics for the serifs that used to be slanted by the browser', () => {
    for (const id of ['serif', 'garamond', 'playfair', 'cormorant']) {
      expect(bookFontHasItalic(id, 400), id).toBe(true);
    }
    expect(bookFontHasItalic('sans', 400)).toBe(false);
    expect(bookFontHasItalic('playfair', 300)).toBe(false);
    expect(bookFontHasItalic('nothing', 400)).toBe(false);
  });

  it('BKFONT-003: installs offline only the faces the book shipped with, each a weight the family has', () => {
    for (const [id, weights] of Object.entries(BOOK_FONTS_PRECACHED)) {
      for (const w of weights ?? []) expect(bookFontHasWeight(id, w), `${id} ${w}`).toBe(true);
    }
    expect(Object.keys(BOOK_FONTS_PRECACHED).sort()).toEqual(BOOK_FONTS_IDS.slice(0, 7).sort());
  });

  it('BKFONT-004: reads a family and its roles, and answers an unknown id without guessing', () => {
    expect(bookFontFace('anton')?.name).toBe('Anton');
    expect(bookFontFace('toString')).toBeUndefined();
    expect([isBookFontId('caveat'), isBookFontId('comic')]).toEqual([true, false]);
    expect([bookFontRole('caveat'), bookFontRole('mono'), bookFontRole('anton'), bookFontRole('nothing')]).toEqual([
      'script',
      'mono',
      'display',
      'body',
    ]);
    expect([bookFontSuits('garamond', 'body'), bookFontSuits('anton', 'body')]).toEqual([true, false]);
    expect([bookFontCountsInMix('caveat'), bookFontCountsInMix('mono'), bookFontCountsInMix('serif')]).toEqual([
      false,
      false,
      true,
    ]);
  });
});

describe('weights', () => {
  it('BKFONT-005: snaps to the nearest weight a family has, the lighter on a tie, and leaves an unknown family alone', () => {
    expect(nearestBookWeight('anton', 900)).toBe(400);
    expect(nearestBookWeight('oswald', 100)).toBe(200);
    expect(nearestBookWeight('oswald', 900)).toBe(700);
    expect(nearestBookWeight('mono', 700)).toBe(500);
    expect(nearestBookWeight('cormorant', 200)).toBe(300);
    expect(nearestBookWeight('sans', 900)).toBe(900);
    expect(nearestBookWeight('unknown', 600)).toBe(600);
    expect([bookFontHasWeight('bebas', 700), bookFontHasWeight('unknown', 650)]).toEqual([false, true]);
    expect(BOOK_WEIGHTS.map(bookWeightWord)).toEqual([
      'thin',
      'extralight',
      'light',
      'regular',
      'medium',
      'semibold',
      'bold',
      'extrabold',
      'black',
    ]);
    expect(bookWeightWord(450)).toBe('450');
  });

  it('BKFONT-006: moves a typeset element onto a real weight and hands every other element back as it was', () => {
    const heavy = text('t', { font: 'anton', weight: 700 });
    expect(withRealWeight(heavy)).toMatchObject({ weight: 400 });
    const fine = text('t', { font: 'sans', weight: 700 });
    expect(withRealWeight(fine)).toBe(fine);
    const stats = bookStatsElementSchema.parse({ id: 's', kind: 'stats', frame, font: 'league' }) as BookElement;
    expect(withRealWeight(stats)).toMatchObject({ weight: 400 });
    const shape = { id: 'x', kind: 'shape', frame } as unknown as BookElement;
    expect(withRealWeight(shape)).toBe(shape);
  });

  it('BKFONT-007: takes every weight from 100 to 900 in a document and nothing between them', () => {
    expect(bookTextElementSchema.safeParse({ id: 't', kind: 'text', frame, weight: 100 }).success).toBe(true);
    expect(bookTextElementSchema.safeParse({ id: 't', kind: 'text', frame, weight: 900 }).success).toBe(true);
    expect(bookTextElementSchema.safeParse({ id: 't', kind: 'text', frame, weight: 450 }).success).toBe(false);
    expect(bookWeightSchema.safeParse(800).success).toBe(true);
  });
});

describe('a book and its faces', () => {
  it('BKFONT-008: lists the families a book is set in and the faces it needs drawn, each once', () => {
    const doc = book([
      text('t1', { font: 'caveat', weight: 700 }),
      text('t2', { font: 'serif', italic: true }),
      text('t3', { font: 'sans', italic: true }),
      text('t4', { font: 'anton', text: '   ' }),
      bookStatsElementSchema.parse({ id: 's', kind: 'stats', frame, font: 'oswald' }) as BookElement,
    ]);
    const used = bookFontsUsed(doc);
    expect(used).toEqual(expect.arrayContaining(['caveat', 'serif', 'oswald']));
    expect(used).not.toContain('anton');
    expect(used.indexOf('serif')).toBeLessThan(used.indexOf('caveat'));
    const faces = bookFacesUsed(doc);
    expect(faces).toContainEqual({ font: 'caveat', weight: 700, italic: false });
    expect(faces).toContainEqual({ font: 'serif', weight: 400, italic: true });
    // Poppins has no italic file: its slant is the browser's, so the upright face is what loads.
    expect(faces).toContainEqual({ font: 'sans', weight: 400, italic: false });
    expect(faces).toContainEqual({ font: 'oswald', weight: 700, italic: false });
    expect(faces).toContainEqual({ font: 'oswald', weight: 600, italic: false });
    const keys = faces.map((f) => `${f.font}|${f.weight}|${f.italic}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('the assistant reads the same type', () => {
  it('BKFONT-009: describes every family with its role and weights in the id the tools take', () => {
    const index = bookFontIndex();
    for (const id of BOOK_FONTS_IDS) expect(index, id).toContain(id);
    expect(index).toMatch(/^display: /);
    expect(index).toContain('script: caveat 400-700');
    expect(index).toContain('bebas 400 caps');
    expect(index).toContain('serif Lora 400-700 i');
    expect(index).not.toMatch(/[\u2013\u2014\n]/);
    expect(String(bookFontIdSchema.description)).toContain(index);
  });

  it('BKFONT-010: sets a style or a text change at a weight the family has, and says so in the page description', () => {
    const doc = book([text('t1')]);
    const styled = run(doc, [{ op: 'style', elementId: 't1', set: { kind: 'text', font: 'anton', weight: 900 } }]);
    if (!styled.ok) throw new Error(styled.error.message);
    expect(inner(styled.doc).elements[0]).toMatchObject({ font: 'anton', weight: 400 });
    const retexted = run(doc, [{ op: 'text', elementId: 't1', font: 'mono', weight: 700 }]);
    if (!retexted.ok) throw new Error(retexted.error.message);
    expect(inner(retexted.doc).elements[0]).toMatchObject({ font: 'mono', weight: 500 });
    const page = describeSpread(retexted.doc, 'sp-in')?.text ?? '';
    expect(page).toContain('mono (mono) 11 pt medium');
    const light = run(doc, [{ op: 'style', elementId: 't1', set: { kind: 'text', font: 'fraunces', weight: 300 } }]);
    if (!light.ok) throw new Error(light.error.message);
    expect(describeSpread(light.doc, 'sp-in')?.text).toContain('fraunces (display) 11 pt light');
  });
});
