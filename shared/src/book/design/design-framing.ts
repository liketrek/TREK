import { compareCodeUnits } from '../../common/compare';
import { summaryMetrics } from '../auto/auto-book-spreads';
import type { AutoEntry, AutoPhoto } from '../auto/auto-types';
import { BOOK_COVER_TEMPLATES, applyBookTemplate } from '../book-layouts';
import { formatBookDate } from '../book-text';
import { bookTravelCountries, bookTravelMap, bookTravelStats } from '../book-travel';
import type { BookElement, BookMetric, BookSpread, BookTextElement } from '../book.schema';
import type { JourneyStats } from '../journey-stats.schema';
import {
  bleedPage,
  frameOf,
  headingEl,
  liveBox,
  photoEl,
  ruleEl,
  scaled,
  scrimEl,
  textEl,
  type ComposeCtx,
} from './design-compose';
import { paperBackground } from './design-style';

/**
 * The pages around the chapters: the cover, the title page, the journey at a
 * glance, its countries, the closing totals, the list of bare stops and the
 * back cover. Words the journey owns are bound to it (the title, the
 * subtitle, an entry's date and name) unless the person gave their own.
 */

const single = (c: ComposeCtx, role: BookSpread['role'], elements: BookElement[]): BookSpread => ({
  id: c.newId('sp'),
  role,
  background: paperBackground(c.look),
  elements,
  parked: [],
  entryId: null,
});

/** A title the journey owns, bound to it, or the person's own words, not bound. */
function titleWords(own: string | undefined, journey: string): { words: string; bound: boolean } {
  return own !== undefined && own.trim() ? { words: own, bound: false } : { words: journey, bound: true };
}

interface CoverWords {
  title: string;
  subtitle: string | null;
  ownTitle?: string;
  ownSubtitle?: string;
}

/**
 * The cover: a photo to the bleed with the title on a scrim at its foot, or
 * the title alone on the paper. The title starts at the display size and is
 * set smaller only as far as its box needs.
 */
export function composeCover(c: ComposeCtx, words: CoverWords, photo: AutoPhoto | null): BookSpread {
  const { pageWidth: PW, pageHeight: H, bleed: b, margin: m } = c.grid;
  const els: BookElement[] = [];
  const title = titleWords(words.ownTitle, words.title);
  const sub = titleWords(words.ownSubtitle, words.subtitle ?? '');
  const top = H * 0.6;
  if (photo) {
    els.push(photoEl(c, photo, bleedPage(c, 'single'), { bleed: { side: 'single' } }));
    els.push(scrimEl(c, frameOf(-b, top, PW + b * 2, H - top + b)));
  }
  const colour = photo ? c.look.onScrim : c.look.ink;
  const box = photo ? frameOf(m, top + m * 0.6, PW - m * 2, H - top - m * 1.6) : liveBox(c, 'single');
  const y = photo ? box.y : box.y + box.h * 0.35;
  if (title.words.trim()) {
    const binding = title.bound ? { source: 'journey.title' as const } : null;
    const size = c.look.sizes.display;
    const head = headingEl(c, { x: box.x, y, w: box.w }, title.words, box.h * 0.6, { binding, color: colour, size });
    els.push(head);
    if (sub.words.trim()) {
      const subBinding = sub.bound ? { source: 'journey.subtitle' as const } : null;
      const at = { x: box.x, y: head.frame.y + head.frame.h + 3, w: box.w };
      els.push(textEl(c, at, sub.words, 'sub', { binding: subBinding, color: colour }));
    }
  }
  return withCoverTemplate(c, single(c, 'cover', els));
}

/**
 * The cover laid out by the cover layout the person asked for (`cover.template`),
 * its photo and its words carried over as the Templates panel carries them. The
 * words keep the book's typeface and take its ink; the repair pass puts a scrim
 * or the light ink under any that land on a busy photo. Ids come from the
 * design's own counter, so the same journey designs the same cover.
 */
function withCoverTemplate(c: ComposeCtx, cover: BookSpread): BookSpread {
  const wanted = c.directives.cover?.template;
  const tpl = wanted ? BOOK_COVER_TEMPLATES.find((t) => t.id === wanted) : undefined;
  if (!tpl) return cover;
  const laid = applyBookTemplate(cover, tpl, c.page);
  const elements = laid.elements.map((e): BookElement => {
    if (e.kind === 'text') return { ...e, id: c.newId('t'), color: c.look.ink };
    return { ...e, id: c.newId(e.kind.charAt(0)) };
  });
  return { ...laid, elements, parked: [] };
}

/** The dates a journey ran, as two lines (the first day and the last), or none. */
function spanLines(entries: readonly AutoEntry[], locale: string): string[] {
  const dated = entries.map((e) => e.date).filter((d): d is string => !!d);
  const dates = [...dated].sort(compareCodeUnits);
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (!first || !last) return [];
  const out = [formatBookDate(first, locale)];
  if (last !== first) out.push(formatBookDate(last, locale));
  return out.filter(Boolean);
}

/** Lines of small text stacked from `y`, each under the one before. */
function stack(c: ComposeCtx, lines: readonly string[], at: { x: number; y: number; w: number }): BookTextElement[] {
  const out: BookTextElement[] = [];
  let y = at.y;
  for (const line of lines) {
    const el = textEl(c, { x: at.x, y, w: at.w }, line, 'meta', { align: 'center' });
    out.push(el);
    y += el.frame.h + 1.5;
  }
  return out;
}

/** The title page an editorial or journal book opens on: the title, the subtitle and when it was. */
export function composeTitlePage(c: ComposeCtx, words: CoverWords, entries: readonly AutoEntry[]): BookSpread {
  const box = liveBox(c, 'single');
  const title = titleWords(words.ownTitle, words.title);
  const els: BookElement[] = [];
  if (!title.words.trim()) return single(c, 'first', els);
  const binding = title.bound ? { source: 'journey.title' as const } : null;
  const at = { x: box.x, y: box.y + box.h * 0.38, w: box.w };
  const head = headingEl(c, at, title.words, box.h * 0.3, { binding, align: 'center' });
  els.push(head);
  const lines = spanLines(entries, c.locale);
  els.push(...stack(c, lines, { x: box.x, y: head.frame.y + head.frame.h + 4, w: box.w }));
  return single(c, 'first', els);
}

/** The figures worth printing: the ones asked for, else the Auto layout's (all the journey has, at most six). */
function metricsOf(c: ComposeCtx, stats: JourneyStats): BookMetric[] {
  const asked = c.directives.travel?.metrics;
  return asked ? [...asked] : summaryMetrics(stats);
}

/** A label over a page: small, in the ink, with a rule in the accent above it. */
function label(c: ComposeCtx, words: string, side: 'left' | 'right'): { els: BookElement[]; bottom: number } {
  const box = liveBox(c, side);
  const head = textEl(c, { x: box.x, y: box.y + 4, w: box.w }, words, 'sub');
  return { els: [ruleEl(c, box.x, box.y), head], bottom: head.frame.y + head.frame.h + scaled(c, 6) };
}

/** The route drawn and what it came to: the map on one page, the figures on the other. */
export function composeSummary(
  c: ComposeCtx,
  stats: JourneyStats,
  words: string,
  mapSide: 'left' | 'right',
): BookElement[] {
  const textSide = mapSide === 'left' ? 'right' : 'left';
  const els: BookElement[] = [];
  const map = bookTravelMap(c.travel, stats, { id: c.newId('mp'), frame: liveBox(c, mapSide), scope: 'journey' });
  els.push({ ...map, style: c.look.mapStyle, font: c.look.heading, color: c.look.ink, accent: c.look.accent });
  const head = label(c, words, textSide);
  els.push(...head.els);
  const metrics = metricsOf(c, stats);
  if (metrics.length) {
    const box = liveBox(c, textSide);
    const frame = frameOf(box.x, head.bottom, box.w, Math.min(box.h * 0.6, box.y + box.h - head.bottom));
    const figures = bookTravelStats(stats, { id: c.newId('st'), frame, metrics });
    els.push({ ...figures, font: c.look.heading, color: c.look.ink, accent: c.look.accent });
  }
  return els;
}

/** The countries, outlined and named in the book's language, beside their label. */
export function composeCountries(c: ComposeCtx, words: string): BookElement[] {
  const head = label(c, words, 'left');
  const box = liveBox(c, 'right');
  const countries = bookTravelCountries(c.travel, { id: c.newId('co'), frame: box });
  return [...head.els, { ...countries, font: c.look.heading, color: c.look.ink, accent: c.look.accent }];
}

/**
 * The stops nobody wrote about, as a list: the date and the name of each, a
 * column per page, in the order they happened. Answers how many it placed;
 * the rest go on the next stations spread.
 */
export function composeStations(
  c: ComposeCtx,
  entries: readonly AutoEntry[],
  words: string,
): { elements: BookElement[]; placed: number } {
  const head = label(c, words, 'left');
  const els: BookElement[] = [...head.els];
  let placed = 0;
  for (const side of ['left', 'right'] as const) {
    const box = liveBox(c, side);
    let y = side === 'left' ? head.bottom : box.y;
    while (placed < entries.length && els.length + 2 <= STATION_ELEMENT_CAP) {
      const row = stationRow(c, entries[placed] as AutoEntry, { x: box.x, y, w: box.w });
      if (row.bottom > box.y + box.h) break;
      els.push(...row.els);
      y = row.bottom + scaled(c, 4);
      placed++;
    }
  }
  return { elements: els, placed };
}

/** Elements a stations spread may hold: two a stop, under the 90 a spread may hold. */
const STATION_ELEMENT_CAP = 88;

/** One stop of the list: its date over its name, both bound to the entry. */
function stationRow(
  c: ComposeCtx,
  entry: AutoEntry,
  at: { x: number; y: number; w: number },
): { els: BookElement[]; bottom: number } {
  const els: BookElement[] = [];
  let y = at.y;
  if (entry.date) {
    const binding = { source: 'entry.date' as const, entryId: entry.id, value: entry.date };
    const date = textEl(c, { ...at, y }, formatBookDate(entry.date, c.locale), 'meta', { binding });
    els.push(date);
    y += date.frame.h + 1;
  }
  const name = entry.title || entry.location || '';
  if (name) {
    const line = textEl(c, { ...at, y }, name, 'body', { binding: { source: 'entry.title', entryId: entry.id } });
    els.push(line);
    y += line.frame.h;
  }
  return { els, bottom: y };
}

/** About how many stops one stations spread holds, for the page budget. */
export function stationsPerSpread(c: ComposeCtx): number {
  const box = liveBox(c, 'left');
  const row = textEl(c, box, 'May', 'meta').frame.h + 1 + textEl(c, box, 'Stop', 'body').frame.h + scaled(c, 4);
  return Math.max(2, Math.floor((box.h * 2 - scaled(c, 16)) / row));
}

/** The back cover: the title and when it was, small and centred, a full stop. */
export function composeBack(c: ComposeCtx, words: CoverWords, entries: readonly AutoEntry[]): BookSpread {
  const box = liveBox(c, 'single');
  const title = titleWords(words.ownTitle, words.title);
  const els: BookElement[] = [];
  if (title.words.trim()) {
    const binding = title.bound ? { source: 'journey.title' as const } : null;
    const at = { x: box.x, y: box.y + box.h * 0.45, w: box.w };
    const head = textEl(c, at, title.words, 'sub', { binding, align: 'center' });
    const below = { x: box.x, y: head.frame.y + head.frame.h + 3, w: box.w };
    els.push(head, ...stack(c, spanLines(entries, c.locale), below));
  }
  return single(c, 'back', els);
}
