import { contrastRatio, requiredContrast } from '../book-colour';
import { designFindings } from '../book-findings-design';
import { applyBookTemplate, findBookTemplate } from '../book-layouts';
import { bookPageSetupForPreset } from '../book-pages';
import { fitSpreadTexts } from '../book-text-fit';
import {
  bookBadgeElementSchema,
  bookLineElementSchema,
  bookMapElementSchema,
  bookPhotoElementSchema,
  bookShapeElementSchema,
  bookSpreadSchema,
  bookStickerElementSchema,
  bookTextElementSchema,
  type BookElement,
  type BookPageSetup,
  type BookSpread,
  type BookTextElement,
} from '../book.schema';
import { bookThemeOf } from '../theme/book-theme';
import type { BookTheme } from '../theme/book-theme.schema';
import { applyDecoratedTemplate } from './template-apply';
import { BOOK_DECORATED_TEMPLATES, findDecoratedTemplate } from './template-catalogue';
import type { BookDecoratedTemplate, BookTemplateElement } from './template-format';
import { bookTemplateWords } from './template-words';

import { describe, expect, it } from 'vitest';

// TPLAPPLY-001 to TPLAPPLY-021

/**
 * Laying a page out on a decorated template: the page's photos poured into
 * the photo roles in order, its words into the word roles and the book's
 * words into the roles it has none for, the colours and faces taken from the
 * book's theme, every measure scaled to the book's page, and what has no room
 * parked with the page.
 */

const square = bookPageSetupForPreset('square-210');
const landscape = bookPageSetupForPreset('a4-landscape');
const big = bookPageSetupForPreset('square-300');

let seq = 0;
const newId = (p: string) => `${p}-${++seq}`;

const tpl = (id: string) => {
  const found = findDecoratedTemplate(id);
  if (!found) throw new Error(`no template ${id}`);
  return found;
};

const photo = (id: string, photoId: number, over: Partial<BookElement> = {}) =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame: { x: 10, y: 10, w: 40, h: 30 }, photoId, ...over });
const text = (id: string, words: string, over: Partial<BookTextElement> = {}) =>
  bookTextElementSchema.parse({ id, kind: 'text', frame: { x: 10, y: 60, w: 120, h: 30 }, text: words, ...over });

function page(role: BookSpread['role'], elements: BookElement[], over: Partial<BookSpread> = {}): BookSpread {
  return bookSpreadSchema.parse({ id: 'sp', role, elements, ...over });
}

const lay = (
  spread: BookSpread,
  id: string | BookDecoratedTemplate,
  setup: BookPageSetup = square,
  opts: Parameters<typeof applyDecoratedTemplate>[3] = {},
) => applyDecoratedTemplate(spread, typeof id === 'string' ? tpl(id) : id, setup, { newId, locale: 'en', ...opts });

const photosOf = (spread: BookSpread) => spread.elements.filter((e) => e.kind === 'photo');
const textOf = (spread: BookSpread, words: string) =>
  spread.elements.find((e): e is BookTextElement => e.kind === 'text' && e.text === words);

/** A small template drawn for the specs, in fractions as the format keeps them. */
function synthetic(): BookDecoratedTemplate {
  const base = { frame: { x: 0, y: 0, w: 1, h: 1 } };
  const els: BookTemplateElement[] = [
    {
      ...bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', ...base }),
      frame: { x: -0.0143, y: -0.0143, w: 0.5143, h: 1.0286 },
      border: { width: 3 / 210, color: '#ffffff' },
      role: 'photo:1',
      tint: { border: 'accent' },
    },
    {
      ...bookShapeElementSchema.parse({ id: 's2', kind: 'shape', shape: 'ellipse', ...base }),
      frame: { x: 0.6, y: 0.1, w: 0.2, h: 0.2 },
      fill: '#123456',
      token: 'accent',
      group: 'g1',
      keep: true,
    },
    {
      ...bookTextElementSchema.parse({ id: 't3', kind: 'text', ...base }),
      frame: { x: 0.6, y: 0.1, w: 0.2, h: 0.2 },
      size: 24 / 210,
      fit: 'shrink',
      fitMax: 24 / 210,
      color: '#222222',
      token: 'ink',
      fontRole: 'display',
      group: 'g1',
      role: 'title',
    },
    {
      ...bookStickerElementSchema.parse({ id: 'k4', kind: 'sticker', stickerId: 'lemon', ...base }),
      frame: { x: 0.6, y: 0.6, w: 0.2, h: 0.16 },
      colors: ['#111111', '#222222'],
      tint: { colors: ['accent', null] },
    },
    {
      ...bookLineElementSchema.parse({ id: 'l5', kind: 'line', ...base }),
      frame: { x: 0.55, y: 0.9, w: 0.4, h: 0.01 },
      strokeWidth: 0.6 / 210,
      tint: { stroke: 'accent2' },
    },
  ];
  return {
    id: 'test-synthetic',
    labelKey: 'studio.templates.name.testSynthetic',
    kind: 'single',
    archetype: 'postcard',
    tags: ['test'],
    descr: 'A small template drawn for the specs.',
    background: '#fafafa',
    backgroundToken: 'paper',
    elements: els,
  };
}

const fail = (what: string): never => {
  throw new Error(`${what} is missing`);
};

/** A theme with one colour changed, for a case the built-in themes do not reach. */
function themed(id: Parameters<typeof bookThemeOf>[0], palette: Partial<BookTheme['palette']>): BookTheme {
  const theme = bookThemeOf(id);
  return { ...theme, palette: { ...theme.palette, ...palette } };
}

describe('pouring a page into a template', () => {
  it('TPLAPPLY-001: puts the page photos into the photo roles in order, keeps their focal points and parks the rest', () => {
    const spread = page(
      'cover',
      [1, 2, 3, 4, 5, 6].map((n) => photo(`ph${n}`, 10 + n, n === 1 ? { focalX: 0.2 } : {})),
    );
    const out = lay(spread, 'grid-badge-circle');
    expect(photosOf(out).map((p) => (p.kind === 'photo' ? p.photoId : null))).toEqual([11, 12, 13, 14]);
    expect(photosOf(out)[0]).toMatchObject({ focalX: 0.2 });
    expect(out.parked.map((p) => (p.kind === 'photo' ? p.photoId : null))).toEqual([15, 16]);
    const few = lay(page('cover', [photo('ph1', 11)]), 'grid-badge-circle');
    expect(photosOf(few).map((p) => (p.kind === 'photo' ? p.photoId : null))).toEqual([11, null, null, null]);
  });

  it('TPLAPPLY-002: sets the page words in the roles they read as, keeping their binding, and parks what has no role', () => {
    const story = 'We walked the length of the coast road and back again, stopping at every bay. '.repeat(3);
    const spread = page('cover', [
      text('t1', 'Portugal', { size: 30, binding: { source: 'journey.title' } }),
      text('t2', '2026'),
      text('t3', story),
    ]);
    const out = lay(spread, 'postcard-houses');
    expect(textOf(out, 'Portugal')?.binding).toEqual({ source: 'journey.title' });
    expect(textOf(out, '2026')).toBeDefined();
    expect(out.parked.map((e) => (e.kind === 'text' ? e.text : e.kind))).toEqual([story]);
    // The words took the template's look, not their own.
    expect(textOf(out, 'Portugal')?.font).toBe('dmserif');
  });

  it('TPLAPPLY-003: fills empty roles with the words given and leaves out a role that has none', () => {
    const out = lay(page('cover', []), 'minimal-serif-classic', square, {
      words: { title: { text: 'Iceland' }, date: { text: '2025' } },
    });
    const texts = out.elements.filter((e): e is BookTextElement => e.kind === 'text').map((e) => e.text);
    expect(texts).toEqual(['Iceland', '2025']);
    expect(out.elements.some((e) => e.kind === 'text' && !e.text)).toBe(false);
  });

  it('TPLAPPLY-004: takes a page made from an entry its words, bound to the entry, and its date as a mark', () => {
    const spread = page('inner', [photo('ph1', 21)], { entryId: 7 });
    const words = bookTemplateWords(spread, {
      bookTitle: 'Portugal',
      locale: 'en',
      entries: [
        { id: 7, title: 'Sintra', location: 'Serra de Sintra', date: '2026-05-14', story: 'Up through the fog.' },
      ],
    });
    const out = lay(spread, 'day-opener', square, { words });
    expect(textOf(out, 'Sintra')?.binding).toEqual({ source: 'entry.title', entryId: 7 });
    expect(textOf(out, 'Up through the fog.')?.binding).toEqual({ source: 'entry.story', entryId: 7 });
    expect(out.elements.find((e) => e.kind === 'badge')).toMatchObject({ variant: 'date', text: '14', sub: 'MAY' });
  });

  it('TPLAPPLY-005: fills the letters of a word-art title with the photo its role names, and colours them without one', () => {
    const withPhoto = lay(page('inner', [photo('ph1', 31, { focalX: 0.3 })]), 'hero-trio-wordart', square, {
      words: { title: { text: 'Sintra' } },
    });
    expect(textOf(withPhoto, 'Sintra')?.fillPaint).toEqual({
      type: 'photo',
      photoId: 31,
      focalX: 0.3,
      focalY: 0.5,
      zoom: 1,
    });
    const without = lay(page('inner', []), 'hero-trio-wordart', square, { words: { title: { text: 'Sintra' } } });
    expect(textOf(without, 'Sintra')?.fillPaint).toBeNull();
  });

  it('TPLAPPLY-006: keeps locked elements where they were and drops the old design', () => {
    const lockedShape = bookShapeElementSchema.parse({
      id: 'keep-me',
      kind: 'shape',
      frame: { x: 1, y: 1, w: 5, h: 5 },
      locked: true,
    });
    const old = bookShapeElementSchema.parse({ id: 'old', kind: 'shape', frame: { x: 9, y: 9, w: 5, h: 5 } });
    const out = lay(page('cover', [lockedShape, old, photo('ph1', 41)]), 'minimal-serif-window');
    expect(out.elements[0]).toEqual(lockedShape);
    expect(out.elements.some((e) => e.id === 'old')).toBe(false);
  });

  it('TPLAPPLY-007: pours the page map into the map role in the template look, or a photo when there is no map', () => {
    const own = bookMapElementSchema.parse({
      id: 'map',
      kind: 'map',
      frame: { x: 0, y: 0, w: 50, h: 50 },
      countries: ['PT'],
      points: [{ lat: 38.7, lng: -9.1, label: 'Lisbon' }],
      style: 'dark',
    });
    const out = lay(page('inner', [own, photo('ph1', 51)]), 'map-tickets');
    const map = out.elements.find((e) => e.kind === 'map');
    expect(map).toMatchObject({ countries: ['PT'], style: 'minimal' });
    expect(map?.kind === 'map' && map.points[0]?.label).toBe('Lisbon');
    const mapless = lay(
      page(
        'inner',
        [1, 2, 3].map((n) => photo(`ph${n}`, 60 + n)),
      ),
      'map-tickets',
    );
    expect(mapless.elements.some((e) => e.kind === 'map')).toBe(false);
    expect(photosOf(mapless).map((p) => (p.kind === 'photo' ? p.photoId : null))).toEqual([63, 61, 62]);
  });
});

describe('the theme of the book', () => {
  it('TPLAPPLY-008: sets the linked colours and faces in the theme, and tints what the document links nowhere', () => {
    const nordic = bookThemeOf('nordic');
    const out = lay(page('cover', [photo('ph1', 71)]), 'postcard-houses', square, {
      theme: nordic,
      words: { title: { text: 'Bergen' } },
    });
    expect(textOf(out, 'Bergen')).toMatchObject({ color: nordic.palette.ink, font: 'bricolage', weight: 700 });
    expect(out.background).toBe(nordic.palette.paper);
    const houses = out.elements.find((e) => e.kind === 'sticker' && e.stickerId === 'rowHouses');
    const { accent, accent2, accent3, ink } = nordic.palette;
    expect(houses?.kind === 'sticker' && houses.colors).toEqual([accent3, accent, ink, accent2]);
  });

  it('TPLAPPLY-009: keeps the drawn colours and the links without a theme, so a theme set later recolours the page', () => {
    const out = lay(page('cover', []), 'postcard-houses', square, { words: { title: { text: 'Bergen' } } });
    expect(textOf(out, 'Bergen')).toMatchObject({ color: '#1f2d4d', token: 'ink', fontRole: 'display' });
    expect(out.backgroundToken).toBe('paper');
  });

  it('TPLAPPLY-010: takes a pattern and a shadow from the theme, and sets words on a colour in ink or paper so they read', () => {
    const nordic = bookThemeOf('nordic');
    const row = lay(page('cover', [photo('ph1', 81)]), 'stamp-collage-row', square, { theme: nordic });
    const band = row.elements.find((e) => e.kind === 'shape' && e.paint?.type === 'pattern');
    expect(band?.kind === 'shape' && band.paint).toMatchObject({
      fg: nordic.palette.accent3,
      bg: nordic.palette.paper,
    });
    const stamp = photosOf(row)[0];
    expect(stamp?.kind === 'photo' && stamp.shadow?.color).toBe(nordic.palette.ink);

    const pale = themed('minimal-serif', { accent: '#f4f4f4' });
    const band2 = lay(page('cover', []), 'spine-band-stitched', square, {
      theme: pale,
      words: { title: { text: 'Oslo' } },
    });
    expect(textOf(band2, 'Oslo')).toMatchObject({ token: 'ink', color: pale.palette.ink });
  });
});

describe('scaling to the book', () => {
  it('TPLAPPLY-011: lays the fractions on an A4 landscape page, bleeds on its bleed and keeps a circle round', () => {
    const out = lay(page('cover', []), synthetic(), landscape, { words: { title: { text: 'Ice' } } });
    const [picture, circle] = out.elements;
    expect(picture?.frame).toEqual({ x: -3, y: -3, w: 151.5, h: 216 });
    expect(circle?.frame.w).toBe(circle?.frame.h);
    expect(circle?.frame).toEqual({ x: 186.9, y: 21, w: 42, h: 42 });
    expect(out.elements.find((e) => e.kind === 'line')).toMatchObject({ strokeWidth: 0.6 });
  });

  it('TPLAPPLY-012: scales every length with the shorter side of a larger page', () => {
    const out = lay(page('cover', []), synthetic(), big, { words: { title: { text: 'Ice' } } });
    const title = textOf(out, 'Ice');
    expect(title?.size).toBeCloseTo(24 * (300 / 210), 1);
    expect(photosOf(out)[0]?.frame).toEqual({ x: -3, y: -3, w: 153, h: 306 });
    expect(out.elements.find((e) => e.kind === 'shape')?.frame).toEqual({ x: 180, y: 30, w: 60, h: 60 });
  });

  it('TPLAPPLY-013: gives the template groups ids of the page and tints a sticker and a border from the theme', () => {
    const theme = bookThemeOf('riviera');
    const out = lay(page('cover', [photo('ph1', 91)]), synthetic(), square, {
      theme,
      words: { title: { text: 'Nice' } },
    });
    const grouped = out.elements.filter((e) => e.group);
    expect(grouped.map((e) => e.kind)).toEqual(['shape', 'text']);
    expect(new Set(grouped.map((e) => e.group)).size).toBe(1);
    expect(grouped[0]?.group).not.toBe('g1');
    const lemon = out.elements.find((e) => e.kind === 'sticker');
    expect(lemon?.kind === 'sticker' && lemon.colors).toEqual([theme.palette.accent, '#222222']);
    expect(photosOf(out)[0]).toMatchObject({ border: { width: 3, color: theme.palette.accent } });
    expect(out.elements.find((e) => e.kind === 'line')).toMatchObject({ stroke: theme.palette.accent2 });
  });

  it('TPLAPPLY-014: fits a long title below the size it was drawn at, which stays its ceiling, and keeps small type readable', () => {
    const out = lay(page('cover', []), 'cutout-matisse', square, {
      words: { title: { text: 'Portugal and the whole of the Algarve' } },
    });
    const title = textOf(out, 'Portugal and the whole of the Algarve');
    expect(title?.size).toBeLessThan(140);
    expect(title?.fitMax).toBeCloseTo(140, 1);
    // Shortened later, the title grows back to the size the template drew it at.
    const shorter = {
      ...out,
      elements: out.elements.map((e) => (e.id === title?.id && e.kind === 'text' ? { ...e, text: 'Oslo' } : e)),
    };
    expect(textOf(fitSpreadTexts(shorter, out), 'Oslo')?.size).toBeCloseTo(140, 1);
    const small = lay(page('inner', []), 'filmstrip-script', bookPageSetupForPreset('a5-landscape'), {
      words: { caption: { text: 'The ferry out' } },
    });
    expect(textOf(small, 'The ferry out')?.size).toBeGreaterThanOrEqual(6);
  });

  it('TPLAPPLY-015: keeps a picture across the fold off it, unless its own focal point already is', () => {
    const centred = lay(page('inner', [photo('ph1', 95)]), 'bleed-band-caption');
    expect(photosOf(centred)[0]).toMatchObject({ focalX: 0.7 });
    const aside = lay(page('inner', [photo('ph1', 95, { focalX: 0.9 })]), 'bleed-band-caption');
    expect(photosOf(aside)[0]).toMatchObject({ focalX: 0.9 });
  });

  it('TPLAPPLY-017: keeps a lockup of the template as one group of the page, and a badge with its words on any shape of page', () => {
    const out = lay(page('cover', []), 'minimal-serif-classic', square, {
      words: { title: { text: 'Iceland' }, subtitle: { text: 'Ring road' }, date: { text: '2025' } },
    });
    const grouped = out.elements.filter((e) => e.group);
    expect(grouped.map((e) => (e.kind === 'text' ? e.text : e.kind))).toEqual(['Iceland', 'Ring road', 'line', '2025']);
    expect(new Set(grouped.map((e) => e.group)).size).toBe(1);
    const alone = lay(page('cover', []), 'minimal-serif-classic', square, { words: { title: { text: 'Iceland' } } });
    expect(alone.elements.filter((e) => e.group).map((e) => e.kind)).toEqual(['text', 'line']);

    const wide = lay(page('cover', []), 'grid-badge-circle', landscape, { words: { title: { text: 'Iceland' } } });
    const ring = wide.elements.find((e) => e.kind === 'shape' && e.shape === 'ellipse');
    const words = wide.elements.find((e) => e.kind === 'text');
    expect(ring?.group).toBeDefined();
    expect(words?.group).toBe(ring?.group);
    if (!ring || !words) throw new Error('the badge is missing');
    expect(words.frame.x).toBeGreaterThanOrEqual(ring.frame.x);
    expect(words.frame.x + words.frame.w).toBeLessThanOrEqual(ring.frame.x + ring.frame.w);
  });

  it('TPLAPPLY-018: sets the page date line in a date mark only when the mark is made of it, and parks it otherwise', () => {
    const spread = (els: BookElement[]) =>
      page('inner', [text('t0', 'Sintra', { size: 30, binding: { source: 'entry.title', entryId: 7 } }), ...els], {
        entryId: 7,
      });
    const words = {
      date: { text: '14 May 2026', binding: { source: 'entry.date' as const, entryId: 7, value: '2026-05-14' } },
    };
    const plain = lay(spread([text('t1', 'Summer 2025')]), 'day-opener', square, { words });
    expect(plain.elements.find((e) => e.kind === 'badge')).toMatchObject({ text: '14', sub: 'MAY' });
    expect(plain.parked.map((e) => (e.kind === 'text' ? e.text : e.kind))).toEqual(['Summer 2025']);

    const bound = text('t2', '3 June 2026', { binding: { source: 'entry.date', entryId: 7, value: '2026-06-03' } });
    const marked = lay(spread([bound]), 'day-opener', square, { words });
    expect(marked.elements.find((e) => e.kind === 'badge')).toMatchObject({ text: '3', sub: 'JUNE' });
    expect(marked.parked).toEqual([]);

    const own = bookBadgeElementSchema.parse({
      id: 'b1',
      kind: 'badge',
      variant: 'date',
      frame: { x: 0, y: 0, w: 20, h: 20 },
      text: '9',
      sub: 'JULY',
    });
    const kept = lay(spread([own, bound]), 'day-opener', square, { words });
    expect(kept.elements.find((e) => e.kind === 'badge')).toMatchObject({ text: '9', sub: 'JULY' });
    expect(kept.parked.map((e) => (e.kind === 'text' ? e.text : e.kind))).toEqual(['3 June 2026']);
  });

  it('TPLAPPLY-019: takes a quotation mark set as text for design, never for the words of the next layout', () => {
    const words = { title: { text: 'Sintra' }, body: { text: 'Up through the fog to the palace.' } };
    const quoted = lay(page('inner', [photo('ph1', 5)]), 'story-quote', square, { words });
    expect(textOf(quoted, '\u201c')).toBeDefined();
    const next = lay(quoted, 'hero-script-word', square, { words: {} });
    expect(next.elements.some((e) => e.kind === 'text' && e.text === '\u201c')).toBe(false);
    expect(next.parked.some((e) => e.kind === 'text' && e.text === '\u201c')).toBe(false);
    expect(textOf(next, 'Sintra')).toBeDefined();

    const builtIn = applyBookTemplate(quoted, findBookTemplate('hero-story') ?? fail('hero-story'), square);
    const heading = builtIn.elements.find((e): e is BookTextElement => e.kind === 'text' && e.size === 22);
    expect(heading?.text).toBe('Sintra');
    expect(builtIn.elements.some((e) => e.kind === 'text' && e.text === '\u201c')).toBe(false);
  });

  it('TPLAPPLY-020: sets the words on a colour so they read in the theme at the size they were fitted to', () => {
    const small = bookPageSetupForPreset('a5-landscape');
    const all = {
      title: { text: 'Portugal' },
      subtitle: { text: 'Lisbon to the Algarve' },
      date: { text: '2026' },
    };
    for (const [id, theme] of [
      ['grid-badge-seal', 'minimal-serif'],
      ['grid-badge-seal', 'scrapbook-script'],
      ['poster-pop-sunburst', 'riviera'],
      ['poster-pop-stack', 'nordic'],
    ] as const) {
      const out = lay(page('cover', [photo('ph1', 3)]), id, small, { theme: bookThemeOf(theme), words: all });
      const low = designFindings(out, small).filter((f) => f.code === 'contrast_low');
      expect(low, `${id} in ${theme}`).toEqual([]);
    }
    // Where neither ink nor paper reads on the colour, the words go on a band of the other.
    const sunflower = themed('poster-pop', { accent2: '#7a7a7a' });
    const out = lay(page('cover', [photo('ph1', 3)]), 'poster-pop-sunburst', small, { theme: sunflower, words: all });
    const subtitle = textOf(out, 'Lisbon to the Algarve');
    expect(subtitle?.highlight).toBeTruthy();
    if (!subtitle?.highlight) throw new Error('no band');
    expect(contrastRatio(subtitle.color, subtitle.highlight.color)).toBeGreaterThanOrEqual(
      requiredContrast(subtitle.size),
    );
  });

  it('TPLAPPLY-021: keeps the name of a locked group when the page is laid out again', () => {
    const lockedShape = (id: string) =>
      bookShapeElementSchema.parse({
        id,
        kind: 'shape',
        frame: { x: 1, y: 1, w: 5, h: 5 },
        locked: true,
        group: 'g-keep',
      });
    const spread = page('cover', [lockedShape('a'), lockedShape('b'), photo('ph1', 4)], {
      groups: [{ id: 'g-keep', name: 'My lockup' }],
    });
    const out = lay(spread, 'minimal-serif-classic', square, { words: { title: { text: 'Oslo' } } });
    expect(out.groups).toContainEqual({ id: 'g-keep', name: 'My lockup' });
  });

  it('TPLAPPLY-016: makes a valid page of every template, on every page format, with and without a theme', () => {
    const words = {
      title: { text: 'Portugal' },
      subtitle: { text: 'Lisbon to the Algarve' },
      date: { text: '2026', binding: { source: 'entry.date' as const, entryId: 7, value: '2026-05-14' } },
      body: { text: 'We took the early train out of Lisbon and walked up through the fog to the palace.' },
      caption: { text: 'Pena Palace in the fog' },
    };
    const formats = ['square-210', 'a4-landscape', 'a4-portrait', 'a5-landscape'] as const;
    for (const preset of formats) {
      for (const theme of [null, bookThemeOf('cutout')]) {
        for (const t of BOOK_DECORATED_TEMPLATES) {
          const spread = page(
            t.kind === 'single' ? 'cover' : 'inner',
            [1, 2, 3, 4, 5, 6, 7, 8].map((n) => photo(`p${n}`, n)),
          );
          const out = lay(spread, t, bookPageSetupForPreset(preset), { theme, words });
          const parsed = bookSpreadSchema.safeParse(out);
          expect(parsed.success, `${t.id} on ${preset}`).toBe(true);
          expect(out.elements.length, t.id).toBeGreaterThan(0);
        }
      }
    }
  });
});
