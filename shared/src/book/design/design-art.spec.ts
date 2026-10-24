import {
  bookPhotoElementSchema,
  bookTextElementSchema,
  type BookElement,
  type BookPageSetup,
  type BookPhotoElement,
  type BookSpread,
} from '../book.schema';
import { BOOK_STICKERS } from '../stickers/sticker-catalogue';
import { bookThemeOf } from '../theme/book-theme';
import {
  CALM_ART,
  STICKERS_PER_SPREAD,
  designArt,
  livelyLook,
  tiltRange,
  withinTilt,
  type DesignArt,
} from './design-art';
import type { ComposeCtx } from './design-compose';
import { bookDesignDirectivesSchema, type BookDesignDirectivesInput } from './design-directives.schema';
import { designRng } from './design-random';
import { decorateSpread, placeStickers, sharedArea, stickersFor, turnedBox } from './design-stickers';
import { designGrid, designLook } from './design-style';

import { describe, expect, it } from 'vitest';

/**
 * The art direction a design is composed in (design-art.ts), the seeded
 * numbers its choices are made with (design-random.ts), and the stickers it
 * lays on a page (design-stickers.ts): never over words, never over a
 * photo's detail, never in the fold or the safe margin.
 */

const parse = (raw: BookDesignDirectivesInput) => bookDesignDirectivesSchema.parse(raw);

describe('the art direction', () => {
  it('DSNART-001: is calm, bare and without collages for a design without a brief', () => {
    const art = designArt(parse({ style: 'tropical' }), bookThemeOf('tropical'), BOOK_STICKERS);
    expect(art).toMatchObject({ briefed: false, energy: 'calm', decoration: 'none', bare: false, collage: false });
    expect(CALM_ART).toMatchObject({ energy: 'calm', decoration: 'none', stickers: [], library: [], tilt: [0, 2] });
  });

  it('DSNART-002: reads the energy from the brief, lively when it asks for decoration or collages alone', () => {
    const theme = bookThemeOf('nordic');
    expect(designArt(parse({ brief: { energy: 'loud' } }), theme).energy).toBe('loud');
    expect(designArt(parse({ brief: { decoration: 'light' } }), theme).energy).toBe('lively');
    expect(designArt(parse({ brief: { collage: true } }), theme)).toMatchObject({ energy: 'lively', collage: true });
    expect(designArt(parse({ brief: { decoration: 'none' } }), theme)).toMatchObject({ energy: 'calm', bare: true });
  });

  it('DSNART-003: decorates a lively book as its theme does, and draws from the theme motifs only', () => {
    const tropical = bookThemeOf('tropical');
    const art = designArt(parse({ brief: { energy: 'lively' }, seed: 9 }), tropical, BOOK_STICKERS);
    expect(art.decoration).toBe(tropical.decoration);
    expect(art.seed).toBe(9);
    expect(art.stickers.length).toBeGreaterThan(5);
    expect(art.stickers.every((s) => tropical.motifs.includes(s.theme as (typeof tropical.motifs)[number]))).toBe(true);
    expect(art.library).toHaveLength(BOOK_STICKERS.length);
    // A theme of the older looks has no motifs: the travel things every journey has.
    const own = { ...tropical, motifs: [] };
    const plain = designArt(parse({ brief: { energy: 'loud', decoration: 'rich' } }), own, BOOK_STICKERS);
    expect(new Set(plain.stickers.map((s) => s.theme))).toEqual(new Set(['ephemera', 'doodles']));
  });

  it('DSNART-004: stickers per spread follow the level: none, light one or two, rich three to six', () => {
    expect(STICKERS_PER_SPREAD).toEqual({ none: [0, 0], light: [1, 2], rich: [3, 6] });
  });

  it('DSNART-005: turns prints as the energy asks, a calm book as far as its theme does, and keeps a turn within it', () => {
    expect(tiltRange('calm')).toEqual([0, 2]);
    expect(tiltRange('calm', 4)).toEqual([0, 4]);
    expect(tiltRange('lively')).toEqual([3, 7]);
    expect(tiltRange('loud', 2)).toEqual([4, 10]);
    const calm = designArt(parse({ brief: { energy: 'calm' } }), bookThemeOf('nordic'));
    expect(calm.tilt).toEqual([0, 2]);
    expect(designArt(parse({ brief: { energy: 'calm' } }), bookThemeOf('poster-pop')).tilt).toEqual([0, 4]);
    expect([withinTilt(calm, 5), withinTilt(calm, -6), withinTilt(calm, 1.5)]).toEqual([2, -2, 1.5]);
    const lively = designArt(parse({ brief: { energy: 'lively' } }), bookThemeOf('nordic'));
    expect(withinTilt(lively, 6)).toBe(6);
  });
});

describe('the seeded numbers', () => {
  it('DSNRNG-001: are the same for one seed and key, and others for another', () => {
    const a = designRng(3, 'cover');
    const b = designRng(3, 'cover');
    const seq = (r: ReturnType<typeof designRng>) => Array.from({ length: 6 }, () => r.next());
    const first = seq(a);
    expect(seq(b)).toEqual(first);
    expect(seq(designRng(4, 'cover'))).not.toEqual(first);
    expect(seq(designRng(3, 'beat'))).not.toEqual(first);
    expect(first.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('DSNRNG-002: stay in their ranges, pick from a list, shuffle without losing anything', () => {
    const rng = designRng(1, 'spec');
    for (let i = 0; i < 200; i++) {
      const r = rng.range(2, 5);
      expect(r >= 2 && r < 5).toBe(true);
      const n = rng.int(3, 6);
      expect(Number.isInteger(n) && n >= 3 && n <= 6).toBe(true);
      expect([1, -1]).toContain(rng.sign());
    }
    expect(rng.pick([])).toBeUndefined();
    expect(['a', 'b']).toContain(rng.pick(['a', 'b']));
    const list = [1, 2, 3, 4, 5, 6];
    const shuffled = rng.shuffle(list);
    expect([...shuffled].sort()).toEqual(list);
    expect(list).toEqual([1, 2, 3, 4, 5, 6]);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
  });
});

const page: BookPageSetup = {
  preset: 'square-210',
  pageWidth: 210,
  pageHeight: 210,
  bleed: 3,
  safe: 5,
  pageNumbers: {
    show: false,
    startAt: 2,
    position: 'outer',
    margin: 12,
    size: 8,
    autoColor: true,
    color: '#8a8578',
    font: 'sans',
  },
};

/** A composing context with an art direction, enough for the stickers. */
function ctxOf(art: DesignArt): ComposeCtx {
  const directives = parse({ style: 'tropical' });
  const look = designLook(directives, page, []);
  let n = 0;
  const labels = { day: '', stations: '', summary: '', countries: '', distance: '', pros: '', cons: '' };
  return {
    look,
    page,
    grid: designGrid(page),
    newId: (p) => `${p}-${++n}`,
    locale: 'en-GB',
    infos: new Map(),
    travel: { locale: 'en-GB', labels, stats: null, path: [], entries: [] },
    directives,
    notes: [],
    art,
  };
}

const rich = (more: Partial<DesignArt> = {}): DesignArt => ({
  ...designArt(parse({ brief: { energy: 'lively', decoration: 'rich' } }), bookThemeOf('tropical'), BOOK_STICKERS),
  ...more,
});

const photo = (id: string, frame: BookPhotoElement['frame'], focal = { focalX: 0.5, focalY: 0.5 }) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame, photoId: 1, ...focal }) as BookElement;
const words = (id: string, frame: BookPhotoElement['frame']) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame, text: 'Porto', size: 20 }) as BookElement;

describe('stickers on a page', () => {
  const elements = [
    photo('p1', { x: 30, y: 30, w: 150, h: 110 }, { focalX: 0.3, focalY: 0.4 }),
    words('t1', { x: 240, y: 30, w: 150, h: 40 }),
    photo('p2', { x: 240, y: 90, w: 150, h: 100 }),
  ];

  it('DSNSTK-001: lie off the words, the photos details, the fold and the safe margin, each a drawing of the motifs', () => {
    const c = ctxOf(rich());
    const made = placeStickers(c, elements, { count: 6, size: [0.14, 0.22], sides: ['left', 'right'], key: 'deco:1' });
    expect(made.length).toBeGreaterThanOrEqual(3);
    const motifs = new Set(rich().stickers.map((s) => s.id));
    const words = elements.filter((e) => e.kind === 'text').map((e) => turnedBox(e.frame, e.rotation));
    for (const k of made) {
      const box = turnedBox(k.frame, k.rotation);
      expect(motifs.has(k.stickerId)).toBe(true);
      expect(words.every((w) => sharedArea(w, box) === 0)).toBe(true);
      expect(box.x + box.w <= 210 - 5 || box.x >= 210 + 5).toBe(true);
      expect(box.y >= 5 && box.y + box.h <= 205 && box.x >= 5 && box.x + box.w <= 415).toBe(true);
      for (const e of elements) {
        if (e.kind !== 'photo') continue;
        const fx = e.frame.x + e.focalX * e.frame.w;
        const fy = e.frame.y + e.focalY * e.frame.h;
        expect(fx >= box.x && fx <= box.x + box.w && fy >= box.y && fy <= box.y + box.h).toBe(false);
      }
    }
    // No two stickers on top of each other, and every drawing different while the library lasts.
    made.forEach((a, i) =>
      made
        .slice(i + 1)
        .forEach((b) => expect(sharedArea(turnedBox(a.frame, a.rotation), turnedBox(b.frame, b.rotation))).toBe(0)),
    );
    expect(new Set(made.map((k) => k.stickerId)).size).toBe(made.length);
    // The same for one key, each from a context of its own (the ids count on from where a context stands).
    const again = () =>
      placeStickers(ctxOf(rich()), elements, { count: 6, size: [0.14, 0.22], sides: ['left', 'right'], key: 'deco:1' });
    expect(again()).toEqual(again());
    expect(again().map((k) => k.stickerId)).toEqual(made.map((k) => k.stickerId));
  });

  it('DSNSTK-002: are none for a bare brief, a library without drawings, a page at its cap or a full page', () => {
    const request = { count: 3, size: [0.14, 0.22] as const, sides: ['left', 'right'] as const, key: 'k' };
    expect(placeStickers(ctxOf(rich({ bare: true })), elements, request)).toEqual([]);
    expect(placeStickers(ctxOf(rich({ stickers: [] })), elements, request)).toEqual([]);
    const full = Array.from({ length: 90 }, (_, i) => words(`w${i}`, { x: 1, y: 1, w: 2, h: 2 }));
    expect(placeStickers(ctxOf(rich()), full, request)).toEqual([]);
    const wall = [words('all', { x: 0, y: 0, w: 420, h: 210 })];
    expect(placeStickers(ctxOf(rich()), wall, request)).toEqual([]);
  });

  it('DSNSTK-003: decorate a spread at the level asked, the same way for one key, not at all for a calm book', () => {
    const spread: BookSpread = { id: 'sp', role: 'inner', background: null, elements, parked: [], entryId: null };
    const c = ctxOf(rich());
    const count = stickersFor(c, 'deco:4');
    expect(count >= 3 && count <= 6).toBe(true);
    const decorated = decorateSpread(c, spread, 'deco:4');
    const added = decorated.elements.slice(elements.length);
    expect(added.length).toBeGreaterThan(0);
    expect(added.length).toBeLessThanOrEqual(count);
    expect(added.every((e) => e.kind === 'sticker')).toBe(true);
    expect(decorateSpread(ctxOf(CALM_ART), spread, 'deco:4')).toBe(spread);
    const light = ctxOf(rich({ decoration: 'light' }));
    expect([1, 2]).toContain(stickersFor(light, 'deco:4'));
  });

  it('DSNSTK-004: are turned as the book turns its prints: nearly straight in a calm book, further in a loud one', () => {
    const request = { count: 6, size: [0.14, 0.22] as const, sides: ['left', 'right'] as const, key: 'deco:2' };
    const calm = placeStickers(ctxOf(rich({ energy: 'calm', tilt: [0, 2] })), elements, request);
    expect(calm.length).toBeGreaterThan(0);
    expect(calm.every((k) => Math.abs(k.rotation) <= 2)).toBe(true);
    const loud = placeStickers(ctxOf(rich({ energy: 'loud', tilt: [4, 10] })), elements, request);
    expect(loud.length).toBeGreaterThan(0);
    expect(loud.every((k) => Math.abs(k.rotation) >= 4 && Math.abs(k.rotation) <= 10)).toBe(true);
  });
});

describe('the look of a lively book', () => {
  const nordic = parse({ style: 'nordic' });
  const look = designLook(nordic, page, []);
  const artOf = (raw: BookDesignDirectivesInput) => designArt(parse(raw), look.theme);

  it('DSNART-006: turns and frames the prints and sets the cover title larger; a calm book stays as it is', () => {
    expect(livelyLook(look, artOf({ brief: { energy: 'calm' } }), nordic)).toBe(look);
    expect(look).toMatchObject({ tilt: 0, frameStyle: 'none' });
    const livelyRaw = { style: 'nordic', brief: { energy: 'lively' } } as const;
    const lively = livelyLook(look, artOf(livelyRaw), parse(livelyRaw));
    expect(lively).toMatchObject({ tilt: 3, frameStyle: 'white' });
    expect(lively.sizes.display).toBeCloseTo(look.sizes.heading * 1.5, 0);
    expect(lively.sizes.body).toBe(look.sizes.body);
    const loudRaw = { style: 'nordic', brief: { energy: 'loud' } } as const;
    const loud = livelyLook(look, artOf(loudRaw), parse(loudRaw));
    expect(loud.tilt).toBe(4);
    expect(loud.sizes.display).toBeCloseTo(look.sizes.heading * 2, 0);
    // A display tier the directives name is theirs.
    const askedRaw = { style: 'nordic', brief: { energy: 'loud' }, type: { display: 3 } } as const;
    const asked = designLook(parse(askedRaw), page, []);
    expect(livelyLook(asked, artOf(askedRaw), parse(askedRaw)).sizes.display).toBe(asked.sizes.display);
  });
});
