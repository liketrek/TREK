import { compareCodeUnits } from '../../common/compare';
import { formatBookDate } from '../book-text';
import {
  MAX_PATH_POINTS,
  MAX_PATH_SEGMENTS,
  MAX_SPREAD_ELEMENTS,
  type BookElement,
  type BookMetric,
  type BookSpread,
} from '../book.schema';
import type { JourneyStats } from '../journey-stats.schema';
import {
  ACCENT,
  badgeEl,
  bleedFrame,
  countriesEl,
  mapEl,
  photo,
  shape,
  statsEl,
  text,
  type NewId,
} from './auto-elements';
import type { AutoEntry, AutoInput } from './auto-types';

/**
 * The pages of a book that are not one entry's: the cover, the list of bare
 * stops, the journey at a glance, the countries and the back cover.
 */

/** What one station row costs (its date, its name and the rule under it), and the heading above the list. */
const STATION_ELEMENTS = 3;
const STATIONS_HEADING = 2;

/**
 * How many stations one page holds: thirteen is where the type gets too
 * tight, and a spread is two of these pages under `MAX_SPREAD_ELEMENTS`.
 */
const ROWS_THE_CAP_ALLOWS = Math.floor((MAX_SPREAD_ELEMENTS - STATIONS_HEADING) / STATION_ELEMENTS / 2);
export const STATIONS_PER_PAGE = Math.min(13, ROWS_THE_CAP_ALLOWS);

/** The span line's printed separator (an em dash), kept as the Studio has always set it. */
const SPAN_JOIN = ' \u2014 ';

export function coverSpread(input: AutoInput, newId: NewId): BookSpread {
  const { page } = input;
  const m = 18;
  const els: BookElement[] = [];
  const light = input.coverPhotoId != null;

  if (input.coverPhotoId != null) {
    els.push(photo(newId, bleedFrame(page, false), input.coverPhotoId, { focalY: 0.42 }));
    // A scrim so the title survives whatever the photo does underneath it, faded rather than a flat panel.
    const scrim = {
      x: -page.bleed,
      y: page.pageHeight * 0.38,
      w: page.pageWidth + page.bleed * 2,
      h: page.pageHeight * 0.62 + page.bleed,
    };
    els.push(shape(newId, scrim, '#000000', { opacity: 0.72, gradient: 'down' }));
  }

  const titleStyle = {
    size: 34,
    weight: 700 as const,
    leading: 1.05,
    tracking: -0.02,
    color: light ? '#ffffff' : '#111111',
    binding: { source: 'journey.title' as const },
  };
  const titleFrame = { x: m, y: page.pageHeight - m - 46, w: page.pageWidth - m * 2, h: 30 };
  els.push(text(newId, titleFrame, input.title, titleStyle));
  if (input.subtitle) {
    const subStyle = {
      size: 12,
      weight: 400 as const,
      color: light ? '#ffffff' : '#444444',
      opacity: light ? 0.85 : 1,
      binding: { source: 'journey.subtitle' as const },
    };
    const subFrame = { x: m, y: page.pageHeight - m - 12, w: page.pageWidth - m * 2, h: 8 };
    els.push(text(newId, subFrame, input.subtitle, subStyle));
  }
  const background = input.coverPhotoId != null ? null : '#f4f2ee';
  return { id: newId('sp'), role: 'cover', background, elements: els, parked: [], entryId: null };
}

/**
 * The stops that had nothing to say, as a list: two columns of date and
 * place, which is what an itinerary looks like in every printed travel book.
 * Consecutive ones only, so the book stays in the order it happened.
 */
export function stationsSpread(entries: AutoEntry[], input: AutoInput, newId: NewId): BookSpread {
  const { page } = input;
  const W = page.pageWidth;
  const H = page.pageHeight;
  const m = 18;
  const els: BookElement[] = [];

  els.push(shape(newId, { x: m, y: m + 12, w: 14, h: 0.5 }, ACCENT));
  const headStyle = { size: 8, weight: 600 as const, tracking: 0.16, color: '#8a8578' };
  els.push(text(newId, { x: m, y: m + 18, w: W - m * 2, h: 8 }, input.stationsLabel.toUpperCase(), headStyle));

  const columns = [entries.slice(0, STATIONS_PER_PAGE), entries.slice(STATIONS_PER_PAGE, STATIONS_PER_PAGE * 2)];
  const top = m + 34;
  const step = Math.min(13, (H - top - m) / Math.max(1, STATIONS_PER_PAGE));
  columns.forEach((column, side) => {
    const x = side * W + m;
    const w = W - m * 2;
    column.forEach((entry, i) => {
      const y = top + i * step;
      const date = formatBookDate(entry.date, input.locale);
      if (date) {
        // Set in small caps, so not the journal's words: a bound element has to hold exactly its source.
        const dateStyle = { size: 7, weight: 600 as const, tracking: 0.1, color: '#a09a8e' };
        els.push(text(newId, { x, y, w: w * 0.32, h: 5 }, date.toUpperCase(), dateStyle));
      }
      const name = entry.title || entry.location || '';
      if (name) {
        const nameStyle = {
          size: 11,
          weight: 600 as const,
          color: '#141414',
          binding: { source: 'entry.title' as const, entryId: entry.id },
        };
        els.push(text(newId, { x: x + w * 0.34, y: y - 1.5, w: w * 0.66, h: 7 }, name, nameStyle));
      }
      // A hairline under each row, the way a printed itinerary rules its lines.
      els.push(shape(newId, { x, y: y + step - 4.5, w, h: 0.15 }, '#ddd8cf'));
    });
  });
  return { id: newId('sp'), role: 'inner', background: '#faf8f4', elements: els, parked: [], entryId: null };
}

/** The stop that ended up furthest from the first one. */
function furthestPoint(stats: JourneyStats) {
  const home = stats.points[0];
  if (!home) return null;
  let best = home;
  let bestD = 0;
  for (const p of stats.points) {
    const d = Math.hypot(p.lat - home.lat, (p.lng - home.lng) * Math.cos((home.lat * Math.PI) / 180));
    if (d > bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/** Metres as the books print them, "1,189 km", in the book's own language. */
function formatKm(metres: number, locale: string): string {
  return `${Math.round(metres / 1000).toLocaleString(locale)} km`;
}

/** Which figures are worth the space: everything the journey actually has, at most six. */
export function summaryMetrics(stats: JourneyStats): BookMetric[] {
  const all: [BookMetric, number][] = [
    ['distance', stats.distance],
    ['days', stats.days],
    ['steps', stats.steps],
    ['photos', stats.photos],
    ['countries', stats.countries.length],
    ['furthest', stats.furthest],
  ];
  return all
    .filter(([, v]) => v > 0)
    .map(([k]) => k)
    .slice(0, 6);
}

/** The furthest point, drawn: two dots, a line and a distance. */
function furthestMarks(
  input: AutoInput,
  stats: JourneyStats,
  newId: NewId,
  at: { x: number; w: number },
): BookElement[] {
  const home = stats.points[0];
  const far = furthestPoint(stats);
  if (!(stats.furthest > 0 && home && far && far !== home)) return [];
  const H = input.page.pageHeight;
  const y = H - 18 - 26;
  const lineW = at.w - 16;
  const rx = at.x;
  const els: BookElement[] = [shape(newId, { x: rx + 8, y, w: lineW, h: 0.3 }, '#cfc9bd')];
  for (const t of [0, 1]) {
    const dot = { x: rx + 8 + lineW * t - 1.4, y: y - 1.25, w: 2.8, h: 2.8 };
    els.push(shape(newId, dot, t === 0 ? '#8a8578' : ACCENT, { shape: 'ellipse' }));
  }
  const chip = { x: rx + 8 + lineW * 0.5 - 17, y: y - 11, w: 34, h: 8 };
  const km = { text: formatKm(stats.furthest, input.locale) };
  els.push(badgeEl(newId, chip, 'distance', km, { style: 'chip', textScale: 0.7 }));
  const label = { size: 6.5, weight: 600 as const, tracking: 0.1, color: '#8a8578' };
  els.push(text(newId, { x: rx + 4, y: y + 4, w: lineW * 0.5, h: 5 }, (home.label || '').toUpperCase(), label));
  const farFrame = { x: rx + 4 + lineW * 0.5, y: y + 4, w: lineW * 0.5 + 4, h: 5 };
  els.push(text(newId, farFrame, (far.label || '').toUpperCase(), { ...label, align: 'right' }));
  return els;
}

/**
 * The journey at a glance: the route drawn on the left, what it came to on the
 * right. Omitted rather than left empty when there is nothing to draw.
 */
export function summarySpread(input: AutoInput, newId: NewId): BookSpread | null {
  const stats = input.stats;
  if (!stats) return null;
  // Something has to be worth printing. One stop is a pin, not a journey.
  if (stats.points.length < 2 && !stats.distance && !stats.days) return null;
  const { page } = input;
  const W = page.pageWidth;
  const H = page.pageHeight;
  const m = 18;
  const els: BookElement[] = [];

  if (stats.points.length >= 2) {
    const path = (input.path ?? []).slice(0, MAX_PATH_SEGMENTS).map((seg) => seg.slice(0, MAX_PATH_POINTS));
    els.push(mapEl(newId, { x: m, y: m, w: W - m * 2, h: H - m * 2 }, stats, { path }));
  }
  const metrics = summaryMetrics(stats);
  const rx = W + m;
  const colW = W - m * 2;
  els.push(shape(newId, { x: rx, y: m + 14, w: colW * 0.16, h: 0.5 }, ACCENT));
  const headStyle = { size: 9, weight: 700 as const, tracking: 0.18, color: '#141414' };
  els.push(text(newId, { x: rx, y: m + 20, w: colW, h: 7 }, input.summaryLabel.toUpperCase(), headStyle));
  if (metrics.length) els.push(statsEl(newId, { x: rx, y: m + 36, w: colW, h: H * 0.42 }, stats, metrics, 'grid'));
  els.push(...furthestMarks(input, stats, newId, { x: rx, w: colW }));
  return { id: newId('sp'), role: 'inner', background: null, elements: els, parked: [], entryId: null };
}

/** Pale outlines on near-black, names above them: the page people photograph. Two countries or more. */
export function countriesSpread(input: AutoInput, names: string[], newId: NewId): BookSpread | null {
  const stats = input.stats;
  if (!stats || stats.countries.length < 2) return null;
  const { page } = input;
  const W = page.pageWidth;
  const H = page.pageHeight;
  const m = 20;
  const rows = stats.countries.length;
  // Tall enough to breathe, but never taller than the page it sits on.
  const height = Math.min(H - m * 2 - 24, Math.max(H * 0.4, rows * 26));
  const ink = '#f2efe9';
  const headStyle = { size: 9, weight: 700 as const, tracking: 0.2, align: 'center' as const, color: ink };
  const headFrame = { x: W + m, y: m + 16, w: W - m * 2, h: 8 };
  const head = text(newId, headFrame, input.countriesLabel.toUpperCase(), headStyle);
  const frame = { x: W + m, y: (H - height) / 2 + 10, w: W - m * 2, h: height };
  const outlines = countriesEl(newId, frame, stats, names, { color: ink, accent: ink });
  return {
    id: newId('sp'),
    role: 'inner',
    background: '#12161d',
    elements: [head, outlines],
    parked: [],
    entryId: null,
  };
}

/** The back cover: quiet on purpose, the last thing a reader sees should be a full stop. */
export function backSpread(input: AutoInput, newId: NewId): BookSpread {
  const { page } = input;
  const m = 18;
  const els: BookElement[] = [];
  const dates = input.entries
    .map((e) => e.date)
    .filter((d): d is string => !!d)
    .sort(compareCodeUnits);
  const first = dates[0];
  const last = dates[dates.length - 1];
  const ends = first && last ? [formatBookDate(first, input.locale), formatBookDate(last, input.locale)] : [];
  const span = ends.filter(Boolean).join(SPAN_JOIN);

  els.push(shape(newId, bleedFrame(page, false), '#141414'));
  const titleStyle = {
    size: 15,
    weight: 600 as const,
    align: 'center' as const,
    color: '#ffffff',
    tracking: -0.01,
    binding: { source: 'journey.title' as const },
  };
  const titleFrame = { x: m, y: page.pageHeight * 0.5 - 16, w: page.pageWidth - m * 2, h: 12 };
  els.push(text(newId, titleFrame, input.title, titleStyle));
  if (span) {
    const spanStyle = { size: 8.5, align: 'center' as const, color: '#ffffff', opacity: 0.55 };
    els.push(text(newId, { x: m, y: page.pageHeight * 0.5, w: page.pageWidth - m * 2, h: 6 }, span, spanStyle));
  }
  // The closing tally, as a figures element: it takes its labels from the Studio's translations.
  if (input.stats) {
    const tally: [BookMetric, number][] = [
      ['days', input.stats.days],
      ['places', input.stats.places],
      ['photos', input.stats.photos],
    ];
    const closing = tally.filter(([, v]) => v > 0).map(([k]) => k);
    if (closing.length) {
      const quiet = { showIcons: false, color: '#ffffff', accent: '#ffffff', opacity: 0.55, textScale: 0.8 };
      const frame = { x: m, y: page.pageHeight * 0.5 + 6, w: page.pageWidth - m * 2, h: 22 };
      els.push(statsEl(newId, frame, input.stats, closing, 'row', quiet));
    }
  }
  return { id: newId('sp'), role: 'back', background: '#141414', elements: els, parked: [], entryId: null };
}
