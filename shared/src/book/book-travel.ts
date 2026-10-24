import { statsValues } from './auto/auto-elements';
import type { AutoEntry } from './auto/auto-types';
import { BOOK_MAP_SOURCES } from './book-map-sources';
import { bookDateMarkValue, formatBookCoords } from './book-text';
import {
  MAX_BOOK_COUNTRIES,
  MAX_COUNTRY_NAME,
  MAX_MAP_POINTS,
  MAX_MAP_POINT_LABEL,
  MAX_PATH_POINTS,
  MAX_PATH_SEGMENTS,
  type BookBadgeElement,
  type BookCountriesElement,
  type BookElement,
  type BookFrame,
  type BookListElement,
  type BookMapElement,
  type BookMetric,
  type BookPageSetup,
  type BookStatsElement,
} from './book.schema';
import type { JourneyStats, JourneyStatsPoint } from './journey-stats.schema';

/**
 * The journey's own figures as things on a page, and keeping them in step.
 *
 * A travel element carries its own values (see the note in book.schema.ts),
 * which is what lets the print renderer work without a network. The cost is
 * that a journey edited afterwards leaves the page holding yesterday's
 * numbers: `isStale` says so and `refreshPatch` brings them up to date, never
 * behind anyone's back. Moved here from the Studio
 * (client/src/components/Studio/travelRefresh.ts) together with element
 * factories that build what the Studio's Travel panel places, so the book
 * engine's `add` and `refresh_travel` mean what the panel means.
 */

/** The metrics a stats element can show, resolved from live figures. */
export function liveMetrics(stats: JourneyStats): Record<BookMetric, number> {
  return statsValues(stats);
}

/**
 * The stops a map of this scope should draw: `null` is the journey entire, a
 * trip id narrows it to that trip's own stops, so two trips of one journey are
 * never joined by a leg nobody travelled.
 */
export function routeFor(stats: JourneyStats, tripId: number | null): JourneyStats['points'] {
  if (tripId == null) return stats.points;
  return stats.points.filter((p) => p.tripId === tripId);
}

const sameEnds = (a: readonly { lat: number; lng: number }[], b: readonly { lat: number; lng: number }[]) => {
  const [a0, b0, a1, b1] = [a[0], b[0], a[a.length - 1], b[b.length - 1]];
  if (!a0 || !b0 || !a1 || !b1) return a.length === b.length;
  return a0.lat === b0.lat && a0.lng === b0.lng && a1.lat === b1.lat && a1.lng === b1.lng;
};

/**
 * Whether an element's stored values still match the journey. Compared, not
 * tracked with a timestamp, and only the figures the element shows: a page of
 * distance and days does not go stale because a photograph was added. A map
 * compares its route by shape (length and ends) and its stop photographs in
 * full, since a photo added to the middle of a journey is the ordinary case.
 */
export function isStale(el: BookElement, stats: JourneyStats | null): boolean {
  if (!stats) return false;
  if (el.kind === 'stats') {
    const live = liveMetrics(stats);
    return el.metrics.some((m) => (el.values[m] ?? 0) !== live[m]);
  }
  if (el.kind === 'countries') return el.codes.join(',') !== stats.countries.map((c) => c.code).join(',');
  if (el.kind !== 'map') return false;
  const live = routeFor(stats, el.tripId);
  if (el.points.length !== live.length) return true;
  if (!el.points.length) return false;
  if (!sameEnds(el.points, live)) return true;
  const shown = el.points.map((p) => p.photoId ?? 0).join(',');
  const now = live.map((p) => p.photoId ?? 0).join(',');
  return shown !== now;
}

/** The countries a map outlines: the whole journey's, or only those its own stops fall in. */
function mapCountries(stats: JourneyStats, whole: boolean, route: readonly JourneyStatsPoint[]): string[] {
  if (whole) return stats.countries.map((c) => c.code);
  return [...new Set(route.map((p) => p.country).filter((c): c is string => !!c))];
}

const mapPoints = (route: readonly JourneyStatsPoint[]) =>
  route.map((p) => ({ lat: p.lat, lng: p.lng, label: p.label, photoId: p.photoId ?? null }));

/**
 * The patch that takes an element's values from the journey as it stands now,
 * or null for an element that carries no journey figures. A country the
 * element already had keeps the name it was given (the book's language); a
 * new one takes the API's until someone places the element again.
 */
export function refreshPatch(el: BookElement, stats: JourneyStats): Partial<BookElement> | null {
  if (el.kind === 'stats') return { stale: false, values: liveMetrics(stats) };
  if (el.kind === 'countries') {
    const codes = stats.countries.map((c) => c.code);
    const names = codes.map((code, i) => {
      const had = el.codes.indexOf(code);
      return had >= 0 ? (el.names[had] ?? code) : (stats.countries[i]?.name ?? code);
    });
    return { stale: false, codes, names };
  }
  if (el.kind === 'map') {
    const live = routeFor(stats, el.tripId);
    return { stale: false, countries: mapCountries(stats, el.tripId == null, live), points: mapPoints(live) };
  }
  return null;
}

/*
 * ── Factories ───────────────────────────────────────────────────────────
 *
 * Each builds the finished element the Travel panel would place, with this
 * journey's values frozen into it, at the size the panel gives it. The caller
 * passes the frame (the engine centres it on a page) and the id.
 */

/** What the factories know about the journey, the words already in the book's language. */
export interface BookTravelLabels {
  /** The day mark's words, `{day}` standing where the number goes (`bookDayText`). */
  day: string;
  stations: string;
  summary: string;
  countries: string;
  distance: string;
  pros: string;
  cons: string;
}

export interface BookTravelContext {
  locale: string;
  labels: BookTravelLabels;
  stats: JourneyStats | null;
  /** The recorded way, already thinned with `bookPath`. */
  path: [number, number][][];
  entries: readonly AutoEntry[];
}

/** The panel's sizes, in millimetres of the page each kind lands on. */
export function bookTravelSize(
  kind: 'map' | 'stats' | 'countries' | 'badge' | 'list',
  page: BookPageSetup,
  detail: { variant?: BookBadgeElement['variant']; rows?: number } = {},
): { w: number; h: number } {
  const side = Math.min(page.pageWidth, page.pageHeight) * 0.72;
  if (kind === 'map') return { w: side, h: side * 0.78 };
  if (kind === 'stats') return { w: page.pageWidth * 0.22, h: page.pageHeight * 0.13 };
  if (kind === 'countries') return { w: page.pageWidth * 0.34, h: 34 };
  if (kind === 'list') {
    const rows = Math.max(1, detail.rows ?? 1);
    return { w: page.pageWidth * 0.72, h: Math.min(page.pageHeight * 0.6, 6 * (0.86 + 1.7 * rows)) };
  }
  const [fw, fh] = MARK_SIZE[detail.variant ?? 'date'] ?? [0.24, 0.08];
  return { w: page.pageWidth * fw, h: page.pageHeight * fh };
}

/** A mark is placed at the size that suits what it holds, as fractions of the page. */
const MARK_SIZE: Partial<Record<BookBadgeElement['variant'], [number, number]>> = {
  flag: [0.25, 0.062],
  date: [0.16, 0.14],
  day: [0.17, 0.062],
  coords: [0.36, 0.05],
  country: [0.22, 0.078],
  distance: [0.26, 0.066],
  mood: [0.22, 0.062],
  weather: [0.22, 0.062],
};

/** What every travel element starts from, as the panel places it. */
const BASE = {
  rotation: 0,
  opacity: 1,
  locked: false,
  font: 'sans' as const,
  color: '#1a1a1a',
  accent: '#111111',
  textScale: 1,
  weight: 700 as const,
  stale: false,
};

/** A country's name in the book's language, from the same CLDR data Atlas uses. */
export function bookCountryName(code: string, locale: string, stats: JourneyStats | null): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase());
    if (name) return name.slice(0, MAX_COUNTRY_NAME);
  } catch {
    // An unknown locale falls through to the API's own name.
  }
  const known = stats?.countries.find((c) => c.code === code)?.name;
  return (known || code.toUpperCase()).slice(0, MAX_COUNTRY_NAME);
}

/** Where a map is of: the whole journey or one trip, what a stored map's `tripId` can say. */
export type BookMapScope = 'journey' | { tripId: number };

/** A map of the journey or of a trip, drawn the way a new map is drawn. */
export function bookTravelMap(
  ctx: BookTravelContext,
  stats: JourneyStats,
  input: { id: string; frame: BookFrame; scope: BookMapScope; source?: 'vector' | 'relief' | 'satellite' },
): BookMapElement {
  const tripId = input.scope === 'journey' ? null : input.scope.tripId;
  const route = routeFor(stats, tripId);
  const imagery = input.source === 'relief' || input.source === 'satellite' ? BOOK_MAP_SOURCES[input.source] : null;
  const whole = input.scope === 'journey';
  const countries = mapCountries(stats, whole, route).slice(0, MAX_BOOK_COUNTRIES);
  const path = whole ? ctx.path.slice(0, MAX_PATH_SEGMENTS) : [];
  const points = mapPoints(route.slice(0, MAX_MAP_POINTS)).map((p) => ({
    ...p,
    label: p.label.slice(0, MAX_MAP_POINT_LABEL),
  }));
  return {
    ...BASE,
    id: input.id,
    kind: 'map',
    frame: input.frame,
    source: imagery ? 'tiles' : 'vector',
    tileUrl: imagery?.url ?? '',
    attribution: imagery?.attribution ?? '',
    zoom: null,
    style: 'minimal',
    // White over a photograph, ink on paper: the accent is the line.
    accent: imagery ? '#ffffff' : BASE.accent,
    showLand: true,
    showRoute: true,
    showPins: true,
    showLabels: false,
    routeStyle: 'drawn',
    routeArc: 'bow',
    routeDash: 'arcs',
    pinStyle: 'photo',
    countries,
    points,
    path: path.map((seg) => seg.slice(0, MAX_PATH_POINTS)),
    roads: [],
    fitPadding: 0.5,
    fitToCountries: true,
    clip: 'rect',
    tripId,
  };
}

/** Figures, one or a panel of them, with this journey's values. */
export function bookTravelStats(
  stats: JourneyStats,
  input: { id: string; frame: BookFrame; metrics: readonly BookMetric[] },
): BookStatsElement {
  return {
    ...BASE,
    id: input.id,
    kind: 'stats',
    frame: input.frame,
    metrics: [...input.metrics],
    layout: 'grid',
    showIcons: true,
    units: 'metric',
    values: liveMetrics(stats),
  };
}

/** Country outlines with their names in the book's language; the journey's countries unless codes are given. */
export function bookTravelCountries(
  ctx: BookTravelContext,
  input: { id: string; frame: BookFrame; codes?: readonly string[] },
): BookCountriesElement {
  const codes = (input.codes ?? ctx.stats?.countries.map((c) => c.code) ?? []).slice(0, MAX_BOOK_COUNTRIES);
  return {
    ...BASE,
    id: input.id,
    kind: 'countries',
    frame: input.frame,
    codes: codes.map((c) => c.toUpperCase()),
    names: codes.map((c) => bookCountryName(c, ctx.locale, ctx.stats)),
    layout: 'list',
    showOutline: true,
    showFlag: false,
    showName: true,
    align: 'center',
  };
}

/** Where the number goes in a day mark's label. */
const DAY_SLOT = '{day}';

/**
 * A day mark's words. The label says where the number goes with `{day}`, so a
 * language that puts it first or inside the word reads as it should ("3日目",
 * "第3天"); a label without one (a word stored before the placeholder, or a
 * caller's own) is followed by the number, the way it always was ("DAY 3").
 */
export function bookDayText(label: string, day: number): string {
  // `replace`, not `replaceAll`: the client compiles this file against an ES2020 lib. A label holds the slot once.
  return label.includes(DAY_SLOT) ? label.replace(DAY_SLOT, String(day)) : `${label} ${day}`;
}

/**
 * A flag or a country mark's words for one country, the one rule for the
 * engine's value, the Travel panel's mark and a template's country mark. A
 * country mark draws the outline beside the name, so the name is its words
 * (`text`); a flag mark sets the name in small capitals beside the flag (`sub`).
 */
export function bookCountryMark(
  variant: 'flag' | 'country',
  code: string,
  name: string,
): { text: string; sub: string; code: string } {
  return variant === 'country' ? { text: name, sub: '', code } : { text: '', sub: name, code };
}

/** The words a mark carries, resolved from an entry or the journey; null when nothing says what it would show. */
export function bookBadgeValue(
  ctx: BookTravelContext,
  variant: BookBadgeElement['variant'],
  entry: AutoEntry | null,
): { text: string; sub: string; code: string | null } | null {
  const stats = ctx.stats;
  const point = stats?.points[0];
  const lat = entry ? entry.lat : point?.lat;
  const lng = entry ? entry.lng : point?.lng;
  const country = entry ? (entry.country ?? null) : (stats?.countries[0]?.code ?? null);
  const date = entry ? entry.date : (stats?.start ?? null);
  switch (variant) {
    case 'day': {
      const day = entry ? entry.dayNumber : 1;
      return day ? { text: bookDayText(ctx.labels.day, day), sub: '', code: null } : null;
    }
    case 'date': {
      const mark = bookDateMarkValue(date, ctx.locale);
      return mark ? { ...mark, code: null } : null;
    }
    case 'coords': {
      if (lat == null || lng == null) return null;
      const sub = entry ? (entry.location ?? '') : (point?.label ?? '');
      return { text: formatBookCoords(lat, lng), sub, code: null };
    }
    case 'flag':
    case 'country':
      return country ? bookCountryMark(variant, country, bookCountryName(country, ctx.locale, stats)) : null;
    case 'distance':
      if (!stats) return null;
      return { text: formatDistance(stats.distance, ctx.locale), sub: ctx.labels.distance, code: null };
    default:
      return null;
  }
}

/** Kilometres, grouped for the reader's locale. */
function formatDistance(metres: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(metres / 1000)} km`;
}

/** The style the panel gives each mark. */
const MARK_STYLE: Partial<Record<BookBadgeElement['variant'], BookBadgeElement['style']>> = {
  date: 'stacked',
  day: 'chip',
  distance: 'outline',
};

/** A small mark: a flag, a date numeral, a day chip, coordinates, a distance, a mood or the weather. */
export function bookTravelBadge(input: {
  id: string;
  frame: BookFrame;
  variant: BookBadgeElement['variant'];
  value: { text: string; sub: string; code: string | null };
}): BookBadgeElement {
  return {
    ...BASE,
    id: input.id,
    kind: 'badge',
    frame: input.frame,
    variant: input.variant,
    text: input.value.text.slice(0, 200),
    sub: input.value.sub.slice(0, 200),
    code: input.value.code,
    style: MARK_STYLE[input.variant] ?? 'plain',
    autoColor: true,
    showIcon: true,
    showLabel: true,
    autoIconColor: true,
    iconColor: '#111111',
  };
}

/** An entry's pros and cons as two marked columns, headed in the book's language. */
export function bookTravelList(
  labels: { pros: string; cons: string },
  input: { id: string; frame: BookFrame; items: BookListElement['items'] },
): BookListElement {
  return {
    ...BASE,
    id: input.id,
    kind: 'list',
    frame: input.frame,
    items: input.items.slice(0, 60),
    layout: 'columns',
    showMarks: true,
    proLabel: labels.pros.slice(0, 80),
    conLabel: labels.cons.slice(0, 80),
  };
}

/** The lines of an entry's pros and cons, pros first. */
export function bookEntryListItems(entry: AutoEntry): BookListElement['items'] {
  const pros = (entry.pros ?? []).map((text) => ({ text: text.slice(0, 400), tone: 'pro' as const }));
  const cons = (entry.cons ?? []).map((text) => ({ text: text.slice(0, 400), tone: 'con' as const }));
  return [...pros, ...cons];
}
