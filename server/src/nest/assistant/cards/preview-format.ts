import type { PreviewContext } from './card-types';
import type { AssistantChangeLabelKey, AssistantChangeRow } from '@trek/shared';

/**
 * How a change card writes what it shows: a value cut to what a row holds,
 * an argument read as an id, dates and amounts in the user's locale, days,
 * places, people and categories by their names. Shared by the core cards
 * (tool-call-preview.helpers.ts) and every package's own.
 */

type Args = Record<string, unknown>;

/** What naming a day or a place needs of the context. */
type Naming = Pick<PreviewContext, 'card' | 'locale'>;

/** Longest value a row shows; URLs keep their start, so the host stays visible. */
const MAX_VALUE_CHARS = 160;

const CHECKED = '✓';
export const UNCHECKED = '✗';

export function clip(value: string): string {
  const line = value.replace(/\s+/g, ' ').trim();
  return line.length > MAX_VALUE_CHARS ? `${line.slice(0, MAX_VALUE_CHARS - 1)}…` : line;
}

export function id(args: Args, key: string): number | null {
  const value = args[key];
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

export function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? CHECKED : UNCHECKED;
  return clip(String(value));
}

export class Rows {
  readonly rows: AssistantChangeRow[] = [];

  add(labelKey: AssistantChangeLabelKey, after: string): this {
    if (after !== '') this.rows.push({ op: 'add', labelKey, before: null, after });
    return this;
  }

  change(labelKey: AssistantChangeLabelKey, before: string | null, after: string): this {
    this.rows.push({ op: 'change', labelKey, before: before || null, after });
    return this;
  }

  move(labelKey: AssistantChangeLabelKey, before: string, after: string): this {
    this.rows.push({ op: 'move', labelKey, before: before || null, after });
    return this;
  }
}

/** A locale Intl accepts, the user's when it can. */
export function localeOf(ctx: Pick<PreviewContext, 'locale'>): string {
  try {
    return Intl.getCanonicalLocales(ctx.locale)[0] ?? 'en';
  } catch {
    return 'en';
  }
}

export function formatDate(ctx: Pick<PreviewContext, 'locale'>, isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat(localeOf(ctx), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDateTime(ctx: Pick<PreviewContext, 'locale'>, value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  return match ? `${formatDate(ctx, match[1])}, ${match[2]}` : value;
}

/** A day as the planner names it: its date (and title), or its title, or its number. */
export function dayLabel(ctx: Naming, dayId: number | null): string {
  if (dayId === null) return '';
  const day = ctx.card.days.find((d) => d.id === dayId);
  if (!day) return `#${dayId}`;
  if (day.date) return day.title ? `${formatDate(ctx, day.date)}, ${day.title}` : formatDate(ctx, day.date);
  return day.title ?? `#${day.number}`;
}

export function placeName(ctx: Pick<PreviewContext, 'card'>, placeId: number | null): string {
  if (placeId === null) return '';
  return ctx.card.places.get(placeId)?.name ?? `#${placeId}`;
}

export function money(ctx: Pick<PreviewContext, 'locale'>, amount: number, currency: string | null): string {
  if (currency) {
    try {
      return new Intl.NumberFormat(localeOf(ctx), { style: 'currency', currency }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  }
  return new Intl.NumberFormat(localeOf(ctx)).format(amount);
}

export function memberNames(ctx: Pick<PreviewContext, 'card'>, ids: unknown): string {
  if (!Array.isArray(ids)) return '';
  return clip(ids.map((memberId) => ctx.card.members.get(Number(memberId))?.name ?? `#${String(memberId)}`).join(', '));
}

export function categoryName(ctx: Pick<PreviewContext, 'categories'>, categoryId: number | null): string {
  return categoryId === null ? '' : (ctx.categories.get(categoryId) ?? `#${categoryId}`);
}
