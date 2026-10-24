import { contrastRatio } from '../book-colour';
import { blankBook } from '../book-pages';
import {
  bookIconElementSchema,
  bookMapElementSchema,
  bookShapeElementSchema,
  bookTextElementSchema,
  type BookSpread,
} from '../book.schema';
import { describeSpread } from '../describe-spread';
import { bookThemeOf } from './book-theme';
import { bookThemeCatalogue, bookThemeLine, themeBackgroundWords, themeLinkWords } from './book-theme-describe';
import { bookPaletteFromPhotos } from './book-theme-photos';
import { BOOK_THEME_IDS } from './book-theme.schema';

import { describe, expect, it } from 'vitest';

// BKTHDS-001 to BKTHDS-006

const frame = { x: 1, y: 1, w: 10, h: 10 };

describe('the theme in words', () => {
  it('BKTHDS-001: says which theme a book is in, its colours, faces, motifs and decoration', () => {
    const line = bookThemeLine(bookThemeOf('india-stamp'));
    expect(line).toMatch(/^Theme: india-stamp \(Stamp collage:/);
    expect(line).toContain('accent #bd2275');
    expect(line).toContain('motifs asia, ephemera; decoration rich.');
    expect(bookThemeLine(bookThemeOf('minimal-serif'))).toContain('script none');
    expect(bookThemeLine({ ...bookThemeOf('nordic'), id: null, motifs: [] })).toMatch(/^Theme: its own;.*motifs none/);
    expect(bookThemeLine(undefined)).toBe('Theme: none yet (set_book_theme applies one).');
  });

  it('BKTHDS-002: says what each element and the page follow', () => {
    const t = bookTextElementSchema.parse({ id: 't', kind: 'text', frame, token: 'accent', fontRole: 'display' });
    expect(themeLinkWords(t)).toBe('follows the theme: colour accent, display face');
    const s = bookShapeElementSchema.parse({ id: 's', kind: 'shape', frame, token: 'paper', strokeToken: 'ink' });
    expect(themeLinkWords(s)).toBe('follows the theme: fill paper, stroke ink');
    const m = bookMapElementSchema.parse({ id: 'm', kind: 'map', frame, accentToken: 'accent2' });
    expect(themeLinkWords(m)).toBe('follows the theme: accent accent2');
    expect(themeLinkWords(bookIconElementSchema.parse({ id: 'i', kind: 'icon', frame, name: 'Sun' }))).toBe('');
    expect(themeBackgroundWords({ backgroundToken: 'paper' } as BookSpread)).toBe(" It follows the theme's paper.");
  });

  it('BKTHDS-003: describe_book_page carries the theme line and the links', () => {
    const doc = blankBook({ title: 'T', newId: (p) => `${p}-1` });
    const cover = doc.spreads[0] as BookSpread;
    const themed = {
      ...doc,
      theme: bookThemeOf('alpine'),
      spreads: [
        {
          ...cover,
          backgroundToken: 'paper' as const,
          elements: [bookTextElementSchema.parse({ id: 'tt', kind: 'text', frame, text: 'Hi', token: 'ink' })],
        },
      ],
    };
    const text = describeSpread(themed, cover.id)?.text ?? '';
    expect(text).toContain('Theme: alpine');
    expect(text).toContain("It follows the theme's paper.");
    expect(text).toContain('follows the theme: colour ink');
  });

  it('BKTHDS-004: lists every built-in theme for the tool description', () => {
    const catalogue = bookThemeCatalogue();
    for (const id of BOOK_THEME_IDS) expect(catalogue).toContain(`${id}:`);
  });
});

describe('a palette from the photos', () => {
  const base = bookThemeOf('minimal-serif').palette;

  it('BKTHDS-005: takes the most shared colours as accents, the first readable on the paper', () => {
    const photos = [
      [
        { hex: '#f2d35a', share: 0.5 },
        { hex: '#2f6db0', share: 0.3 },
        { hex: '#808080', share: 0.2 },
      ],
      [
        { hex: '#f0d058', share: 0.4 },
        { hex: '#3a8a3a', share: 0.4 },
      ],
    ];
    const palette = bookPaletteFromPhotos(base, photos);
    expect(palette?.paper).toBe(base.paper);
    expect(palette?.ink).toBe(base.ink);
    expect(contrastRatio(palette?.accent ?? '#ffffff', base.paper)).toBeGreaterThanOrEqual(3);
    expect([palette?.accent2, palette?.accent3]).toEqual(['#3a8a3a', '#2f6db0']);
  });

  it('BKTHDS-006: gives nothing for grey photos, and derives the missing accents from one colour', () => {
    expect(bookPaletteFromPhotos(base, [[{ hex: '#777777', share: 1 }]])).toBeNull();
    const one = bookPaletteFromPhotos(base, [[{ hex: '#1f6fbf', share: 1 }]]);
    expect(one?.accent).toBe('#1f6fbf');
    expect(one?.accent2).not.toBe(one?.accent);
    expect(one?.accent3).not.toBe(one?.accent2);
  });
});
