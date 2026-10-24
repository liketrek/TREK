import { bookDateMarkValue, formatBookCoords } from '../book-text';
import {
  MAX_BOOK_COUNTRIES,
  MAX_COUNTRY_NAME,
  MAX_MAP_POINTS,
  MAX_MAP_POINT_LABEL,
  MAX_TEXT_LENGTH,
  type BookElement,
  type BookFrame,
  type BookMetric,
  type BookPageSetup,
  type BookSpread,
} from '../book.schema';
import type { JourneyStats } from '../journey-stats.schema';
import type { AutoEntry, AutoInput, AutoPhoto } from './auto-types';

/**
 * The parts the auto layout builds its pages from: a text, a picture, a
 * shape, the travel elements and the small marks a printed travel page is
 * made of. The same parts a person reaches for in the Studio, so what the
 * layout produces can be taken apart and rearranged like anything else.
 *
 * The colours are print ink, not app chrome: a book is printed once and read
 * on paper, and the renderer has no theme to ask.
 */

/** Mints an id for an element or a page. */
export type NewId = (prefix: string) => string;

type Of<K extends BookElement['kind']> = Partial<Extract<BookElement, { kind: K }>>;

export const isPortrait = (p: AutoPhoto) => (p.width && p.height ? p.height > p.width * 1.08 : false);
export const isPano = (p: AutoPhoto) => (p.width && p.height ? p.width > p.height * 2 : false);

/** Near-black ink, and the one warm accent the travel marks share. */
const INK = '#1a1a1a';
export const ACCENT = '#c2410c';
/** Near-black with a blue cast, the colour these books lay a page in. */
export const PANEL_INK = '#12161d';
/** Type on a panel, and the paper colour of the quiet pages. */
export const PANEL_TYPE = '#f2efe9';
export const CREAM = '#faf8f4';

export function text(newId: NewId, frame: BookFrame, value: string, opts: Of<'text'> = {}): BookElement {
  return {
    id: newId('t'),
    kind: 'text',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    text: value.slice(0, MAX_TEXT_LENGTH),
    font: 'sans',
    size: 11,
    weight: 400,
    italic: false,
    align: 'left',
    leading: 1.45,
    tracking: 0,
    color: INK,
    binding: null,
    overridden: false,
    ...opts,
  } as BookElement;
}

/**
 * A picture, or the place one goes. `photoId` null is an empty frame, which
 * the renderer draws as an outline and which takes a photo by drag.
 */
export function photo(newId: NewId, frame: BookFrame, photoId: number | null, opts: Of<'photo'> = {}): BookElement {
  return {
    id: newId('p'),
    kind: 'photo',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    photoId,
    fit: 'cover',
    focalX: 0.5,
    focalY: 0.5,
    radius: 0,
    filter: 'none',
    mask: null,
    frameStyle: 'none',
    ...opts,
  } as BookElement;
}

export function shape(newId: NewId, frame: BookFrame, fill: string | null, opts: Of<'shape'> = {}): BookElement {
  return {
    id: newId('s'),
    kind: 'shape',
    frame,
    rotation: 0,
    opacity: 1,
    locked: false,
    shape: 'rect',
    fill,
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    radius: 0,
    ...opts,
  } as BookElement;
}

/** What every travel element the layout places starts from: ink, not the app's orange. */
const travelBase = {
  rotation: 0,
  opacity: 1,
  locked: false,
  font: 'sans' as const,
  color: INK,
  accent: INK,
  textScale: 1,
  stale: false,
};

/** The figures a stats element carries, keyed by metric. */
export function statsValues(stats: JourneyStats): Record<BookMetric, number> {
  return {
    distance: stats.distance,
    days: stats.days,
    steps: stats.steps,
    photos: stats.photos,
    countries: stats.countries.length,
    places: stats.places,
    furthest: stats.furthest,
  };
}

export function statsEl(
  newId: NewId,
  frame: BookFrame,
  stats: JourneyStats,
  metrics: BookMetric[],
  layout: 'grid' | 'row' | 'column' = 'grid',
  opts: Of<'stats'> = {},
): BookElement {
  return {
    ...travelBase,
    id: newId('st'),
    kind: 'stats',
    frame,
    metrics,
    layout,
    showIcons: true,
    units: 'metric',
    values: statsValues(stats),
    ...opts,
  } as BookElement;
}

export function mapEl(newId: NewId, frame: BookFrame, stats: JourneyStats, opts: Of<'map'> = {}): BookElement {
  const points = stats.points.slice(0, MAX_MAP_POINTS).map((pt) => ({
    lat: pt.lat,
    lng: pt.lng,
    label: pt.label.slice(0, MAX_MAP_POINT_LABEL),
    photoId: pt.photoId ?? null,
  }));
  return {
    ...travelBase,
    id: newId('mp'),
    kind: 'map',
    frame,
    style: 'minimal',
    showLand: true,
    showRoute: true,
    showPins: true,
    showLabels: false,
    // The drawn line: the contract stays plain so old books do not change, and new books look like a book.
    routeStyle: 'drawn',
    routeArc: 'bow',
    routeDash: 'arcs',
    pinStyle: 'photo',
    countries: stats.countries.slice(0, MAX_BOOK_COUNTRIES).map((c) => c.code),
    points,
    path: [],
    roads: [],
    fitPadding: 0.5,
    fitToCountries: true,
    clip: 'rect',
    ...opts,
  } as BookElement;
}

export function countriesEl(
  newId: NewId,
  frame: BookFrame,
  stats: JourneyStats,
  names: string[],
  opts: Of<'countries'> = {},
): BookElement {
  return {
    ...travelBase,
    id: newId('co'),
    kind: 'countries',
    frame,
    codes: stats.countries.slice(0, MAX_BOOK_COUNTRIES).map((c) => c.code),
    names: names.slice(0, MAX_BOOK_COUNTRIES).map((n) => n.slice(0, MAX_COUNTRY_NAME)),
    layout: 'list',
    showOutline: true,
    showFlag: false,
    showName: true,
    align: 'center',
    ...opts,
  } as BookElement;
}

type AutoBadgeVariant = 'flag' | 'date' | 'day' | 'coords' | 'country' | 'distance';

export function badgeEl(
  newId: NewId,
  frame: BookFrame,
  variant: AutoBadgeVariant,
  value: { text?: string; sub?: string; code?: string | null },
  opts: Of<'badge'> = {},
): BookElement {
  return {
    ...travelBase,
    id: newId('bd'),
    kind: 'badge',
    frame,
    variant,
    text: value.text ?? '',
    sub: value.sub ?? '',
    code: value.code ?? null,
    style: 'plain',
    // Built by hand rather than parsed, so the contract's defaults do not apply.
    autoColor: true,
    showIcon: true,
    showLabel: true,
    autoIconColor: true,
    iconColor: INK,
    ...opts,
  } as BookElement;
}

/** A country's flag with its name beside it, the frame cut to the words. */
export function flagRow(newId: NewId, frame: BookFrame, code: string | null, name: string): BookElement | null {
  if (!code && !name) return null;
  const cut = { ...frame, w: Math.min(frame.w, 14 + name.length * 1.7) };
  return badgeEl(newId, cut, 'flag', { text: name.toUpperCase(), code }, { style: 'plain', textScale: 0.85 });
}

/** Where on earth this is, set small under the name. */
export function coordsMark(
  newId: NewId,
  frame: BookFrame,
  lat: number | null | undefined,
  lng: number | null | undefined,
): BookElement | null {
  if (lat == null || lng == null) return null;
  return badgeEl(newId, frame, 'coords', { text: formatBookCoords(lat, lng) }, { style: 'plain', textScale: 0.7 });
}

/**
 * The "DAY 5" chip, its words made by `bookDayText`. Small, solid, and the
 * only filled shape on most pages.
 */
export function dayChip(newId: NewId, frame: BookFrame, text: string) {
  return badgeEl(newId, frame, 'day', { text }, { style: 'chip', textScale: 0.75 });
}

/** A rule along the foot with a dot showing how far into the journey this is. */
export function progressRule(
  newId: NewId,
  at: { x: number; y: number; w: number },
  day: number | null | undefined,
  total: number | null | undefined,
): BookElement[] {
  if (!day || !total || total < 2) return [];
  const { x, y, w } = at;
  const t = Math.min(1, Math.max(0, (day - 1) / (total - 1)));
  const dot = 2.2;
  const dotFrame = { x: x + w * t - dot / 2, y: y - dot / 2 + 0.15, w: dot, h: dot };
  return [shape(newId, { x, y, w, h: 0.3 }, '#cfc9bd'), shape(newId, dotFrame, ACCENT, { shape: 'ellipse' })];
}

/** The country's outline, printed pale behind everything else. */
export function countryWatermark(newId: NewId, frame: BookFrame, code: string | null | undefined): BookElement | null {
  if (!code) return null;
  return {
    ...travelBase,
    id: newId('wm'),
    kind: 'countries',
    frame,
    codes: [code],
    names: [''],
    layout: 'column',
    showOutline: true,
    showFlag: false,
    showName: false,
    align: 'center',
    opacity: 0.1,
  } as BookElement;
}

/** The stop on a small map of its own, the way an entry page opens: the country whole with a dot in it. */
export function placeMap(
  newId: NewId,
  frame: BookFrame,
  entry: AutoEntry,
  stats: JourneyStats | null,
): BookElement | null {
  if (entry.lat == null || entry.lng == null) return null;
  return {
    ...travelBase,
    id: newId('mp'),
    kind: 'map',
    frame,
    points: [{ lat: entry.lat, lng: entry.lng, label: entry.location ?? '', photoId: null }],
    countries: entry.country ? [entry.country] : (stats?.countries.map((c) => c.code) ?? []),
    style: 'minimal',
    source: 'vector',
    tileUrl: '',
    attribution: '',
    zoom: 5,
    // The plain treatment: one dot on a country outline, a bowed casing would be decoration.
    routeStyle: 'plain',
    routeArc: 'straight',
    routeDash: 'solid',
    pinStyle: 'dot',
    path: [],
    roads: [],
    fitPadding: 0.5,
    fitToCountries: true,
    clip: 'rect',
    showLand: true,
    showRoute: false,
    showPins: true,
    showLabels: false,
    // weight and tripId are left to the schema's defaults when the book is saved, as the client's layout always did;
    // the parity fixture pins this output byte for byte.
  } as unknown as BookElement;
}

/** The day of the month as a numeral with its month beneath: a mark rather than a line of information. */
export function dateMark(newId: NewId, iso: string | null, locale: string, frame: BookFrame): BookElement | null {
  const value = bookDateMarkValue(iso, locale);
  return value ? badgeEl(newId, frame, 'date', value, { style: 'stacked' }) : null;
}

/** A full-bleed frame: out past the trim on every side the page is cut on. */
export function bleedFrame(page: BookPageSetup, spread: boolean): BookFrame {
  const w = spread ? page.pageWidth * 2 : page.pageWidth;
  return { x: -page.bleed, y: -page.bleed, w: w + page.bleed * 2, h: page.pageHeight + page.bleed * 2 };
}

/** The country a stop is in, named in the book's language. */
export function countryOf(entry: AutoEntry, input: AutoInput): string {
  if (!entry.country) return '';
  const named = input.stats?.countries.find((c) => c.code === entry.country);
  try {
    return new Intl.DisplayNames([input.locale], { type: 'region' }).of(entry.country) ?? named?.name ?? '';
  } catch {
    return named?.name ?? '';
  }
}

/**
 * Country names in the book's language: the API answers in English, and
 * `Intl.DisplayNames` is the same CLDR data Atlas uses for regions.
 */
export function countryNames(input: AutoInput): string[] {
  const codes = input.stats?.countries ?? [];
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames([input.locale], { type: 'region' });
  } catch {
    display = null;
  }
  return codes.map((c) => display?.of(c.code.toUpperCase()) || c.name || c.code.toUpperCase());
}

/** An inner spread made from one entry. */
export function sheet(newId: NewId, els: BookElement[], entry: AutoEntry, background: string): BookSpread {
  return { id: newId('sp'), role: 'inner', background, elements: els, parked: [], entryId: entry.id };
}
