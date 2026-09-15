import type { DawarichSuggestion } from '@trek/shared'
import { dayColor } from '../Map/dawarichTrail'

/**
 * Pure shaping for the suggestions panel — no React, so the grouping and the
 * formatting can be tested without rendering anything.
 */

export interface SuggestionDay {
  /** `YYYY-MM-DD`, the stay's own local date. */
  date: string
  /** The colour this day is drawn in on the map, so the panel and the line agree. */
  color: string
  stays: DawarichSuggestion[]
}

/**
 * Group stays by the local day they happened on, newest day first, and give each
 * day the colour the map draws it in.
 *
 * The grouping is what turns a flat list into something readable: a day of
 * travel produces four or five stays, and repeating the full date on every row
 * buries the one thing that distinguishes them — the time.
 *
 * The colour index counts days from the OLDEST, matching how the track overlay
 * numbers them, so "the purple line" and "the purple day" are the same day.
 */
export function groupByDay(suggestions: DawarichSuggestion[]): SuggestionDay[] {
  const byDate = new Map<string, DawarichSuggestion[]>()
  for (const stay of suggestions) {
    const bucket = byDate.get(stay.localDate)
    if (bucket) bucket.push(stay)
    else byDate.set(stay.localDate, [stay])
  }

  const oldestFirst = [...byDate.keys()].sort()
  return oldestFirst
    .map((date, index) => ({
      date,
      color: dayColor(index),
      // Within a day, earliest first: that is the order they were lived in.
      stays: byDate.get(date)!.slice().sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1)),
    }))
    .reverse()
}

/** `HH:MM` out of an ISO timestamp, in the offset the timestamp carries. */
export function clockOf(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) ? iso.slice(11, 16) : ''
}

/**
 * `10:15 – 12:40`, or just the arrival when the end is unreadable.
 *
 * An en dash with hair spaces rather than a hyphen: this is a range, and it sits
 * next to times often enough that the difference is visible.
 */
export function timeRange(startedAt: string, endedAt: string): string {
  const from = clockOf(startedAt)
  const to = clockOf(endedAt)
  if (!from) return ''
  return to ? `${from} – ${to}` : from
}

/**
 * A duration a person would say out loud.
 *
 * "285 min" is a number from a database; "4 h 45 min" is how long somebody was
 * somewhere. The two label keys carry the units so a locale can put them where
 * it wants them.
 */
export function formatDuration(
  minutes: number,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (minutes < 60) return t('dawarich.duration.minutes', { minutes })
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0
    ? t('dawarich.duration.hours', { hours })
    : t('dawarich.duration.hoursMinutes', { hours, minutes: rest })
}

/**
 * A stay's day header, in the reader's language: `Thu, 10 Sept`.
 *
 * Built from the date string rather than from a Date at midnight UTC, so a
 * reader east or west of UTC does not see yesterday.
 */
export function formatDayHeading(date: string, locale: string): string {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/**
 * How a trip day reads in the accept dialog's picker.
 *
 * `1. 2026-09-09` is a row out of a database. What a person recognises is the
 * number the planner gives the day and the weekday it fell on, which is exactly
 * what the day rail shows them — so the picker says the same thing.
 */
export function formatDayOption(
  dayNumber: number,
  date: string | null | undefined,
  locale: string,
  t: (key: string, params?: Record<string, unknown>) => string,
): { label: string; badge?: string } {
  return {
    label: t('planner.dayN', { n: dayNumber }),
    badge: date ? formatDayHeading(date, locale) : undefined,
  }
}
