import { spreadFindings } from './book-findings';
import { bookBusyUnder, bookLevelFindings, bookVisiblePart, designFindings } from './book-findings-design';
import type { BookPhotoInfo } from './book-ops-core';
import type { BookFinding } from './book-ops.schema';
import { blankBook } from './book-pages';
import {
  bookBadgeElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookStatsElementSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookPhotoElement,
  type BookSpread,
} from './book.schema';
import { describeSpread, pageFindings } from './describe-spread';

import { describe, expect, it } from 'vitest';

/**
 * The design checks on small fixture pages, each with one fault, on the
 * default square book (210 mm pages, the fold at 210).
 */

type Frame = { x: number; y: number; w: number; h: number };

const photo = (id: string, photoId: number, frame: Frame, over = {}) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId, ...over }) as BookPhotoElement;
const text = (id: string, words: string, frame: Frame, over = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: words, size: 10, ...over }) as BookElement;
const shape = (id: string, frame: Frame, over = {}) =>
  bookShapeElementSchema.parse({ id, kind: 'shape', frame, ...over }) as BookElement;

/** A busy left half and a calm right half, row by row. */
const halves = Array.from({ length: 8 }, () => 'ffff0000').join('');

const gallery: BookPhotoInfo[] = [
  { photoId: 1, width: 4000, height: 3000, busy: halves, luma: 150 },
  { photoId: 2, width: 4000, height: 3000, salient: { x: 0.95, y: 0.5 } },
];

function spread(elements: BookElement[], over: Partial<BookSpread> = {}): BookSpread {
  return { id: 'sp-in', role: 'inner', background: null, elements, parked: [], entryId: null, ...over };
}
const page = blankBook({ title: 'T' }).page;
const codes = (list: BookFinding[]) => list.map((f) => `${f.severity}:${f.code}`);
const design = (elements: BookElement[], over: Partial<BookSpread> = {}) =>
  codes(designFindings(spread(elements, over), page, gallery));

const hero = photo('p-1', 1, { x: 230, y: 20, w: 160, h: 120 });

describe('design findings', () => {
  it('BOOKQA-001: finds words on the busy part of a picture, and none on its calm part or on a scrim', () => {
    expect(design([hero, text('t-1', 'Busy', { x: 235, y: 40, w: 60, h: 10 })])).toContain('warn:text_on_busy');
    expect(design([hero, text('t-2', 'Calm', { x: 330, y: 40, w: 50, h: 10 })])).not.toContain('warn:text_on_busy');
    const scrim = shape('s-1', { x: 232, y: 36, w: 70, h: 18 }, { fill: '#111111', opacity: 0.6 });
    const onScrim = text('t-3', 'Busy', { x: 235, y: 40, w: 60, h: 10 }, { color: '#ffffff' });
    expect(design([hero, scrim, onScrim])).toEqual([]);
  });

  it('BOOKQA-002: finds type that does not stand out, severe under 2:1, and lets large type through at 3:1', () => {
    const line = { x: 230, y: 20, w: 60, h: 10 };
    expect(design([text('t-1', 'Grey', line, { color: '#999999' })])).toContain('warn:contrast_low');
    expect(design([text('t-2', 'Pale', line, { color: '#eeeeee' })])).toContain('severe:contrast_low');
    const large = text('t-3', 'Large', { x: 230, y: 20, w: 120, h: 20 }, { color: '#888888', size: 24 });
    expect(design([large])).not.toContain('warn:contrast_low');
    const light = text('t-4', 'Light', { x: 235, y: 100, w: 60, h: 10 }, { color: '#ffffff' });
    expect(design([hero, light])).toContain('warn:contrast_low');
  });

  it('BOOKQA-003: reads figures in their ink, and leaves a mark that picks its own colour alone', () => {
    const stats = bookStatsElementSchema.parse({ id: 'st', kind: 'stats', frame: { x: 230, y: 20, w: 80, h: 30 } });
    expect(design([{ ...stats, color: '#dddddd' } as BookElement])).toContain('severe:contrast_low');
    const chip = bookBadgeElementSchema.parse({ id: 'bd', kind: 'badge', frame: { x: 230, y: 20, w: 30, h: 8 } });
    expect(design([{ ...chip, color: '#ffffff' } as BookElement])).toEqual([]);
  });

  it('BOOKQA-004: finds type too small to read, a body sooner than a caption', () => {
    const line = { x: 230, y: 20, w: 60, h: 10 };
    expect(design([text('t-1', 'Short', line, { size: 5 })])).toContain('warn:small_text');
    const long = 'A sentence that goes on for a while. '.repeat(4);
    const block = { x: 230, y: 20, w: 160, h: 40 };
    expect(design([text('t-2', long, block, { size: 6.5 })])).toContain('warn:small_text');
    expect(design([text('t-3', 'Caption', line, { size: 6 })])).not.toContain('warn:small_text');
  });

  it('BOOKQA-005: notes a packed page and two pictures all but touching, as context', () => {
    const tiles = Array.from({ length: 9 }, (_, i) =>
      photo(`p-${i}`, 1, { x: 215 + (i % 3) * 66, y: 5 + Math.floor(i / 3) * 67, w: 66, h: 67 }),
    );
    expect(design(tiles)).toContain('info:crowded');
    const a = photo('p-a', 1, { x: 230, y: 20, w: 60, h: 40 });
    const close = [a, photo('p-b', 1, { x: 291, y: 20, w: 60, h: 40 })];
    expect(design(close)).toContain('info:crowded');
  });

  it('BOOKQA-006: notes an edge just off the margin, and not one on it', () => {
    expect(design([text('t-1', 'Near', { x: 6.5, y: 40, w: 60, h: 10 })])).toContain('info:off_grid');
    expect(design([text('t-2', 'On', { x: 40, y: 40, w: 60, h: 10 })])).not.toContain('info:off_grid');
    expect(design([text('t-3', '.', { x: 40, y: 40, w: 2, h: 10 })])).not.toContain('info:off_grid');
    const bled = photo('p-9', 1, { x: -2, y: -2, w: 424, h: 214 });
    const thin = codes(designFindings(spread([bled]), { ...page, bleed: 2 }, gallery));
    expect(thin).not.toContain('info:off_grid');
  });

  it('BOOKQA-007: maps the busy grid through the crop, and says what part of the picture a frame shows', () => {
    const tall = photo('p-t', 1, { x: 230, y: 20, w: 60, h: 120 });
    const part = bookVisiblePart(tall, gallery[0]);
    expect(part?.w).toBeCloseTo(0.375, 3);
    expect(part?.x).toBeCloseTo(0.3125, 3);
    expect(bookBusyUnder(hero, gallery[0], { x: 230, y: 20, w: 80, h: 120 })).toBe(15);
    expect(bookBusyUnder(hero, gallery[0], { x: 310, y: 20, w: 80, h: 120 })).toBe(0);
    expect(bookBusyUnder(hero, { photoId: 1 }, { x: 230, y: 20, w: 80, h: 120 })).toBeNull();
  });

  it('BOOKQA-008: finds the picture detail cropped out of its frame, from its salient point', () => {
    const cut = photo('p-2', 2, { x: 230, y: 20, w: 60, h: 120 });
    expect(codes(spreadFindings(spread([cut]), page, gallery))).toContain('warn:focal_cut');
    const kept = photo('p-3', 2, { x: 230, y: 20, w: 60, h: 120 }, { focalX: 0.95 });
    expect(codes(spreadFindings(spread([kept]), page, gallery))).not.toContain('warn:focal_cut');
  });
});

describe('book level and the page in words', () => {
  function bookOf(spreads: BookElement[][]): BookDocument {
    const doc = blankBook({ title: 'T' });
    const inner = spreads.map((elements, i) => spread(elements, { id: `sp-${i}` }));
    return { ...doc, spreads: [doc.spreads[0] as BookSpread, ...inner, doc.spreads[4] as BookSpread] };
  }

  it('BOOKQA-009: finds more than three typefaces in a book, and says so once', () => {
    const fonts = ['sans', 'serif', 'bebas', 'playfair'].map((font, i) => [
      text(`t-${i}`, 'Hi', { x: 230, y: 20, w: 60, h: 10 }, { font }),
    ]);
    const list = bookLevelFindings(bookOf(fonts));
    expect(list.filter((f) => f.code === 'font_mix')).toHaveLength(1);
    expect(list.find((f) => f.code === 'font_mix')?.message).toMatch(/4 typefaces .*keep to three/);
    // A display face, a body face and one more is a book, not a sampler.
    const mixOf = (pages: typeof fonts) => bookLevelFindings(bookOf(pages)).filter((f) => f.code === 'font_mix');
    expect(mixOf(fonts.slice(0, 3))).toEqual([]);
    expect(mixOf(fonts.slice(0, 2))).toEqual([]);
    // A script laid over a title and a mono line on a ticket dress a page; they are not a fourth voice.
    const dressed = ['caveat', 'mono'].map((font, i) => [
      text(`d-${i}`, 'Hi', { x: 230, y: 40, w: 60, h: 10 }, { font }),
    ]);
    expect(mixOf([...fonts.slice(0, 3), ...dressed])).toEqual([]);
    expect(mixOf([...fonts, ...dressed])[0]?.message).toMatch(/4 typefaces \(bebas, playfair, sans, serif\)/);
  });

  it('BOOKQA-010: notes colours outside the book own and the same page three times running', () => {
    const inks = ['#111111', '#121212', '#131313', '#141414', '#151515', '#161616', '#ff0000'];
    const page1 = inks.map((color, i) => text(`t-${i}`, 'Hi', { x: 230, y: 10 + i * 12, w: 60, h: 10 }, { color }));
    const same = [text('t-s', 'Same', { x: 230, y: 20, w: 60, h: 10 })];
    const list = codes(bookLevelFindings(bookOf([page1, same, same, same])));
    expect(list).toContain('info:palette_drift');
    expect(list).toContain('info:repeat_layout');
    const repeat = bookLevelFindings(bookOf([page1, same, same, same])).find((f) => f.code === 'repeat_layout');
    expect(repeat?.elementIds).toEqual([]);
  });

  it('BOOKQA-011: describes every kind in words, a crop with its face note, and adds the design findings', () => {
    const frame = { x: 230, y: 150, w: 30, h: 8 };
    const badge = bookBadgeElementSchema.parse({ id: 'bd', kind: 'badge', variant: 'day', text: 'DAY 3', frame });
    const crop = photo('p-c', 1, { x: 230, y: 20, w: 60, h: 120 });
    const grey = text('t-g', 'Grey', { x: 330, y: 160, w: 60, h: 10 }, { color: '#bbbbbb' });
    const doc = blankBook({ title: 'T', newId: (p) => `${p}-q` });
    const target = spread([crop, badge as BookElement, grey], { id: 'sp-x' });
    const withPage = { ...doc, spreads: [...doc.spreads.slice(0, 2), target, ...doc.spreads.slice(2)] };
    const d = describeSpread(withPage, 'sp-x', gallery);
    expect(d?.text).toMatch(/day mark "DAY 3", plain; sans bold/);
    expect(d?.text).toMatch(/no face detection/);
    expect(d?.findings.map((f) => f.code)).toContain('contrast_low');
    expect(pageFindings(target, page, gallery).map((f) => f.code)).toContain('contrast_low');
  });
});
