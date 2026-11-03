import { DATE_FORMAT_VALUES, type DateFormat } from '@trek/shared'

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

export type DateField = 'day' | 'month' | 'year'

interface DateLayout {
  order: DateField[]
  separator: string
}

const LAYOUTS: Record<Exclude<DateFormat, 'auto'>, DateLayout> = {
  'YYYY-MM-DD': { order: ['year', 'month', 'day'], separator: '-' },
  'YYYY/MM/DD': { order: ['year', 'month', 'day'], separator: '/' },
  'DD.MM.YYYY': { order: ['day', 'month', 'year'], separator: '.' },
  'DD/MM/YYYY': { order: ['day', 'month', 'year'], separator: '/' },
  'MM/DD/YYYY': { order: ['month', 'day', 'year'], separator: '/' },
}

/** The order and separator of a chosen format; null for 'auto' or anything unknown. */
export function dateLayout(format: string | null | undefined): DateLayout | null {
  if (!format || format === 'auto') return null
  return LAYOUTS[format as keyof typeof LAYOUTS] ?? null
}

const DATE_KEYS = ['day', 'month', 'year'] as const
const TIME_KEYS = ['hour', 'minute', 'second', 'dayPeriod', 'fractionalSecondDigits'] as const

/**
 * Whether these options write the date in numbers only: no weekday, no month
 * name, no era. `dateStyle: 'short'` is numeric in every language; the longer
 * styles name the month.
 */
export function isNumericDate(opts: Intl.DateTimeFormatOptions = {}): boolean {
  if (opts.weekday || opts.era) return false
  if (opts.dateStyle) return opts.dateStyle === 'short'
  return !opts.month || opts.month === 'numeric' || opts.month === '2-digit'
}

const hasAny = (opts: Intl.DateTimeFormatOptions, keys: readonly string[]) =>
  keys.some((key) => (opts as Record<string, unknown>)[key] !== undefined)

/** The date in the layout's order, each field the options ask for (all three when they name none). */
function numericDate(date: Date, opts: Intl.DateTimeFormatOptions, layout: DateLayout): string {
  const named = opts.dateStyle ? DATE_KEYS : DATE_KEYS.filter((key) => opts[key] !== undefined)
  const fields = named.length > 0 ? named : DATE_KEYS
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: opts.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    numberingSystem: 'latn',
  }).formatToParts(date)
  const value = (type: DateField) => parts.find((part) => part.type === type)?.value ?? ''
  const shortYear = opts.year === '2-digit'
  return layout.order
    .filter((field) => (fields as readonly string[]).includes(field))
    .map((field) => (field === 'year' && shortYear ? value('year').slice(-2) : value(field)))
    .join(layout.separator)
}

/** Only the time-of-day options, for the clock part beside a numeric date. */
function timeOptions(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
  const time: Intl.DateTimeFormatOptions = {}
  for (const key of [...TIME_KEYS, 'hour12', 'hourCycle', 'timeZone', 'timeZoneName'] as const) {
    const value = (opts as Record<string, unknown>)[key]
    if (value !== undefined) (time as Record<string, unknown>)[key] = value
  }
  if (opts.timeStyle) time.timeStyle = opts.timeStyle
  return time
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
  const layout = dateLayout(format)
  if (!layout || Number.isNaN(date.getTime())) return date.toLocaleDateString(locale, opts)
  if (opts.weekday && isNumericWithWeekday(opts)) {
    const weekday = date.toLocaleDateString(locale, { weekday: opts.weekday, timeZone: opts.timeZone })
    return `${weekday}, ${numericDate(date, opts, layout)}`
  }
  if (!isNumericDate(opts)) return date.toLocaleDateString(locale, opts)
  return numericDate(date, opts, layout)
}

/** A weekday beside a date that is otherwise all numbers ("Tue, 03.11.2026"). */
function isNumericWithWeekday(opts: Intl.DateTimeFormatOptions): boolean {
  if (opts.era || opts.dateStyle) return false
  return (opts.month === 'numeric' || opts.month === '2-digit') && opts.day !== undefined
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
  const layout = dateLayout(format)
  const named = hasAny(opts, DATE_KEYS) || !!opts.dateStyle
  const timed = hasAny(opts, TIME_KEYS) || !!opts.timeStyle
  if (!layout || !isNumericDate(opts) || Number.isNaN(date.getTime())) return date.toLocaleString(locale, opts)
  if (!named && timed) return date.toLocaleString(locale, opts)
  const day = numericDate(date, opts, layout)
  if (named && !timed) return day
  const time = date.toLocaleTimeString(locale, timed ? timeOptions(opts) : { timeZone: opts.timeZone })
  return `${day} ${time}`
}

/**
 * A drop-in for `new Intl.DateTimeFormat(locale, opts)` where only `.format()`
 * is used: numeric dates in the chosen format, the rest by `Intl`.
 */
export function displayDateFormatter(
  locale: string | undefined,
  opts: Intl.DateTimeFormatOptions = {},
  format?: string | null
): { format: (date: Date | number) => string } {
  const intl = new Intl.DateTimeFormat(locale, opts)
  const layout = dateLayout(format)
  if (!layout || !isNumericDate(opts)) return { format: (date) => intl.format(date) }
  return {
    format: (date) => {
      const value = typeof date === 'number' ? new Date(date) : date
      return hasAny(opts, TIME_KEYS) || opts.timeStyle
        ? formatDisplayDateTime(value, locale, opts, format)
        : formatDisplayDate(value, locale, opts, format)
    },
  }
}

/** The order the fields of a typed date are read in: the chosen format's, or the language's. */
export function dateFieldOrder(locale: string | undefined, format?: string | null): DateField[] {
  const layout = dateLayout(format)
  if (layout) return layout.order
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' })
    .formatToParts(new Date(2001, 5, 15))
    .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map((part) => part.type as DateField)
}

/** 31 December: no day of it reads as a month, so every option's example is unambiguous. */
const SAMPLE = new Date(Date.UTC(2026, 11, 31))

/**
 * The choices of the setting, each labelled by how it writes 31 December, and
 * 'auto' by `autoLabel` with the language's own way in brackets.
 */
export function dateFormatOptions(locale: string | undefined, autoLabel: string): { value: DateFormat; label: string }[] {
  const example = (format: DateFormat) =>
    formatDisplayDate(SAMPLE, locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }, format)
  return DATE_FORMAT_VALUES.map((value) => ({
    value,
    label: value === 'auto' ? `${autoLabel} (${example(value)})` : example(value),
  }))
}
