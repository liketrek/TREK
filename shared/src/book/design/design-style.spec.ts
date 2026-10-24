import { bookFontHasWeight } from '../book-fonts';
import { bookPageSetupSchema, type BookDocument, type BookTextElement } from '../book.schema';
import { designBook, type BookDesignInput } from './design-book';
import { bookDesignDirectivesSchema, type BookDesignDirectivesInput } from './design-directives.schema';
import { designLook } from './design-style';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// BOOKSTY-001 to BOOKSTY-007

/**
 * The type scale of a designed book: `type.scale` reaches a poster's sizes,
 * the cover title has a display tier of its own, and a book designed without
 * either is set exactly as before.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210 });
const lookOf = (directives: BookDesignDirectivesInput, on = page) =>
  designLook(bookDesignDirectivesSchema.parse(directives), on, []);

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const fixtures = JSON.parse(readFileSync(here('./design-book.fixtures.json'), 'utf8')) as {
  rich: { input: BookDesignInput };
};

/** The rich fixture journey, its ids minted by a counter so every run designs the same book. */
function rich(): BookDesignInput {
  let n = 0;
  return { ...fixtures.rich.input, newId: (p) => `${p}-${++n}` };
}

/** The cover's title: the text bound to the journey's title. */
function coverTitle(doc: BookDocument): BookTextElement | undefined {
  const cover = doc.spreads.find((s) => s.role === 'cover');
  return cover?.elements.find((e): e is BookTextElement => e.kind === 'text' && e.binding?.source === 'journey.title');
}

describe('the type scale', () => {
  it('BOOKSTY-001: sets the cover title at the heading size when nothing asks for more, as before', () => {
    const look = lookOf({ style: 'classic' });
    expect(look.sizes).toEqual({ display: 28, heading: 28, sub: 14, body: 10, caption: 7.5, meta: 7 });
    expect(lookOf({ style: 'classic', type: { scale: 1.3 } }).sizes.heading).toBe(36.4);
  });

  it('BOOKSTY-002: takes a scale up to 2.5 and a display tier up to 6.5, and nothing past either', () => {
    const parse = (type: Record<string, number>) => bookDesignDirectivesSchema.safeParse({ type }).success;
    expect([parse({ scale: 2.5 }), parse({ scale: 2.6 }), parse({ scale: 0.7 })]).toEqual([true, false, false]);
    expect([parse({ display: 6.5 }), parse({ display: 6.6 }), parse({ display: 0.9 })]).toEqual([true, false, false]);
    const poster = lookOf({ style: 'bold', type: { scale: 2.5, display: 2 } });
    expect([poster.sizes.heading, poster.sizes.display, poster.sizes.body]).toEqual([70, 140, 25]);
    // The cover tier alone carries a cover-filling title: body stays where the style sets it.
    const cover = lookOf({ style: 'bold', type: { display: 6.5 } });
    expect([cover.sizes.heading, cover.sizes.display, cover.sizes.body]).toEqual([28, 182, 10]);
  });

  it('BOOKSTY-003: never sets a size past what a text element takes, on the largest page either', () => {
    const large = bookPageSetupSchema.parse({ preset: 'custom', pageWidth: 500, pageHeight: 500 });
    const look = lookOf({ style: 'bold', type: { scale: 2.5, display: 3 } }, large);
    expect(look.sizes.display).toBe(200);
    expect(Math.max(...Object.values(look.sizes))).toBeLessThanOrEqual(200);
  });
});

describe('the cover title', () => {
  it('BOOKSTY-004: starts at the display size and comes out larger than the heading, still inside its box', () => {
    const plain = coverTitle(designBook(null, rich(), { style: 'classic' }).doc);
    const big = coverTitle(designBook(null, rich(), { style: 'classic', type: { display: 3 } }).doc);
    const base = plain?.size ?? 0;
    expect(base).toBeGreaterThan(0);
    expect(big?.size ?? 0).toBeGreaterThan(base);
    expect(big?.size ?? 0).toBeLessThanOrEqual(base * 3);
    const largest = coverTitle(designBook(null, rich(), { style: 'classic', type: { display: 6.5 } }).doc);
    expect(largest?.size ?? 0).toBeGreaterThanOrEqual(big?.size ?? 0);
    expect(largest?.size ?? 0).toBeLessThanOrEqual(182);
    expect((largest?.frame.y ?? 0) + (largest?.frame.h ?? 0)).toBeLessThanOrEqual(page.pageHeight);
    // The box under the title is the foot of the cover, below its 60 % line.
    expect((big?.frame.y ?? 0) + (big?.frame.h ?? 0)).toBeLessThanOrEqual(page.pageHeight);
  });
});

describe('the typefaces by their roles', () => {
  it('BOOKSTY-005: keeps a body face that sets running text, and falls back to the style for one that does not', () => {
    expect(lookOf({ style: 'classic', type: { body: 'garamond' } }).body).toBe('garamond');
    // A poster face and a script are a title's, never a story's.
    expect(lookOf({ style: 'classic', type: { body: 'anton' } }).body).toBe('sans');
    expect(lookOf({ style: 'editorial', type: { body: 'caveat' } }).body).toBe('garamond');
  });

  it('BOOKSTY-006: sets the travel elements in the heading face, unless that is a script or a mono face', () => {
    expect(lookOf({ style: 'bold' }).figures).toBe('bebas');
    const script = lookOf({ style: 'journal', type: { heading: 'caveat' } });
    expect([script.heading, script.figures]).toEqual(['caveat', 'garamond']);
    expect(lookOf({ style: 'classic', type: { heading: 'mono', body: 'inter' } }).figures).toBe('inter');
  });

  it('BOOKSTY-007: sets every text and travel element at a weight its family really has', () => {
    const { doc } = designBook(null, rich(), { style: 'bold', type: { heading: 'anton' } });
    const typeset = doc.spreads.flatMap((s) => s.elements.filter((e) => 'weight' in e && 'font' in e));
    expect(typeset.length).toBeGreaterThan(0);
    for (const el of typeset) {
      if ('weight' in el && 'font' in el) expect(bookFontHasWeight(el.font, el.weight), el.id).toBe(true);
    }
    expect(typeset.some((e) => 'font' in e && e.font === 'anton')).toBe(true);
  });
});
