import {
  bookPageSetupSchema,
  bookSpreadSchema,
  bookTextElementSchema,
  type BookDocument,
  type BookTextElement,
} from '../book.schema';
import { bookThemeColor, bookThemeOf } from '../theme/book-theme';
import { setBookTheme } from '../theme/book-theme-ops';
import { designBook, type BookDesignInput } from './design-book';
import { BOOK_DESIGN_STYLES, bookDesignDirectivesSchema, isBookDesignLook } from './design-directives.schema';
import { designLook } from './design-style';
import { designTheme, themeStylePreset, unlinkDrifted } from './design-theme';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// BKDTHM-001 to BKDTHM-007

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const fixtures = JSON.parse(readFileSync(here('./design-book.fixtures.json'), 'utf8')) as {
  rich: { input: BookDesignInput };
};

function rich(): BookDesignInput {
  let n = 0;
  return { ...fixtures.rich.input, newId: (p) => `${p}-${++n}` };
}

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210 });

function coverTitle(doc: BookDocument): BookTextElement | undefined {
  const cover = doc.spreads.find((s) => s.role === 'cover');
  return cover?.elements.find((e): e is BookTextElement => e.kind === 'text' && e.binding?.source === 'journey.title');
}

describe('the themes as design styles', () => {
  it('BKDTHM-001: are styles after the six looks, each looking like its theme', () => {
    expect(BOOK_DESIGN_STYLES.slice(0, 6)).toEqual(['classic', 'minimal', 'editorial', 'journal', 'bold', 'scrapbook']);
    expect(BOOK_DESIGN_STYLES).toContain('india-stamp');
    expect(isBookDesignLook('bold')).toBe(true);
    expect(isBookDesignLook('alpine')).toBe(false);
    const cutout = themeStylePreset('cutout');
    expect([cutout.paper, cutout.mapStyle, cutout.frameStyle]).toEqual(['#2445b8', 'dark', 'white']);
    expect(themeStylePreset('grid-badge').mapStyle).toBe('minimal');
    expect(themeStylePreset('riviera').mapStyle).toBe('paper');
    const look = designLook(bookDesignDirectivesSchema.parse({ style: 'postcard' }), page, []);
    expect([look.paper, look.accent, look.theme.id]).toEqual(['#e3f1e8', '#c8453d', 'postcard']);
  });

  it('BKDTHM-002: keep a design in one of the older looks as a theme of its own', () => {
    const theme = designTheme(
      'editorial',
      { paper: '#faf8f4', ink: '#161616', accent: '#8c2f1b' },
      {
        heading: 'playfair',
        body: 'garamond',
      },
    );
    expect(theme).toMatchObject({ id: null, decoration: 'none', motifs: [], fonts: { script: null } });
    expect(theme.fonts.display).toEqual({ font: 'playfair' });
    expect(new Set(Object.values(theme.palette)).size).toBe(5);
  });

  it('BKDTHM-003: a faces choice of the person replaces the theme face, the rest stays the theme', () => {
    const theme = designTheme(
      'nordic',
      { paper: '#f3f1ec', ink: '#2e3a45', accent: '#a8741c' },
      {
        heading: 'playfair',
        body: 'inter',
      },
    );
    expect(theme.id).toBe('nordic');
    expect(theme.fonts.heading).toEqual({ font: 'playfair' });
    expect(theme.fonts.body).toEqual(bookThemeOf('nordic').fonts.body);
  });
});

describe('a book designed in a theme', () => {
  it('BKDTHM-004: is kept in the theme, its paper, ink and title linked, the title in the display face', () => {
    const result = designBook(null, rich(), { style: 'tropical' });
    const tropical = bookThemeOf('tropical');
    expect(result.doc.theme?.id).toBe('tropical');
    const title = coverTitle(result.doc);
    expect(title?.fontRole).toBe('display');
    expect(title?.font).toBe(tropical.fonts.display.font);
    const inner = result.doc.spreads.filter((s) => s.role === 'inner');
    expect(inner.some((s) => s.backgroundToken === 'paper')).toBe(true);
    const linked = inner.flatMap((s) => s.elements).filter((e) => e.kind === 'text' && e.token === 'ink');
    expect(linked.length).toBeGreaterThan(0);
    for (const e of linked) expect((e as BookTextElement).color).toBe(bookThemeColor(tropical, 'ink'));
  });

  it('BKDTHM-005: designed in an older look, takes another theme with one call and keeps its layout', () => {
    const designed = designBook(null, rich(), { style: 'editorial' }).doc;
    expect(designed.theme?.id).toBeNull();
    const done = setBookTheme(designed, { theme: 'alpine', adopt: false });
    if (!done.ok) throw new Error('refused');
    const alpine = bookThemeOf('alpine');
    const before = designed.spreads.flatMap((s) => s.elements.map((e) => e.frame));
    const after = done.doc.spreads.flatMap((s) => s.elements.map((e) => e.frame));
    expect(after).toEqual(before);
    const texts = done.doc.spreads.flatMap((s) => s.elements).filter((e) => e.kind === 'text' && e.token === 'ink');
    expect(texts.length).toBeGreaterThan(0);
    for (const e of texts) expect((e as BookTextElement).color).toBe(alpine.palette.ink);
  });

  it('BKDTHM-006: designs the same book twice the same way', () => {
    const a = designBook(null, rich(), { style: 'india-stamp' });
    const b = designBook(null, rich(), { style: 'india-stamp' });
    expect(JSON.stringify(b.doc)).toBe(JSON.stringify(a.doc));
  });

  it('BKDTHM-007: unlinks a colour the repair changed, so the next theme keeps the repaired one', () => {
    const theme = bookThemeOf('riviera');
    const words = bookTextElementSchema.parse({
      id: 't',
      kind: 'text',
      frame: { x: 1, y: 1, w: 10, h: 10 },
      color: '#ffffff',
      token: 'ink',
    });
    const kept = bookTextElementSchema.parse({ ...words, id: 'k', color: theme.palette.ink });
    const spread = bookSpreadSchema.parse({ id: 's', elements: [words, kept] });
    const fixed = unlinkDrifted(spread, theme);
    expect('token' in (fixed.elements[0] as object)).toBe(false);
    expect(fixed.elements[1]).toMatchObject({ token: 'ink' });
    const clean = bookSpreadSchema.parse({ id: 'e', elements: [kept] });
    expect(unlinkDrifted(clean, theme)).toBe(clean);
  });
});
