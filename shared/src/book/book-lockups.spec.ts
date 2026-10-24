import { contrastRatio } from './book-colour';
import {
  BOOK_LOCKUP_PALETTE,
  addBookLockup,
  buildBookLockup,
  bookLockupBox,
  findBookLockup,
  type BookLockupWords,
} from './book-lockups';
import { BOOK_LOCKUPS } from './book-lockups.data';
import { formatBookCoords } from './book-text';
import { bookTextFits } from './book-text-fit';
import { bookElementSchema, bookPageSetupSchema, type BookSpread, type BookTextElement } from './book.schema';
import { pageFindings } from './describe-spread';

import { describe, expect, it } from 'vitest';

/**
 * The lockups: every one builds into elements the document reads, its words
 * fitted into their frames, and placed as it comes on a blank page it has no
 * finding worth fixing, with a short title and with a long one.
 */

const page = bookPageSetupSchema.parse({});

const WORDS: BookLockupWords = {
  title: 'Lisbon',
  subtitle: 'A summer by the sea',
  kicker: 'Travel journal',
  overlay: 'travel',
  year: '2026',
  place: 'Portugal',
  dates: '12 to 26 August',
  quote: 'The best views come after the hardest climbs.',
  caption: 'Alfama at first light',
  number: '01',
  label: 'Day',
  coords: formatBookCoords(38.7139, -9.1334),
};
const LONG: BookLockupWords = {
  ...WORDS,
  title: 'Two weeks along the Portuguese coast',
  place: 'Sintra and the coast',
};

let seq = 0;
const newId = (p: string) => `${p}-${++seq}`;

const spreadOf = (elements: BookSpread['elements']): BookSpread => ({
  id: 'sp',
  role: 'inner',
  background: null,
  elements,
  parked: [],
  entryId: null,
});

describe('the lockup catalogue', () => {
  it('BKLCK-001: holds 24 lockups with unique ids, each described and drawn inside its own box', () => {
    expect(BOOK_LOCKUPS).toHaveLength(24);
    expect(new Set(BOOK_LOCKUPS.map((l) => l.id)).size).toBe(24);
    for (const l of BOOK_LOCKUPS) {
      expect(l.descr.length, l.id).toBeGreaterThan(20);
      expect(l.share, l.id).toBeGreaterThan(0);
      expect(l.share, l.id).toBeLessThanOrEqual(1);
      for (const p of l.parts) {
        expect(p.x, `${l.id} x`).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w, `${l.id} right`).toBeLessThanOrEqual(100.01);
        expect(p.y, `${l.id} y`).toBeGreaterThanOrEqual(0);
        expect(p.y + p.h, `${l.id} foot`).toBeLessThanOrEqual(l.height + 0.01);
      }
    }
    expect(findBookLockup('postmark')?.id).toBe('postmark');
    expect(findBookLockup('nope')).toBeUndefined();
  });

  it('BKLCK-002: sets its small lines in a grey that still reads on white paper', () => {
    expect(contrastRatio(BOOK_LOCKUP_PALETTE.muted, BOOK_LOCKUP_PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
  });

  for (const [name, words] of [
    ['short', WORDS],
    ['long', LONG],
  ] as const) {
    it(`BKLCK-003 (${name} words): builds every lockup into readable, fitted elements with no severe or warning finding`, () => {
      for (const l of BOOK_LOCKUPS) {
        const els = buildBookLockup(l, bookLockupBox(l, page, false), { words, newId, photoId: 5 });
        expect(els.length, l.id).toBeGreaterThan(0);
        for (const el of els) expect(bookElementSchema.safeParse(el).success, `${l.id} ${el.id}`).toBe(true);
        for (const el of els.filter((e): e is BookTextElement => e.kind === 'text')) {
          expect(bookTextFits(el), `${l.id} "${el.text}"`).toBe(true);
          expect(el.fit).toBe('shrink');
        }
        const found = pageFindings(spreadOf(els), page, [{ photoId: 5, width: 4000, height: 3000 }]);
        expect(
          found.filter((f) => f.severity !== 'info').map((f) => `${f.code}: ${f.message}`),
          l.id,
        ).toEqual([]);
      }
    });
  }
});

describe('building a lockup', () => {
  const poster = findBookLockup('poster-stack');
  if (!poster) throw new Error('poster-stack is missing');

  it('BKLCK-004: scales its units onto the box it is placed in, centred in it, keeping its proportions', () => {
    const els = buildBookLockup(poster, { x: 0, y: 0, w: 200, h: 400 }, { words: WORDS, newId });
    const title = els[0];
    expect(title?.frame.w).toBeCloseTo(200, 1);
    // 62 units tall at 2 mm a unit, centred in a 400 mm box.
    expect(title?.frame.y).toBeCloseTo((400 - 124) / 2, 1);
  });

  it('BKLCK-005: leaves out the parts that were given no words, and builds nothing from no words at all', () => {
    const els = buildBookLockup(poster, { x: 0, y: 0, w: 100, h: 62 }, { words: { title: 'Porto' }, newId });
    expect(els.map((e) => (e.kind === 'text' ? e.text : e.kind))).toEqual(['Porto']);
    expect(buildBookLockup(poster, { x: 0, y: 0, w: 100, h: 62 }, { words: {}, newId })).toEqual([]);
    const quote = findBookLockup('quote-classic');
    if (!quote) throw new Error('quote-classic is missing');
    // The quotation mark is fixed words: alone, it is not a lockup anybody placed.
    expect(buildBookLockup(quote, { x: 0, y: 0, w: 100, h: 56 }, { words: {}, newId })).toEqual([]);
  });

  it('BKLCK-006: takes its colours from the palette it is given', () => {
    const els = buildBookLockup(
      poster,
      { x: 0, y: 0, w: 100, h: 62 },
      {
        words: WORDS,
        newId,
        palette: { ink: '#202020', accent: '#0f766e' },
      },
    );
    const [title, subtitle] = els as BookTextElement[];
    expect(title?.color).toBe('#202020');
    expect(title?.shadow?.color).toBe('#0f766e');
    expect(subtitle?.highlight?.color).toBe('#0f766e');
  });

  it('BKLCK-007: fills a photo word with the photo it is given, and with the accent without one', () => {
    const word = findBookLockup('photo-word');
    if (!word) throw new Error('photo-word is missing');
    const box = { x: 0, y: 0, w: 100, h: 50 };
    const withPhoto = buildBookLockup(word, box, { words: WORDS, newId, photoId: 9 }).find(
      (e) => e.kind === 'text' && e.fillPaint,
    );
    expect(withPhoto?.kind === 'text' && withPhoto.fillPaint).toMatchObject({ type: 'photo', photoId: 9 });
    const title = buildBookLockup(word, box, { words: WORDS, newId }).at(-1) as BookTextElement;
    expect(title.fillPaint).toBeUndefined();
    expect(title.color).toBe(BOOK_LOCKUP_PALETTE.accent);
  });

  it('BKLCK-008: turns a stamp as a whole, about its own centre', () => {
    const stamp = findBookLockup('stamp');
    if (!stamp) throw new Error('stamp is missing');
    const els = buildBookLockup(stamp, { x: 0, y: 0, w: 100, h: 44 }, { words: WORDS, newId });
    for (const el of els) expect(el.rotation).toBe(-7);
    const outer = els[0];
    expect((outer?.frame.x ?? 0) + (outer?.frame.w ?? 0) / 2).toBeCloseTo(50, 1);
    expect((outer?.frame.y ?? 0) + (outer?.frame.h ?? 0) / 2).toBeCloseTo(22, 1);
  });

  it('BKLCK-009: is placed on the right-hand page of a double spread and on the page of a single one', () => {
    const inner = bookLockupBox(poster, page, false);
    expect(inner.x).toBeGreaterThan(page.pageWidth);
    const single = bookLockupBox(poster, page, true);
    expect(single.x + single.w).toBeLessThan(page.pageWidth);
    expect(single.w).toBeCloseTo(page.pageWidth * poster.share, 1);
  });

  it('BKLCK-010: lays a lockup in front of the page as one group, and a single element without one', () => {
    const els = buildBookLockup(poster, { x: 0, y: 0, w: 100, h: 62 }, { words: WORDS, newId });
    const sp = addBookLockup(spreadOf([]), els, 'g-1');
    expect(sp.elements.map((e) => e.group)).toEqual(['g-1', 'g-1', 'g-1']);
    const one = buildBookLockup(poster, { x: 0, y: 0, w: 100, h: 62 }, { words: { title: 'Porto' }, newId });
    const alone = addBookLockup(spreadOf([]), one, 'g-2');
    expect(alone.elements[0]?.group).toBeUndefined();
  });
});
