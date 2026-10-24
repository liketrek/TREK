import { describe, expect, it } from 'vitest';

import type { BookSpread } from '@trek/shared';
import { BOOK_LOCKUPS, bookElementSchema, bookPageSetupSchema, findBookLockup, formatBookCoords } from '@trek/shared';

import { SHELF_GROUPS, placeLockup, previewLockup, shelfLockups, shelfWords } from './textStylesModel';

const t = (k: string) => `[${k}]`;
const page = bookPageSetupSchema.parse({});
const source = {
  entries: [
    { date: null, lat: null, lng: null },
    { date: '2025-08-12', lat: 41.1496, lng: -8.611 },
  ],
  photos: [{ photoId: 3 }],
};

const lockup = (id: string) => {
  const found = findBookLockup(id);
  if (!found) throw new Error(`${id} is missing`);
  return found;
};

describe('the words of the shelf', () => {
  it("fills a lockup with the book's title, the year and point of its first stop, and samples for the rest", () => {
    const words = shelfWords('  Porto  ', source, t);
    expect(words.title).toBe('Porto');
    expect(words.year).toBe('2025');
    expect(words.coords).toBe(formatBookCoords(41.1496, -8.611));
    expect(words.subtitle).toBe('[journey.studio.lockupWord.subtitle]');
    expect(words.number).toBe('01');
  });

  it('falls back to a sample title, this year and Lisbon for a book that has none of them', () => {
    const words = shelfWords('', { entries: [], photos: [] }, t, new Date('2031-03-01T12:00:00'));
    expect(words.title).toBe('[journey.studio.lockupWord.title]');
    expect(words.year).toBe('2031');
    expect(words.coords).toBe(formatBookCoords(38.7139, -9.1334));
  });
});

describe('the shelf', () => {
  it('shows every lockup of the catalogue once, in its groups', () => {
    const shown = SHELF_GROUPS.flatMap((g) => shelfLockups(g.lockups).map((l) => l.id));
    expect(shown).toHaveLength(BOOK_LOCKUPS.length);
    expect(new Set(shown)).toEqual(new Set(BOOK_LOCKUPS.map((l) => l.id)));
    expect(shelfLockups(['nope', 'stamp']).map((l) => l.id)).toEqual(['stamp']);
  });

  it('places a lockup on the page it is on, filling a photo word from that page', () => {
    const spread = {
      id: 'sp',
      role: 'cover',
      background: null,
      parked: [],
      entryId: null,
      elements: [{ id: 'p', kind: 'photo', photoId: 8 }],
    } as unknown as BookSpread;
    let n = 0;
    const els = placeLockup(lockup('photo-word'), {
      page,
      spread,
      words: shelfWords('Porto', source, t),
      gallery: source.photos,
      newId: (p) => `${p}-${(n += 1)}`,
    });
    expect(els.map((e) => e.id)).toEqual(['t-1', 't-2']);
    for (const el of els) expect(el.frame.x + el.frame.w).toBeLessThanOrEqual(page.pageWidth);
    const word = els[1];
    expect(word?.kind === 'text' && word.fillPaint).toMatchObject({ type: 'photo', photoId: 8 });
  });

  it('draws a preview at the origin, 100 mm wide, every element one the document reads', () => {
    const els = previewLockup(lockup('postmark'), shelfWords('Porto', source, t), null);
    expect(els.length).toBeGreaterThan(3);
    expect(new Set(els.map((e) => e.id)).size).toBe(els.length);
    for (const el of els) {
      expect(bookElementSchema.safeParse(el).success).toBe(true);
      expect(el.frame.x).toBeGreaterThanOrEqual(0);
      expect(el.frame.x + el.frame.w).toBeLessThanOrEqual(100.01);
    }
  });
});
