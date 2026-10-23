import { bookCoordValue, formatBookCoords, formatBookDate } from '../book-text';
import { bookCountryMark, bookCountryName, bookDayText } from '../book-travel';
import {
  MAX_TEXT_LENGTH,
  type BookBadgeElement,
  type BookElement,
  type BookPageSetup,
  type BookSpread,
} from '../book.schema';
import type { JourneyStats } from '../journey-stats.schema';
import { statsValues, type NewId } from './auto-elements';
import type { AutoTemplate } from './auto-templates.data';
import type { AutoEntry } from './auto-types';

/**
 * Laying an entry out on a template somebody drew (`AUTO_TEMPLATES`).
 *
 * Only what the entry can answer for is filled: text carrying a `binding`
 * (the title, the story, a caption), empty photo frames (the entry's photos in
 * order), the day, coordinate, date and country marks, and the stats and
 * countries elements from the journey's figures. Everything else is the design
 * and is copied as drawn. That division is the whole contract between the
 * person who draws a template and the code that uses it.
 *
 * The template's numbers are fractions of the page it was drawn on, so they
 * are multiplied back up here: a template built on a 210mm square lays out on
 * an A4 landscape book without being redrawn. Moved here from the Studio
 * (client/src/components/Studio/applyTemplate.ts) and renamed, since
 * `applyBookTemplate` is the built-in layouts' own function.
 */

export interface AutoTemplateContext {
  page: BookPageSetup;
  locale: string;
  stats: JourneyStats | null;
  /** The day mark's label ("DAY {day}"), already translated, because this module has no translation context. */
  dayLabel: string;
  newId: NewId;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** How well a template suits an entry: more is better, -1 means unusable. */
export function autoTemplateFit(template: AutoTemplate, entry: AutoEntry): number {
  const frames = template.elements.filter((e) => e.kind === 'photo').length;
  const photos = entry.photos.length;
  const wantsStory = template.elements.some((e) => e.kind === 'text' && e.binding?.source === 'entry.story');
  const hasStory = !!(entry.story || '').trim();

  // A template is a template for an entry when it uses one: a binding or an empty frame says so.
  const usesEntry = template.elements.some(
    (e) => ('binding' in e && e.binding) || (e.kind === 'photo' && e.photoId == null),
  );
  if (!usesEntry) return -1;

  // Three frames for one picture leaves two placeholders on a finished page; more pictures than frames is fine.
  if (frames > photos + 1) return -1;
  if (wantsStory && !hasStory) return -1;

  return 100 - Math.abs(frames - photos) * 10 - (wantsStory === hasStory ? 0 : 5);
}

/** Fill a template with an entry, and hand back the spread it makes. */
export function applyAutoTemplate(template: AutoTemplate, entry: AutoEntry, ctx: AutoTemplateContext): BookSpread {
  const PW = ctx.page.pageWidth;
  const PH = ctx.page.pageHeight;
  let nextPhoto = 0;
  // A journal entry has no length limit and a text element does.
  const story = (entry.story || '').trim().slice(0, MAX_TEXT_LENGTH);
  const heading = (entry.title || entry.location || '').slice(0, MAX_TEXT_LENGTH);

  const elements = template.elements.map((el) => {
    const frame = {
      x: round2(el.frame.x * PW),
      y: round2(el.frame.y * PH),
      w: round2(el.frame.w * PW),
      h: round2(el.frame.h * PH),
    };
    const out = { ...el, id: ctx.newId(el.kind.charAt(0)), frame } as BookElement;

    // Sizes came out as fractions of the page height, radii and strokes of its width.
    if (out.kind === 'text' && typeof out.size === 'number') out.size = round2(out.size * PH);
    if ((out.kind === 'photo' || out.kind === 'shape') && typeof out.radius === 'number') {
      out.radius = round2(out.radius * PW);
    }
    if (out.kind === 'shape' && typeof out.strokeWidth === 'number') out.strokeWidth = round2(out.strokeWidth * PW);

    if (out.kind === 'text' && out.binding) fillText(out, entry, ctx, { story, heading });
    if (out.kind === 'photo' && out.photoId == null) {
      const picture = entry.photos[nextPhoto++];
      if (picture) out.photoId = picture.photoId;
    }
    if (out.kind === 'badge') fillBadge(out, entry, ctx);
    if (out.kind === 'countries' && ctx.stats) {
      out.codes = ctx.stats.countries.map((c) => c.code);
      out.names = ctx.stats.countries.map((c) => c.name);
    }
    // The figures live in one map on the element, keyed by metric, as the panels write them.
    if (out.kind === 'stats' && ctx.stats) out.values = statsValues(ctx.stats);
    return out;
  });

  return {
    id: ctx.newId('sp'),
    role: 'inner',
    background: template.background,
    elements,
    parked: [],
    entryId: entry.id,
  };
}

type TextEl = Extract<BookElement, { kind: 'text' }>;

/** A bound text, set from the entry; the raw value is kept where the words were made rather than copied. */
function fillText(
  out: TextEl,
  entry: AutoEntry,
  ctx: AutoTemplateContext,
  words: { story: string; heading: string },
): void {
  if (!out.binding) return;
  const { source, format } = out.binding;
  let value: string | undefined;
  if (source === 'entry.title') out.text = words.heading;
  else if (source === 'entry.story') out.text = words.story;
  else if (source === 'entry.date') {
    out.text = formatBookDate(entry.date, ctx.locale);
    value = entry.date ?? undefined;
  } else if (source === 'entry.location') {
    // The place as its name or as its point; a stop the entry cannot answer keeps the drawn words.
    if (format && entry.lat != null && entry.lng != null) {
      out.text = formatBookCoords(entry.lat, entry.lng, format);
      value = bookCoordValue(entry.lat, entry.lng);
    } else if (!format && entry.location) {
      out.text = entry.location;
    }
  }
  out.binding = { ...out.binding, entryId: entry.id, ...(value ? { value } : {}) };
}

/**
 * The small marks, filled from the stop. A badge whose value the entry cannot
 * answer keeps the one it was drawn with.
 */
function fillBadge(el: BookBadgeElement, entry: AutoEntry, ctx: AutoTemplateContext): void {
  if (el.variant === 'day' && entry.dayNumber) el.text = bookDayText(ctx.dayLabel, entry.dayNumber);
  if (el.variant === 'coords' && entry.lat != null && entry.lng != null) {
    el.text = formatBookCoords(entry.lat, entry.lng);
  }
  if ((el.variant === 'flag' || el.variant === 'country') && entry.country) fillCountry(el, entry.country, ctx);
  if (el.variant === 'date' && entry.date) {
    const d = new Date(`${entry.date}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      el.text = String(d.getDate());
      el.sub = d.toLocaleDateString(ctx.locale, { month: 'long' }).toUpperCase();
    }
  }
  if (el.variant === 'distance' && ctx.stats?.distance) {
    el.text = `${Math.round(ctx.stats.distance / 1000).toLocaleString(ctx.locale)} km`;
  }
}

/**
 * A country mark takes the rule the engine and the Travel panel follow
 * (`bookCountryMark`): the name as its words, and the drawn words beside them
 * go. A flag keeps the place its template set the name in: in capitals as its
 * words, the way the auto layout sets a flag, or beside the flag (`sub`) where
 * it was placed from the panel, so no drawn name is left next to the new one.
 */
function fillCountry(el: BookBadgeElement, code: string, ctx: AutoTemplateContext): void {
  const name = bookCountryName(code, ctx.locale, ctx.stats);
  if (el.variant === 'country') {
    Object.assign(el, bookCountryMark('country', code, name));
    return;
  }
  el.code = code;
  if (el.text || !el.sub) el.text = name.toUpperCase();
  else el.sub = name;
}
