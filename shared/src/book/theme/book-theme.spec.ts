import { contrastRatio } from '../book-colour';
import { bookFontHasWeight, bookFontRole } from '../book-fonts';
import { BOOK_FONTS_IDS, bookDocumentSchema, bookPhotoElementSchema, bookTextElementSchema } from '../book.schema';
import {
  bookThemeColor,
  bookThemeFont,
  bookThemeOf,
  bookThemePreset,
  isBookFontFamily,
  isBookThemeId,
  mutedOn,
  readableOn,
  themePaperBackground,
} from './book-theme';
import {
  BOOK_THEME_FRAMES,
  BOOK_THEME_IDS,
  BOOK_THEME_MOTIFS,
  bookColorTokenFieldSchema,
  bookThemeFieldSchema,
  bookThemeSchema,
} from './book-theme.schema';
import { BOOK_THEME_PRESETS } from './book-themes.data';

import { describe, expect, it } from 'vitest';

// BKTHEME-001 to BKTHEME-010

describe('the built-in themes', () => {
  it('BKTHEME-001: are twelve, one per id, in the order of the ids', () => {
    expect(BOOK_THEME_PRESETS.map((p) => p.id)).toEqual([...BOOK_THEME_IDS]);
    expect(BOOK_THEME_IDS).toHaveLength(12);
    for (const id of BOOK_THEME_IDS) expect(bookThemeOf(id).id).toBe(id);
    expect(bookThemePreset('nope')).toBeUndefined();
    expect(() => bookThemeOf('nope' as never)).toThrow();
  });

  it('BKTHEME-002: each set ink that reads on its paper and a first accent that marks on it', () => {
    for (const p of BOOK_THEME_PRESETS) {
      expect(contrastRatio(p.palette.ink, p.palette.paper), p.id).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(p.palette.accent, p.palette.paper), p.id).toBeGreaterThanOrEqual(3);
      const colours = Object.values(p.palette);
      expect(new Set(colours).size, p.id).toBe(colours.length);
    }
  });

  it('BKTHEME-003: set every slot in a family of the catalogue at a weight it ships, with motifs of the library', () => {
    for (const p of BOOK_THEME_PRESETS) {
      const picks = [p.fonts.display, p.fonts.heading, p.fonts.body, p.fonts.script].filter((f) => f !== null);
      for (const pick of picks) {
        expect((BOOK_FONTS_IDS as readonly string[]).includes(pick.font), `${p.id} ${pick.font}`).toBe(true);
        if (pick.weight !== undefined)
          expect(bookFontHasWeight(pick.font, pick.weight), `${p.id} ${pick.font}`).toBe(true);
      }
      if (p.fonts.script) expect(bookFontRole(p.fonts.script.font), p.id).toBe('script');
      expect(p.motifs.length).toBeGreaterThan(0);
      for (const m of p.motifs) expect(BOOK_THEME_MOTIFS).toContain(m);
      expect(p.descr).not.toMatch(/[\u2013\u2014]| - /);
      expect(p.labelKey).toMatch(/^studio\.theme\.name\./);
      expect(p.descrKey).toMatch(/^studio\.theme\.descr\./);
    }
  });

  it('BKTHEME-004: offer exactly the photo frame styles the document knows', () => {
    expect([...BOOK_THEME_FRAMES]).toEqual(bookPhotoElementSchema.shape.frameStyle.unwrap().options);
  });
});

describe('a theme slot in this build', () => {
  it('BKTHEME-005: copies the faces of a preset, so editing a theme never edits the catalogue', () => {
    const theme = bookThemeOf('poster-pop');
    expect(theme.fonts.display).toEqual({ font: 'archivo', weight: 400 });
    theme.fonts.display.font = 'inter';
    expect(bookThemeOf('poster-pop').fonts.display.font).toBe('archivo');
    expect(isBookFontFamily('serif')).toBe(true);
    expect(isBookFontFamily('comic')).toBe(false);
  });

  it('BKTHEME-006: resolves every built-in slot to a family the text schema takes', () => {
    for (const id of BOOK_THEME_IDS) {
      const theme = bookThemeOf(id);
      for (const slot of ['display', 'heading', 'body', 'script'] as const) {
        const face = bookThemeFont(theme, slot);
        if (face) expect(bookTextElementSchema.shape.font.safeParse(face.font).success, `${id} ${slot}`).toBe(true);
      }
    }
    expect(bookThemeOf('minimal-serif').fonts.script).toBeNull();
  });
});

describe('the colours of a theme', () => {
  it('BKTHEME-007: answer each token, the muted ink derived and still readable', () => {
    const theme = bookThemeOf('riviera');
    expect(bookThemeColor(theme, 'paper')).toBe(theme.palette.paper);
    expect(bookThemeColor(theme, 'accent3')).toBe(theme.palette.accent3);
    const muted = bookThemeColor(theme, 'muted');
    expect(muted).not.toBe(theme.palette.ink);
    expect(contrastRatio(muted, theme.palette.paper)).toBeGreaterThanOrEqual(4.6);
    // An ink that does not read on its paper is replaced, and so is a muted one that would not.
    expect(readableOn('#ffffff', '#fefefe')).toBe('#1a1a1a');
    expect(mutedOn('#ffffff', '#777777')).toBe('#777777');
  });

  it('BKTHEME-008: put white paper on a page as no background, and any other as itself', () => {
    expect(themePaperBackground(bookThemeOf('grid-badge'))).toBeNull();
    expect(themePaperBackground(bookThemeOf('cutout'))).toBe('#2445b8');
  });
});

describe('a theme as the document reads it', () => {
  it('BKTHEME-009: falls back field by field, and an unreadable theme is no theme', () => {
    const theme = bookThemeOf('poster-pop');
    const odd = bookThemeSchema.parse({
      ...theme,
      id: 'gone',
      motifs: ['sea', 'volcanoes', 'sea'],
      decoration: 'loud',
      frameStyle: 'gold',
      tilt: 40,
    });
    expect([odd.id, odd.motifs, odd.decoration, odd.frameStyle, odd.tilt]).toEqual([null, ['sea'], 'light', 'none', 0]);
    expect(bookThemeFieldSchema.parse({ palette: 'red' })).toBeUndefined();
    expect(bookColorTokenFieldSchema.parse('accent9')).toBeUndefined();
    expect(isBookThemeId('nordic')).toBe(true);
    expect(isBookThemeId('classic')).toBe(false);
  });

  it('BKTHEME-010: keeps a book whose theme or links it cannot read, with its pages whole', () => {
    const doc = bookDocumentSchema.parse({
      theme: { id: 'nordic' },
      spreads: [
        {
          id: 's1',
          backgroundToken: 'gold',
          elements: [{ id: 't1', kind: 'text', frame: { x: 1, y: 1, w: 10, h: 5 }, token: 'nope', fontRole: 7 }],
        },
      ],
    });
    expect(doc.theme).toBeUndefined();
    expect(doc.spreads[0]?.backgroundToken).toBeUndefined();
    expect(doc.spreads[0]?.elements).toHaveLength(1);
    const kept = bookDocumentSchema.parse({ theme: bookThemeOf('alpine') });
    expect(kept.theme?.id).toBe('alpine');
  });
});
