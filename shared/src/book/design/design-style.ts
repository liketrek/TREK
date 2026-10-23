import { accentFromPalettes, contrastRatio, parseHex, readPalette, readableInk, toHex } from '../book-colour';
import type { BookPhotoInfo } from '../book-ops-core';
import type { BookFontFamily, BookPageSetup, BookPhotoElement } from '../book.schema';
import type { BookDesignDirectives, BookDesignStyle } from './design-directives.schema';

/**
 * The look of a designed book: its paper, ink, accent, the two typefaces,
 * the type sizes and the page grid, from the style and the directives.
 *
 * At most two families per book; badges, figures, maps and lists take the
 * heading face. Sizes are set for a 210 mm page and scale with the page
 * width, times `type.scale`, never under what a reader can read and never
 * over what a text element takes. The cover title has a tier of its own,
 * `display`, the heading size times `type.display`: 1 by default, so a book
 * designed without it is set exactly as before, and up to 6.5 for a title
 * that fills the cover. Every colour a text is set in is checked against the paper
 * to WCAG contrast; a pair that fails falls back to the ink.
 */

export interface BookDesignLook {
  style: BookDesignStyle;
  paper: string;
  ink: string;
  /** Captions and meta lines: lighter than the ink, still 4.5:1 on the paper. */
  muted: string;
  accent: string;
  /** What goes under words set on a photograph, at `scrimOpacity`. */
  scrim: string;
  scrimOpacity: number;
  /** The colour words take on the scrim. */
  onScrim: string;
  heading: BookFontFamily;
  body: BookFontFamily;
  /** Points. `display` is the cover title's, the heading's unless `type.display` raises it. */
  sizes: { display: number; heading: number; sub: number; body: number; caption: number; meta: number };
  /** The frame decoration and the slight turn a scrapbook gives its pictures. */
  frameStyle: BookPhotoElement['frameStyle'];
  tilt: number;
  /** The map style that reads on this paper. */
  mapStyle: 'minimal' | 'outline' | 'dark' | 'paper';
}

interface StylePreset {
  paper: string;
  ink: string;
  accent: string;
  heading: BookFontFamily;
  body: BookFontFamily;
  frameStyle: BookPhotoElement['frameStyle'];
  tilt: number;
  mapStyle: BookDesignLook['mapStyle'];
}

const PRESETS: Record<BookDesignStyle, StylePreset> = {
  classic: {
    paper: '#ffffff',
    ink: '#1a1a1a',
    accent: '#c2410c',
    heading: 'sans',
    body: 'sans',
    frameStyle: 'none',
    tilt: 0,
    mapStyle: 'minimal',
  },
  minimal: {
    paper: '#ffffff',
    ink: '#1f1f1f',
    accent: '#3d3d3d',
    heading: 'inter',
    body: 'inter',
    frameStyle: 'none',
    tilt: 0,
    mapStyle: 'outline',
  },
  editorial: {
    paper: '#faf8f4',
    ink: '#161616',
    accent: '#8c2f1b',
    heading: 'playfair',
    body: 'garamond',
    frameStyle: 'none',
    tilt: 0,
    mapStyle: 'paper',
  },
  journal: {
    paper: '#f6f1e7',
    ink: '#2a241c',
    accent: '#6b4f2a',
    heading: 'serif',
    body: 'garamond',
    frameStyle: 'white',
    tilt: 0,
    mapStyle: 'paper',
  },
  bold: {
    paper: '#111111',
    ink: '#f5f2ec',
    accent: '#e4572e',
    heading: 'bebas',
    body: 'inter',
    frameStyle: 'none',
    tilt: 0,
    mapStyle: 'dark',
  },
  scrapbook: {
    paper: '#f3ede2',
    ink: '#2b2620',
    accent: '#c0392b',
    heading: 'display',
    body: 'sans',
    frameStyle: 'polaroid',
    tilt: 2,
    mapStyle: 'paper',
  },
};

/** Type sizes on a 210 mm page, in points. */
const BASE_SIZES = { heading: 28, sub: 14, body: 10, caption: 7.5, meta: 7 };
/** Never under these: running text reads from 7 pt, a caption or meta line from 5.5 pt (with room to spare). */
const FLOOR = { heading: 14, sub: 9, body: 8, caption: 7, meta: 6 };
/** Never over this: the largest size a text element takes (book.schema.ts). */
const MAX_PT = 200;

const round1 = (v: number) => Math.round(v * 10) / 10;

/** A colour part way from `a` to `b`. */
function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  return toHex({ r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t });
}

/** The ink, unless it reads under 4.5:1 on the paper, then whichever of near black and white reads better. */
function readableOn(paper: string, ink: string): string {
  return contrastRatio(ink, paper) >= 4.5 ? ink : readableInk(paper);
}

/** The paper, ink and accent the palette directive asks for. */
function paletteOf(
  preset: StylePreset,
  palette: BookDesignDirectives['palette'],
  photos: readonly BookPhotoInfo[],
): { paper: string; ink: string; accent: string } {
  if (palette === 'ink') return { paper: preset.paper, ink: preset.ink, accent: preset.ink };
  if (palette === 'from_photos') {
    const accent = accentFromPalettes(photos.map((p) => readPalette(p.palette)));
    return { paper: preset.paper, ink: preset.ink, accent: accent ?? preset.accent };
  }
  if (palette) {
    const paper = palette.paper.toLowerCase();
    const ink = palette.ink.toLowerCase();
    // An accent of the person's own still has to show on their paper: 3:1, the line for marks and large type.
    const accent = contrastRatio(palette.accent, paper) >= 3 ? palette.accent.toLowerCase() : readableOn(paper, ink);
    return { paper, ink, accent };
  }
  return { paper: preset.paper, ink: preset.ink, accent: preset.accent };
}

/** The look of the book, from its style, its directives, its page and the photos it uses. */
export function designLook(
  directives: BookDesignDirectives,
  page: BookPageSetup,
  usedPhotos: readonly BookPhotoInfo[],
): BookDesignLook {
  const preset = PRESETS[directives.style];
  const colours = paletteOf(preset, directives.palette, usedPhotos);
  const ink = readableOn(colours.paper, colours.ink);
  const softer = mix(ink, colours.paper, 0.3);
  const muted = contrastRatio(softer, colours.paper) >= 4.6 ? softer : ink;
  const scale = (page.pageWidth / 210) * (directives.type?.scale ?? 1);
  const size = (role: keyof typeof BASE_SIZES, times = 1) =>
    Math.min(MAX_PT, Math.max(FLOOR[role], round1(BASE_SIZES[role] * scale * times)));
  const heading = directives.type?.heading ?? preset.heading;
  return {
    style: directives.style,
    paper: colours.paper,
    ink,
    muted,
    accent: colours.accent,
    scrim: '#111111',
    scrimOpacity: 0.6,
    onScrim: '#ffffff',
    heading,
    body: directives.type?.body ?? preset.body,
    sizes: {
      display: size('heading', directives.type?.display ?? 1),
      heading: size('heading'),
      sub: size('sub'),
      body: size('body'),
      caption: size('caption'),
      meta: size('meta'),
    },
    frameStyle: preset.frameStyle,
    tilt: preset.tilt,
    mapStyle: preset.mapStyle,
  };
}

/** The page grid: margin and gutter in millimetres, as fractions of the page width over the safe area. */
export interface BookDesignGrid {
  pageWidth: number;
  pageHeight: number;
  bleed: number;
  safe: number;
  margin: number;
  gutter: number;
}

export function designGrid(page: BookPageSetup): BookDesignGrid {
  const margin = Math.max(page.safe + 6, 0.075 * page.pageWidth);
  return {
    pageWidth: page.pageWidth,
    pageHeight: page.pageHeight,
    bleed: page.bleed,
    safe: page.safe,
    margin: Math.round(margin * 100) / 100,
    gutter: Math.round(0.025 * page.pageWidth * 100) / 100,
  };
}

/** The background a spread takes: none for white paper (the paper itself), else the paper colour. */
export const paperBackground = (look: BookDesignLook): string | null => (look.paper === '#ffffff' ? null : look.paper);
