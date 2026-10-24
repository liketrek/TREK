import type {
  BookBadgeStyle,
  BookBadgeVariant,
  BookColorToken,
  BookCountryLook,
  BookElement,
  BookMapElement,
  BookMapScope,
  BookMetric,
  BookPageSetup,
  BookStatsLook,
  BookTheme,
  JourneyStats,
} from '@trek/shared';
import {
  bookBadgeValue,
  bookCountryName,
  bookTravelBadge,
  bookTravelCountries,
  bookTravelMap,
  bookTravelSize,
  bookTravelStats,
  themedElement,
  bookElementId as uid,
} from '@trek/shared';
import { studioTravelContext } from '../studioTravelContext';

/**
 * What the Travel panel offers, built: every card is the element its click
 * places, made by the book engine's own factories (book-travel.ts) so a card
 * and what the assistant places are one thing, then set in one of the newer
 * looks and dressed in the book's theme.
 *
 * Pure, so the panel stays a list of shelves: it asks for an element and
 * renders it through the page's own renderer, and the preview and the result
 * are the same object.
 */

/** The figures a summary offers: how far, how long, where, and how much was kept. */
const SUMMARY_METRICS: BookMetric[] = ['distance', 'days', 'countries', 'photos'];

/** The looks of a summary, in the order the panel offers them. */
export const SUMMARY_LOOKS: BookStatsLook[] = [
  'poster',
  'ticket',
  'tiles',
  'sign',
  'odometer',
  'note',
  'sketch',
  'band',
];

/** The marks the journey fills, in the order a page is read: when, which day, how far, where. */
export const MARK_VARIANTS = ['date', 'day', 'distance', 'coords', 'flag'] as const;
export type MarkVariant = (typeof MARK_VARIANTS)[number];

/** The newer styles a mark comes in, and which of them each mark is offered in. */
export const MARK_STYLES: { style: BookBadgeStyle; variants: readonly MarkVariant[] }[] = [
  { style: 'stamp', variants: ['date', 'day', 'flag'] },
  { style: 'tag', variants: ['day', 'distance', 'coords', 'flag'] },
  { style: 'pill', variants: ['date', 'day', 'distance', 'coords', 'flag'] },
  { style: 'ribbon', variants: ['date', 'day', 'distance', 'flag'] },
  { style: 'sticker', variants: ['date', 'day', 'distance', 'flag'] },
  { style: 'patch', variants: ['day', 'distance', 'flag'] },
  { style: 'sketch', variants: ['date', 'day', 'distance', 'coords', 'flag'] },
];

/** The single figures, one shelf per look, with the figures each look suits. */
export const FIGURE_SHELVES: { look: BookStatsLook; metrics: readonly BookMetric[] }[] = [
  { look: 'medal', metrics: ['distance', 'days', 'steps', 'photos', 'countries', 'places', 'furthest'] },
  { look: 'odometer', metrics: ['distance', 'furthest', 'days', 'photos'] },
  { look: 'sketch', metrics: ['distance', 'days', 'countries', 'photos'] },
];

/** The looks a country is offered in. */
export const COUNTRY_LOOKS: BookCountryLook[] = ['stamp', 'visa', 'postcard', 'flag', 'pin', 'label', 'sketch'];

/** The looks written by hand take the theme's script face rather than its heading. */
const HANDWRITTEN = new Set<string>(['note', 'sketch']);

/** Which of the theme's accents each country look takes, so a shelf of them is not one colour. */
const COUNTRY_ACCENT: Partial<Record<BookCountryLook, BookColorToken>> = {
  stamp: 'accent2',
  visa: 'accent3',
  pin: 'accent',
  label: 'accent2',
};

/** Which of the theme's accents each mark takes, so a page of them is not one colour. */
const MARK_ACCENT: Record<MarkVariant, BookColorToken> = {
  date: 'accent',
  day: 'accent2',
  distance: 'accent3',
  coords: 'accent',
  flag: 'accent2',
};

/** The map cards: the photographed route, its stops numbered, its two ends marked, and the dark ground. */
export const MAP_CARDS: {
  id: string;
  labelKey: string;
  style: BookMapElement['style'];
  pins?: BookMapElement['pinStyle'];
}[] = [
  { id: 'photos', labelKey: 'journey.studio.pinPhoto', style: 'minimal' },
  { id: 'numbered', labelKey: 'journey.studio.pinNumbered', style: 'minimal', pins: 'numbered' },
  { id: 'ends', labelKey: 'journey.studio.pinEnds', style: 'minimal', pins: 'ends' },
  { id: 'dark', labelKey: 'journey.studio.mapStyle.dark', style: 'dark', pins: 'numbered' },
];

interface BuilderInput {
  page: BookPageSetup;
  stats: JourneyStats;
  /** The travelled way, already thinned. */
  path: [number, number][][];
  locale: string;
  t: (k: string) => string;
  theme: BookTheme | null | undefined;
  /** The spread on screen is one page rather than two, so a new element centres on it. */
  single: boolean;
}

export function travelBuilders({ page, stats, path, locale, t, theme, single }: BuilderInput) {
  const travel = studioTravelContext(stats, path, locale, t);

  /** Centred across the spread on screen, where the engine's `add` takes the right page. */
  const at = (size: { w: number; h: number }) => {
    const W = single ? page.pageWidth : page.pageWidth * 2;
    return { x: (W - size.w) / 2, y: (page.pageHeight - size.h) / 2, w: size.w, h: size.h };
  };

  /**
   * An element dressed in the book's theme: its words in the theme's ink and
   * heading face, its colour one of the theme's accents, all three linked so
   * it follows when the theme changes. A book without a theme keeps the
   * engine's own colours.
   */
  const dress = (el: BookElement, accent: BookColorToken = 'accent', hand = false): BookElement =>
    theme
      ? themedElement(
          { ...el, token: 'ink', accentToken: accent, fontRole: hand ? 'script' : 'heading' } as BookElement,
          theme
        )
      : el;

  /** A summary in one of the newer looks; a band is a strip, so it is set a third as tall. */
  const summaryEl = (look: BookStatsLook): BookElement => {
    const w = page.pageWidth * (look === 'note' || look === 'sign' ? 0.56 : 0.72);
    const h =
      look === 'band' ? page.pageHeight * 0.13 : look === 'ticket' ? w * 0.42 : look === 'note' ? w * 0.72 : w * 0.5;
    const el = { ...bookTravelStats(stats, { id: uid('st'), frame: at({ w, h }), metrics: SUMMARY_METRICS }), look };
    return dress(el, look === 'sign' ? 'accent3' : 'accent', HANDWRITTEN.has(look));
  };

  /**
   * One figure on its own, the mark to drop beside a photograph: as a medal, on
   * the drums of an odometer, or ringed by hand.
   */
  const figureEl = (metric: BookMetric, look: BookStatsLook = 'medal'): BookElement => {
    const side = Math.min(page.pageWidth, page.pageHeight) * 0.3;
    const size = look === 'odometer' ? { w: side * 1.6, h: side * 0.62 } : { w: side, h: side };
    const el = { ...bookTravelStats(stats, { id: uid('st'), frame: at(size), metrics: [metric] }), look };
    return dress(el, 'accent', HANDWRITTEN.has(look));
  };

  /**
   * A map as the engine places it, on the card's ground and with the card's
   * stops. The scope is the journey or one trip; the ground is the outlines
   * or one of the two imagery sources.
   */
  const mapEl = (
    card: { style: BookMapElement['style']; pins?: BookMapElement['pinStyle'] },
    scope: BookMapScope = 'journey',
    source: 'vector' | 'relief' | 'satellite' = 'vector'
  ): BookElement => {
    const el = bookTravelMap(travel, stats, { id: uid('mp'), frame: at(bookTravelSize('map', page)), scope, source });
    const shaped = { ...el, style: card.style, ...(card.pins ? { pinStyle: card.pins } : {}) };
    // Over imagery the line is white on purpose (book-travel.ts); only the outline maps take the theme.
    return source === 'vector' ? dress(shaped) : shaped;
  };

  /**
   * A map of one country: its stops alone, without the way there. A journey's
   * recorded way often starts with the flight from home, and fitted to all of
   * it the country is a speck at the edge of a continent; the page a travel
   * book wants is the country, cut to its own shape on the paper or over the
   * satellite picture, or the country in a box.
   */
  const countryMapEl = (code: string, kind: 'shape' | 'satellite' | 'box'): BookElement => {
    const own = {
      ...stats,
      points: stats.points.filter((p) => p.country === code),
      countries: stats.countries.filter((c) => c.code === code),
    };
    const ctx = studioTravelContext(own, [], locale, t);
    const source = kind === 'satellite' ? 'satellite' : 'vector';
    const el = bookTravelMap(ctx, own, {
      id: uid('mp'),
      frame: at(bookTravelSize('map', page)),
      scope: 'journey',
      source,
    });
    // Cut to its shape on the paper, the land is dark, so the silhouette reads and the route in the accent stands on it.
    const style = kind === 'shape' ? 'dark' : 'minimal';
    const shaped = {
      ...el,
      style,
      clip: kind === 'box' ? 'rect' : 'country',
      pinStyle: 'numbered',
      fitToCountries: true,
    } as const;
    return source === 'vector' ? dress(shaped) : shaped;
  };

  /** A mark in one of the newer styles, at the size its variant suits; a stamp is set taller for its two rules. */
  const markEl = (variant: MarkVariant, style: BookBadgeStyle): BookElement | null => {
    const value = bookBadgeValue(travel, variant, null);
    if (!value) return null;
    const frame = at(markSize(style, value.text, value.sub));
    const el = { ...bookTravelBadge({ id: uid('bd'), frame, variant: variant as BookBadgeVariant, value }), style };
    return dress(el, MARK_ACCENT[variant], style === 'sketch');
  };

  /**
   * How large a mark is set: as wide as its words need. A stamp stacks them in
   * a box with room for its two rules; a tag or a pill sets them in a line
   * after its eyelet or its disc, so its length follows the words.
   */
  const markSize = (style: BookBadgeStyle, text: string, sub: string) => {
    const twoLines = !!text && !!sub && text.length > 14;
    const h = page.pageHeight * (style === 'stamp' ? 0.12 : twoLines ? 0.1 : 0.066);
    const main = text || sub;
    if (style === 'stamp') return { w: Math.max(h * 1.3, h * 0.2 * Math.max(main.length * 1.4, sub.length)), h };
    // Two lines are set smaller than one, so they need less width a letter.
    if (twoLines)
      return { w: Math.min(page.pageWidth * 0.6, h * (1.5 + 0.13 * Math.max(text.length, sub.length * 0.7))), h };
    const chars = main.length * (text ? 1 : 0.85) + (text ? sub.length * 0.5 : 0);
    return { w: Math.min(page.pageWidth * 0.6, h * (1.6 + 0.3 * chars)), h };
  };

  /** One country as a square stamp, or as a card in the proportions of a postcard. */
  const countryEl = (code: string, look: BookCountryLook): BookElement => {
    const side = Math.min(page.pageWidth, page.pageHeight) * 0.36;
    const ratio = look === 'stamp' || look === 'pin' || look === 'sketch' ? 1 : look === 'postcard' ? 1.36 : 1.4;
    const frame = at({ w: side * ratio, h: side });
    const el = {
      ...bookTravelCountries(travel, { id: uid('co'), frame, codes: [code] }),
      look,
      showFlag: look === 'pin' || look === 'postcard',
    };
    return dress(el, COUNTRY_ACCENT[look] ?? 'accent', look === 'sketch');
  };

  /** A country's name in the reader's language, from the same CLDR data Atlas uses. */
  const countryName = (code: string): string => bookCountryName(code, locale, stats);

  return { summaryEl, figureEl, mapEl, countryMapEl, markEl, countryEl, countryName };
}
