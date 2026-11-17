import { DATE_FORMAT_VALUES, type DateFormat } from '@trek/shared';

/**
 * The user's date format (#2971), applied wherever a date is written in numbers.
 *
 * Every function here takes the format as an argument and stays pure; the
 * current user's value comes from `useDateFormat()` (or `readDateFormat()`
 * outside React) in hooks/useDateFormat.ts. 'auto', an unknown value or none
 * at all leaves everything to `Intl` and the interface language, exactly as
 * TREK wrote dates before the setting existed.
 *
 * Only the numeric part follows the setting. A date written with a weekday or
 * a month name ("Tue, 3 Nov") keeps the language's own wording and order: the
 * setting answers "how do I read 03/11", not "what is November called".
 */

export type DateField = 'day' | 'month' | 'year';

interface DateLayout {
  order: DateField[];
  separator: string;
}

const LAYOUTS: Record<Exclude<DateFormat, 'auto'>, DateLayout> = {
  'YYYY-MM-DD': { order: ['year', 'month', 'day'], separator: '-' },
  'YYYY/MM/DD': { order: ['year', 'month', 'day'], separator: '/' },
  'DD.MM.YYYY': { order: ['day', 'month', 'year'], separator: '.' },
  'DD/MM/YYYY': { order: ['day', 'month', 'year'], separator: '/' },
  'MM/DD/YYYY': { order: ['month', 'day', 'year'], separator: '/' },
};

/** The order and separator of a chosen format; null for 'auto' or anything unknown. */
export function dateLayout(format: string | null | undefined): DateLayout | null {
  if (!format || format === 'auto') return null;
  return LAYOUTS[format as keyof typeof LAYOUTS] ?? null;
}

/** 31 December: no day of it reads as a month, so every example and probe of a layout is unambiguous. */
const SAMPLE = new Date(Date.UTC(2026, 11, 31));

const DATE_KEYS = ['day', 'month', 'year'] as const;
const TIME_KEYS = ['hour', 'minute', 'second', 'dayPeriod', 'fractionalSecondDigits'] as const;

/**
 * Whether these options write the date in numbers only: no weekday, no month
 * name, no era. `dateStyle: 'short'` is numeric in every language. The longer
 * styles depend on the language: 'medium' names the month in English or French
 * but is all numbers in German ("31.12.2026"), Czech or Japanese ("2026/12/31"),
 * so those are asked of `Intl` for the given locale.
 */
export function isNumericDate(opts: Intl.DateTimeFormatOptions = {}, locale?: string): boolean {
  if (opts.weekday || opts.era) return false;
  if (opts.dateStyle) return opts.dateStyle === 'short' || isNumericStyle(opts.dateStyle, locale);
  return !opts.month || opts.month === 'numeric' || opts.month === '2-digit';
}

const numericStyles = new Map<string, boolean>();

/**
 * Whether a language writes this dateStyle as digits and punctuation alone. A
 * month name, a weekday or a word between the numbers ("2026年12月31日") keeps
 * it with the language, the same as a month name in explicit options would.
 */
function isNumericStyle(dateStyle: NonNullable<Intl.DateTimeFormatOptions['dateStyle']>, locale?: string): boolean {
  const key = `${locale ?? ''}|${dateStyle}`;
  let numeric = numericStyles.get(key);
  if (numeric === undefined) {
    // Separators may carry the bidi marks Arabic puts around them (\p{Cf}).
    try {
      numeric = new Intl.DateTimeFormat(locale, { dateStyle, timeZone: 'UTC' })
        .formatToParts(SAMPLE)
        .every((part) =>
          part.type === 'literal'
            ? /^[\s\p{P}\p{Cf}]*$/u.test(part.value)
            : (part.type === 'day' || part.type === 'month' || part.type === 'year') && /^\p{Nd}+$/u.test(part.value)
        );
    } catch {
      numeric = false;
    }
    numericStyles.set(key, numeric);
  }
  return numeric;
}

const hasAny = (opts: Intl.DateTimeFormatOptions, keys: readonly string[]) =>
  keys.some((key) => (opts as Record<string, unknown>)[key] !== undefined);

/** The date in the layout's order, each field the options ask for (all three when they name none). */
function numericDate(date: Date, opts: Intl.DateTimeFormatOptions, layout: DateLayout): string {
  const named = opts.dateStyle ? DATE_KEYS : DATE_KEYS.filter((key) => opts[key] !== undefined);
  const fields = named.length > 0 ? named : DATE_KEYS;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: opts.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    numberingSystem: 'latn',
  }).formatToParts(date);
  const value = (type: DateField) => parts.find((part) => part.type === type)?.value ?? '';
  const shortYear = opts.year === '2-digit';
  return layout.order
    .filter((field) => (fields as readonly string[]).includes(field))
    .map((field) => (field === 'year' && shortYear ? value('year').slice(-2) : value(field)))
    .join(layout.separator);
}

/** Only the time-of-day options, for the clock part beside a numeric date. */
function timeOptions(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
  const time: Intl.DateTimeFormatOptions = {};
  for (const key of [...TIME_KEYS, 'hour12', 'hourCycle', 'timeZone', 'timeZoneName'] as const) {
    const value = (opts as Record<string, unknown>)[key];
    if (value !== undefined) (time as Record<string, unknown>)[key] = value;
  }
  if (opts.timeStyle) time.timeStyle = opts.timeStyle;
  return time;
}

/**
 * `date.toLocaleDateString(locale, opts)`, with a numeric date written in the
 * chosen format. Anything with a weekday or a month name is left to `Intl`.
 */
export function formatDisplayDate(
  date: Date,
  locale: string | undefined,
  opts: Intl.DateTimeFormatOptions = {},
  format?: string | null
): string {
  const layout = dateLayout(format);
  if (!layout || Number.isNaN(date.getTime())) return date.toLocaleDateString(locale, opts);
  if (opts.weekday && isNumericWithWeekday(opts)) {
    const weekday = date.toLocaleDateString(locale, { weekday: opts.weekday, timeZone: opts.timeZone });
    return `${weekday}, ${numericDate(date, opts, layout)}`;
  }
  if (!isNumericDate(opts, locale)) return date.toLocaleDateString(locale, opts);
  return numericDate(date, opts, layout);
}

/** A weekday beside a date that is otherwise all numbers ("Tue, 03.11.2026"). */
function isNumericWithWeekday(opts: Intl.DateTimeFormatOptions): boolean {
  if (opts.era || opts.dateStyle) return false;
  return (opts.month === 'numeric' || opts.month === '2-digit') && opts.day !== undefined;
}

/**
 * `date.toLocaleString(locale, opts)`, with a numeric date part written in the
 * chosen format and the time of day left to `Intl` (12h/24h stays the
 * caller's option). Options naming only a time are passed through untouched.
 */
export function formatDisplayDateTime(
  date: Date,
  locale: string | undefined,
  opts: Intl.DateTimeFormatOptions = {},
  format?: string | null
): string {
  const layout = dateLayout(format);
  const named = hasAny(opts, DATE_KEYS) || !!opts.dateStyle;
  const timed = hasAny(opts, TIME_KEYS) || !!opts.timeStyle;
  if (!layout || !isNumericDate(opts, locale) || Number.isNaN(date.getTime())) return date.toLocaleString(locale, opts);
  if (!named && timed) return date.toLocaleString(locale, opts);
  const day = numericDate(date, opts, layout);
  if (named && !timed) return day;
  const time = date.toLocaleTimeString(locale, timed ? timeOptions(opts) : { timeZone: opts.timeZone });
  return `${day} ${time}`;
}

/** The order the fields of a typed date are read in: the chosen format's, or the language's. */
export function dateFieldOrder(locale: string | undefined, format?: string | null): DateField[] {
  const layout = dateLayout(format);
  if (layout) return layout.order;
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' })
    .formatToParts(new Date(2001, 5, 15))
    .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map((part) => part.type as DateField);
}

/**
 * The choices of the setting, each labelled by how it writes 31 December, and
 * 'auto' by `autoLabel` with the language's own way in brackets.
 */
export function dateFormatOptions(
  locale: string | undefined,
  autoLabel: string
): { value: DateFormat; label: string }[] {
  const example = (format: DateFormat) =>
    formatDisplayDate(SAMPLE, locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }, format);
  return DATE_FORMAT_VALUES.map((value) => ({
    value,
    label: value === 'auto' ? `${autoLabel} (${example(value)})` : example(value),
  }));
}
