import { luminance, parseHex } from '../book-colour';
import type { BookElement, BookFontFamily, BookSpread } from '../book.schema';
import {
  bookThemeColor,
  bookThemeFromPreset,
  bookThemeOf,
  bookThemePreset,
  isBookFontFamily,
  mixHex,
} from '../theme/book-theme';
import { themedSpread } from '../theme/book-theme-apply';
import type { BookColorToken, BookTheme, BookThemeId } from '../theme/book-theme.schema';
import type { BookDesignStyle } from './design-directives.schema';
import type { BookDesignLook, StylePreset } from './design-style';

/**
 * The design engine and the themes, one look: a theme is a style the
 * assistant can design in, and every designed book is kept in a theme, so
 * the Theme panel and `set_book_theme` can take it on from there.
 *
 * The composers keep setting real colours and faces from the look. Once a
 * page is composed, `themeDesignedSpread` links every colour that is the
 * look's paper, ink, muted ink or accent, and every text set in the look's
 * faces, then lets the theme set what the look cannot say alone: the cover
 * title in the display face, the weights the theme asks for.
 */

/** The map style that reads on a paper: dark on a dark one, plain on white, the paper style on a tinted one. */
function mapStyleOn(paper: string): StylePreset['mapStyle'] {
  const c = parseHex(paper);
  const lum = c ? luminance(c) : 1;
  if (lum < 0.2) return 'dark';
  return paper.toLowerCase() === '#ffffff' ? 'minimal' : 'paper';
}

/** A theme as one of the design engine's style presets. */
export function themeStylePreset(id: BookThemeId): StylePreset {
  const theme = bookThemeOf(id);
  const family = (f: string): BookFontFamily => (isBookFontFamily(f) ? f : 'sans');
  return {
    paper: theme.palette.paper,
    ink: theme.palette.ink,
    accent: theme.palette.accent,
    heading: family(theme.fonts.heading.font),
    body: family(theme.fonts.body.font),
    frameStyle: theme.frameStyle,
    tilt: theme.tilt,
    mapStyle: mapStyleOn(theme.palette.paper),
  };
}

/**
 * The theme a design is kept in. A theme style is that theme, its colours as
 * the directives left them (photos, a palette of the person's own) and its
 * faces as `type` chose them. One of the six older looks becomes a theme of
 * the book's own, its second and third accents drawn from its first.
 */
export function designTheme(
  style: BookDesignStyle,
  colours: { paper: string; ink: string; accent: string },
  faces: { heading: BookFontFamily; body: BookFontFamily },
): BookTheme {
  const preset = bookThemePreset(style);
  const base = preset ? bookThemeFromPreset(preset) : null;
  const heading = base && base.fonts.heading.font === faces.heading ? base.fonts.heading : { font: faces.heading };
  const body = base && base.fonts.body.font === faces.body ? base.fonts.body : { font: faces.body };
  return {
    id: base ? base.id : null,
    palette: {
      ...colours,
      accent2: base?.palette.accent2 ?? mixHex(colours.accent, colours.paper, 0.45),
      accent3: base?.palette.accent3 ?? mixHex(colours.ink, colours.accent, 0.5),
    },
    fonts: {
      display: base?.fonts.display ?? heading,
      heading,
      body,
      script: base ? base.fonts.script : null,
    },
    motifs: base ? base.motifs : [],
    decoration: base ? base.decoration : 'none',
    frameStyle: base ? base.frameStyle : 'none',
    tilt: base ? base.tilt : 0,
  };
}

/**
 * The token a colour of the look stands for, if it is one. Words are never
 * linked to the paper: white words on a white book's cover sit on a scrim
 * over a photo, and must not take the paper of the next theme.
 */
function lookToken(hex: string | null, look: BookDesignLook, words = false): BookColorToken | undefined {
  if (!hex) return undefined;
  const c = hex.toLowerCase();
  if (c === look.ink.toLowerCase()) return 'ink';
  if (c === look.muted.toLowerCase()) return 'muted';
  if (c === look.accent.toLowerCase()) return 'accent';
  return !words && c === look.paper.toLowerCase() ? 'paper' : undefined;
}

/** Whether a text is the cover's title: bound to the journey's, or the largest words on the cover. */
function isCoverTitle(el: Extract<BookElement, { kind: 'text' }>, spread: BookSpread): boolean {
  if (spread.role !== 'cover') return false;
  if (el.binding?.source === 'journey.title') return true;
  const sizes = spread.elements.flatMap((e) => (e.kind === 'text' ? [e.size] : []));
  return el.size >= Math.max(...sizes) && !spread.elements.some((e) => e.kind === 'text' && e.binding);
}

/** A designed element with its links to the look. */
function linkToLook(el: BookElement, spread: BookSpread, look: BookDesignLook): BookElement {
  switch (el.kind) {
    // A line keeps the colour it was drawn in (book-line.schema.ts has no theme link).
    case 'photo':
    case 'sticker':
    case 'line':
      return el;
    case 'text': {
      const token = lookToken(el.color, look, true);
      const heading = el.font === look.heading && (el.font !== look.body || el.size >= look.sizes.sub);
      const slot = isCoverTitle(el, spread) ? 'display' : heading ? 'heading' : el.font === look.body ? 'body' : null;
      return { ...el, ...(token ? { token } : {}), ...(slot ? { fontRole: slot } : {}) };
    }
    case 'shape': {
      if (el.gradient !== 'none') return el;
      const token = lookToken(el.fill, look);
      const strokeToken = lookToken(el.stroke, look);
      return { ...el, ...(token ? { token } : {}), ...(strokeToken ? { strokeToken } : {}) };
    }
    case 'icon': {
      const token = lookToken(el.color, look, true);
      return token ? { ...el, token } : el;
    }
    default: {
      const token = lookToken(el.color, look, true);
      const accentToken = lookToken(el.accent, look, true);
      const fontRole = el.font === look.heading ? 'heading' : el.font === look.body ? 'body' : null;
      return {
        ...el,
        ...(token ? { token } : {}),
        ...(accentToken ? { accentToken } : {}),
        ...(fontRole ? { fontRole } : {}),
      };
    }
  }
}

/** A composed page linked to its look and set by the book's theme: the step between composing and repair. */
export function themeDesignedSpread(spread: BookSpread, look: BookDesignLook): BookSpread {
  const paper = look.paper.toLowerCase();
  const onPaper = spread.background === null || spread.background.toLowerCase() === paper;
  const linked: BookSpread = {
    ...spread,
    ...(onPaper ? { backgroundToken: 'paper' as const } : {}),
    elements: spread.elements.map((e) => linkToLook(e, spread, look)),
  };
  return themedSpread(linked, look.theme);
}

/** The colour fields each link sets, as `unlinkDrifted` checks them. */
const LINKED: readonly (readonly [link: 'token' | 'strokeToken' | 'accentToken', field: string])[] = [
  ['token', 'color'],
  ['token', 'fill'],
  ['strokeToken', 'stroke'],
  ['accentToken', 'accent'],
];

/**
 * A repaired page with the links taken off every colour the repair changed:
 * a caption put in the light ink over a busy photo keeps that ink, rather than
 * going back to the theme's on the next apply.
 */
export function unlinkDrifted(spread: BookSpread, theme: BookTheme): BookSpread {
  let changed = false;
  const elements = spread.elements.map((el) => {
    const rec = el as unknown as Record<string, unknown>;
    const next = { ...rec };
    for (const [link, field] of LINKED) {
      const token = rec[link] as BookColorToken | undefined;
      const value = rec[field];
      if (!token || typeof value !== 'string' || (field === 'color' && el.kind === 'shape')) continue;
      if (field === 'fill' && el.kind !== 'shape') continue;
      if (value.toLowerCase() !== bookThemeColor(theme, token).toLowerCase()) delete next[link];
    }
    if (Object.keys(next).length === Object.keys(rec).length) return el;
    changed = true;
    return next as unknown as BookElement;
  });
  return changed ? { ...spread, elements } : spread;
}
