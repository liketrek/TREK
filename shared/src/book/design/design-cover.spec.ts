import { BOOK_COVER_ARCHETYPES, type BookCoverArchetype } from '../book-archetypes';
import { bookSpreadSchema, type BookElement, type BookSpread } from '../book.schema';
import { pageFindings } from '../describe-spread';
import { BOOK_STICKERS } from '../stickers/sticker-catalogue';
import { designBook, type BookDesignInput, type BookDesignResult } from './design-book';
import type { BookDesignDirectivesInput } from './design-directives.schema';
import { turnedBox } from './design-stickers';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The seven composed covers (design-cover.ts) on the fixture journeys: each
 * a valid page, its words inside the page, nothing left for the repair to
 * flag, its archetype's signature there, the same for one seed and another
 * for another seed, and the cover of a design without an archetype exactly
 * the engine's own.
 */

type Name = 'rich' | 'sparse' | 'nostats';
const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const fixtures = JSON.parse(readFileSync(here('./design-book.fixtures.json'), 'utf8')) as Record<
  Name,
  { input: BookDesignInput }
>;

/** The journey with ids minted by a counter and the sticker library at hand. */
function input(name: Name, stickers = true): BookDesignInput {
  let n = 0;
  return { ...fixtures[name].input, newId: (p) => `${p}-${++n}`, ...(stickers ? { stickers: BOOK_STICKERS } : {}) };
}

function design(name: Name, directives: BookDesignDirectivesInput, stickers = true): BookDesignResult {
  return designBook(null, input(name, stickers), directives);
}

const coverOf = (r: BookDesignResult) => r.doc.spreads[0] as BookSpread;
const archetype = (a: BookCoverArchetype, more: BookDesignDirectivesInput = {}): BookDesignDirectivesInput => ({
  style: 'poster-pop',
  brief: { energy: 'lively' },
  ...more,
  cover: { ...more.cover, archetype: a },
});

const kinds = (s: BookSpread, kind: BookElement['kind']) => s.elements.filter((e) => e.kind === kind);
const shapes = (s: BookSpread) => s.elements.flatMap((e) => (e.kind === 'shape' ? [e] : []));
const photos = (s: BookSpread) => s.elements.flatMap((e) => (e.kind === 'photo' ? [e] : []));
const texts = (s: BookSpread) => s.elements.flatMap((e) => (e.kind === 'text' ? [e] : []));

/** What makes each archetype that archetype, read off its cover. */
const SIGNATURE: Record<BookCoverArchetype, (s: BookSpread, W: number, H: number) => boolean> = {
  'spine-band': (s, W, H) =>
    shapes(s).some((e) => e.frame.h >= H && e.frame.w >= W * 0.14 && e.frame.w <= W * 0.18 + 4) &&
    texts(s).some((t) => Math.abs(t.rotation) === 90 && t.binding?.source === 'journey.title'),
  'poster-pop': (s, W) =>
    shapes(s).some((e) => e.shape === 'sunburst-24') &&
    shapes(s).some((e) => e.shape === 'rect' && e.frame.w >= W) &&
    photos(s).some((p) => Math.abs(p.rotation) >= 3 && Math.abs(p.rotation) <= 6 && !!p.border),
  cutout: (s) =>
    shapes(s).filter((e) => /^(leaf|coral|seaweed|organic|star-organic|sun-cutout)/.test(e.shape)).length >= 2 &&
    photos(s).some((p) => (p.border?.width ?? 0) >= 4),
  postcard: (s) =>
    (kinds(s, 'sticker').length > 0 || photos(s).some((p) => p.mask === 'arch-tall')) &&
    shapes(s).some((e) => e.shape === 'wave'),
  'grid-badge': (s, W) =>
    photos(s).filter((p) => p.frame.w >= W * 0.4 && p.rotation === 0).length >= 3 &&
    shapes(s).some((e) => e.shape === 'ellipse' && e.fill !== null && Math.abs(e.frame.x + e.frame.w / 2 - W / 2) < 1),
  'minimal-serif': (s) =>
    photos(s).some((p) => !!p.border && p.border.width <= 0.5) && shapes(s).some((e) => e.shape === 'sun'),
  'stamp-collage': (s) =>
    shapes(s).some((e) => e.paint?.type === 'pattern' && e.paint.pattern === 'checker') &&
    photos(s).some((p) => p.mask === 'arch-tall') &&
    photos(s).some((p) => p.edge === 'perforated') &&
    shapes(s).some((e) => e.shape === 'ellipse' && e.fill === null),
};

/** Every word on a cover lies on the page, turned with its frame; every other element at least touches it. */
function onPage(s: BookSpread, W: number, H: number): string[] {
  return s.elements.flatMap((e) => {
    const b = turnedBox(e.frame, e.rotation);
    const touches = b.x < W && b.y < H && b.x + b.w > 0 && b.y + b.h > 0;
    const within = b.x >= 0 && b.y >= 0 && b.x + b.w <= W && b.y + b.h <= H;
    return (e.kind === 'text' ? within : touches) ? [] : [e.id];
  });
}

describe('the composed covers', () => {
  for (const a of BOOK_COVER_ARCHETYPES) {
    it(`DSNCOV-001: composes ${a} as a valid cover with its signature, its words on the page and no fault left`, () => {
      for (const name of ['rich', 'sparse', 'nostats'] as const) {
        const r = design(name, archetype(a));
        const cover = coverOf(r);
        const { pageWidth: W, pageHeight: H } = r.doc.page;
        expect(cover.role).toBe('cover');
        expect(bookSpreadSchema.safeParse(cover).success).toBe(true);
        expect({ name, off: onPage(cover, W, H) }).toEqual({ name, off: [] });
        const faults = pageFindings(cover, r.doc.page, input(name).photos).filter((f) => f.severity !== 'info');
        expect({ name, faults }).toEqual({ name, faults: [] });
        expect({ name, signature: SIGNATURE[a](cover, W, H) }).toEqual({ name, signature: true });
        // A journey of four photos or more fills the whole grid.
        if (a === 'grid-badge' && name !== 'sparse')
          expect(photos(cover).filter((p) => p.rotation === 0)).toHaveLength(4);
      }
    });

    it(`DSNCOV-002: composes ${a} the same way for one seed and another way for another`, () => {
      const once = coverOf(design('rich', archetype(a, { seed: 3 })));
      const again = coverOf(design('rich', archetype(a, { seed: 3 })));
      const other = coverOf(design('rich', archetype(a, { seed: 4 })));
      expect(JSON.stringify(again)).toBe(JSON.stringify(once));
      expect(JSON.stringify(other.elements)).not.toBe(JSON.stringify(once.elements));
    });
  }

  it('DSNCOV-003: keeps to every page format, and to a library without stickers', () => {
    for (const preset of ['a5-landscape', 'a4-portrait', 'square-300'] as const) {
      for (const a of BOOK_COVER_ARCHETYPES) {
        const r = design('rich', archetype(a, { preset }), false);
        const cover = coverOf(r);
        const faults = pageFindings(cover, r.doc.page, input('rich').photos).filter((f) => f.severity !== 'info');
        expect({ preset, a, faults }).toEqual({ preset, a, faults: [] });
        expect(kinds(cover, 'sticker')).toEqual([]);
      }
    }
  });

  it('DSNCOV-004: a cover without an archetype is the engine own, brief or none', () => {
    const plain = coverOf(design('rich', { style: 'poster-pop' }));
    const briefed = coverOf(design('rich', { style: 'poster-pop', brief: { energy: 'calm' } }));
    expect(JSON.stringify(briefed)).toBe(JSON.stringify(plain));
    expect(plain.elements.map((e) => e.kind)).toEqual(['photo', 'shape', 'text', 'text']);
  });

  it('DSNCOV-005: binds the title to the journey, and sets the title in the theme display face', () => {
    for (const a of BOOK_COVER_ARCHETYPES) {
      const cover = coverOf(design('rich', archetype(a, { style: 'cutout' })));
      const title = texts(cover).find((t) => t.binding?.source === 'journey.title');
      expect({ a, title: title?.text }).toEqual({ a, title: 'Atlantic coast' });
      expect({ a, font: title?.font }).toEqual({ a, font: 'shoulders' });
    }
    const own = coverOf(design('rich', archetype('poster-pop', { cover: { title: 'Our coast' } })));
    expect(texts(own).some((t) => t.text === 'Our coast' && t.binding === null)).toBe(true);
  });

  it('DSNCOV-006: a poster takes three to six stickers of the theme, none with decoration none', () => {
    const tropical = coverOf(design('rich', archetype('poster-pop', { style: 'tropical' })));
    const stickers = kinds(tropical, 'sticker');
    expect(stickers.length).toBeGreaterThanOrEqual(3);
    expect(stickers.length).toBeLessThanOrEqual(6);
    const motif = new Set(BOOK_STICKERS.filter((s) => s.theme === 'tropical').map((s) => s.id));
    expect(stickers.every((s) => s.kind === 'sticker' && motif.has(s.stickerId))).toBe(true);
    const bare = coverOf(design('rich', archetype('poster-pop', { style: 'tropical', brief: { decoration: 'none' } })));
    expect(kinds(bare, 'sticker')).toEqual([]);
  });

  it('DSNCOV-007: a postcard draws the landmark of a city the journey stopped in, never another place', () => {
    const lisbon = coverOf(design('rich', archetype('postcard')));
    expect(kinds(lisbon, 'sticker')).toEqual([]);
    expect(photos(lisbon).some((p) => p.mask === 'arch-tall')).toBe(true);
    const journey = input('rich');
    const paris = { ...journey, entries: journey.entries.map((e, i) => (i === 3 ? { ...e, location: 'Paris' } : e)) };
    const cover = coverOf(designBook(null, paris, archetype('postcard')));
    const drawn = kinds(cover, 'sticker').map((s) => (s.kind === 'sticker' ? s.stickerId : ''));
    expect(['eiffelTower', 'arcDeTriomphe']).toContain(drawn[0]);
  });

  it('DSNCOV-008: sets the title as the lockup asked for, and falls back when that lockup has no place for one', () => {
    const r = design('rich', archetype('grid-badge', { cover: { lockup: 'retro-shadow' } }));
    const cover = coverOf(r);
    expect(shapes(cover).some((e) => e.shape === 'ellipse')).toBe(false);
    const title = texts(cover).find((t) => t.binding?.source === 'journey.title');
    expect(title?.outline).toBeTruthy();
    expect(new Set(texts(cover).map((t) => t.group)).size).toBe(1);

    const quote = design('rich', archetype('grid-badge', { cover: { lockup: 'quote-classic' } }));
    expect(shapes(coverOf(quote)).some((e) => e.shape === 'ellipse')).toBe(true);
    expect(quote.notes.some((n) => n.includes('quote-classic has no place for the cover'))).toBe(true);
  });

  it('DSNCOV-009: a lockup without an archetype is set on the engine own cover, over its scrim', () => {
    const cover = coverOf(design('rich', { style: 'riviera', cover: { lockup: 'spaced-date' } }));
    const [photo, scrim] = cover.elements;
    expect(photo?.kind).toBe('photo');
    expect(scrim?.kind === 'shape' && scrim.gradient).toBe('up');
    const title = texts(cover).find((t) => t.binding?.source === 'journey.title');
    expect(title?.group).toBeTruthy();
    const faults = pageFindings(cover, design('rich', {}).doc.page, input('rich').photos);
    expect(faults.filter((f) => f.severity !== 'info')).toEqual([]);
  });

  it('DSNCOV-010: says that an archetype takes the place of a cover layout asked beside it', () => {
    const r = design('rich', archetype('minimal-serif', { cover: { template: 'cover-band' } }));
    expect(r.notes).toContain('the minimal-serif cover is composed for its archetype, so cover.template is left out');
  });

  it('DSNCOV-012: keeps the turned prints of an archetype to what a calm brief takes, and is not judged for them', () => {
    for (const a of ['poster-pop', 'postcard', 'stamp-collage', 'cutout'] as const) {
      const r = design('rich', { brief: { energy: 'calm', theme: 'nordic' }, cover: { archetype: a } });
      const turns = photos(coverOf(r)).map((p) => Math.abs(p.rotation));
      expect({ a, steep: turns.filter((t) => t > 2) }).toEqual({ a, steep: [] });
      expect(r.findings.filter((f) => f.code === 'energy_mismatch')).toEqual([]);
    }
    // A lively brief keeps the poster's turn of three to six degrees.
    const lively = photos(coverOf(design('rich', archetype('poster-pop')))).map((p) => Math.abs(p.rotation));
    expect(lively.some((t) => t >= 3 && t <= 6)).toBe(true);
  });

  it('DSNCOV-013: sets a minimal serif title large in the display face, and keeps its sun under a plain lockup', () => {
    const r = design('rich', archetype('minimal-serif', { style: 'minimal-serif' }));
    const title = texts(coverOf(r)).find((t) => t.binding?.source === 'journey.title');
    expect(title?.font).toBe('cormorant');
    expect(title?.size).toBeGreaterThanOrEqual(60);
    for (const lockup of ['poster-stack', 'minimal-caps', 'retro-shadow'] as const) {
      const cover = coverOf(design('rich', archetype('minimal-serif', { cover: { lockup } })));
      expect({ lockup, sun: shapes(cover).some((e) => e.shape === 'sun') }).toEqual({ lockup, sun: true });
      const flat = pageFindings(cover, r.doc.page, input('rich').photos).filter((f) => f.code === 'flat_cover');
      expect({ lockup, flat }).toEqual({ lockup, flat: [] });
    }
    // A landscape page gives the title more of its height.
    const wide = design('rich', archetype('minimal-serif', { style: 'minimal-serif', preset: 'a5-landscape' }));
    const set = texts(coverOf(wide)).find((t) => t.binding?.source === 'journey.title');
    expect(set?.size).toBeGreaterThanOrEqual(48);
  });

  it('DSNCOV-014: holds a composed title to the display tier asked, and says what a cover leaves out', () => {
    const asked = design('rich', archetype('poster-pop', { type: { display: 1.2 } }));
    const capped = texts(coverOf(asked)).find((t) => t.binding?.source === 'journey.title');
    expect(capped?.size).toBeLessThanOrEqual(33.6);
    const free = texts(coverOf(design('rich', archetype('poster-pop')))).find(
      (t) => t.binding?.source === 'journey.title',
    );
    expect(free?.size).toBeGreaterThan(capped?.size ?? 0);
    const badge = design('rich', archetype('grid-badge', { type: { display: 5 } }));
    expect(badge.notes.some((n) => n.startsWith('the grid-badge cover sets its title as large as its box holds'))).toBe(
      true,
    );
    const lockup = design('rich', { style: 'riviera', cover: { lockup: 'poster-stack', template: 'cover-band' } });
    expect(lockup.notes).toContain(
      'the cover sets its title as the lockup poster-stack, so cover.template is left out',
    );
  });

  it('DSNCOV-015: sets the script line of a lockup in the heading face of a theme without a script', () => {
    const r = design('rich', archetype('postcard', { style: 'minimal-serif' }));
    const cover = coverOf(r);
    const faces = new Set(texts(cover).map((t) => t.font));
    expect(faces.has('vibes')).toBe(false);
    expect(pageFindings(cover, r.doc.page, input('rich').photos, r.doc.theme).map((f) => f.code)).not.toContain(
      'off_theme',
    );
  });

  it('DSNCOV-011: takes a lockup on every archetype, and composes every archetype for a journey without photos', () => {
    const journey = input('rich');
    const bare: BookDesignInput = {
      ...journey,
      entries: journey.entries.map((e) => ({ ...e, photos: [] })),
      candidates: [],
      photos: [],
      gallery: [],
      coverPhotoId: null,
    };
    for (const a of BOOK_COVER_ARCHETYPES) {
      const r = design('rich', archetype(a, { style: 'riviera', cover: { lockup: 'retro-shadow' } }));
      const cover = coverOf(r);
      const title = texts(cover).find((t) => t.binding?.source === 'journey.title');
      expect({ a, grouped: !!title?.group }).toEqual({ a, grouped: true });
      const faults = pageFindings(cover, r.doc.page, journey.photos).filter((f) => f.severity !== 'info');
      expect({ a, faults }).toEqual({ a, faults: [] });

      const without = designBook(null, bare, archetype(a, { style: 'riviera' }));
      const plain = coverOf(without);
      const { pageWidth: W, pageHeight: H } = without.doc.page;
      expect(photos(plain)).toEqual([]);
      expect(bookSpreadSchema.safeParse(plain).success).toBe(true);
      expect({ a, off: onPage(plain, W, H) }).toEqual({ a, off: [] });
      expect(texts(plain).some((t) => t.binding?.source === 'journey.title')).toBe(true);
      const left = pageFindings(plain, without.doc.page, []).filter((f) => f.severity !== 'info');
      expect({ a, left }).toEqual({ a, left: [] });
    }
  });
});
