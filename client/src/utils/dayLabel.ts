import type { Day } from '../types'

type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * How a day is named wherever days are listed as a whole: its title, else its
 * date as a short weekday and day of the month, else "Day n" by its position.
 *
 * The reorder dialog, the phone's day sheet and the delete question all name a
 * day, and they have to name it the same way, or the question asks about a day
 * the list beside it calls something else. The date is read as a local calendar
 * date, and a value that does not parse falls through to the position.
 */
export function dayLabel(day: Pick<Day, 'title' | 'date'>, index: number, t: Translate, locale: string): string {
  if (day.title) return day.title
  return (day.date && dayDate(day.date, locale)) || t('dayplan.dayN', { n: index + 1 })
}

/**
 * A calendar date the way the day list writes it: short weekday, day, month,
 * and no year, which the trip around it already says. Anything that talks
 * about the days in that list (the next day to add, a moved check-out, the new
 * end of the trip) writes its dates this way too, so a date reads the same in
 * the button as in the row it becomes. Null when the value does not parse.
 */
export function dayDate(iso: string, locale: string): string | null {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}
