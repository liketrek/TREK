import { DEFAULT_WEEK_START, WEEK_START_DAY, WEEK_START_VALUES, type WeekStart } from '@trek/shared'

/**
 * The calendar-grid half of the week_start setting (#2029): the one place a
 * date picker asks which weekday opens a row, how many blanks go before the
 * 1st, and what the header row says. Both pickers (CustomDatePicker and the
 * journey DatePicker) read it, so they cannot drift apart again.
 */

/** Date#getDay() of the first weekday; a missing or unknown value is Monday, what every picker did before the setting. */
export function weekStartDay(value: unknown): number {
  const known = (WEEK_START_VALUES as readonly unknown[]).includes(value)
  return WEEK_START_DAY[known ? value as WeekStart : DEFAULT_WEEK_START]
}

/** Blank cells before the 1st of the month when rows begin on `weekStart`. */
export function leadingBlanks(year: number, month: number, weekStart: number): number {
  return (new Date(year, month, 1).getDay() - weekStart + 7) % 7
}

// 7 January 2024 is a Sunday, so the 7th plus a getDay() number is that weekday.
function sampleDay(day: number): Date {
  return new Date(2024, 0, 7 + day)
}

/** The header row of a month grid, starting on `weekStart`, in the app's locale. */
export function weekdayLabels(locale: string, weekStart: number, weekday: 'narrow' | 'short' = 'narrow'): string[] {
  return Array.from({ length: 7 }, (_, i) => sampleDay((weekStart + i) % 7).toLocaleDateString(locale, { weekday }))
}

/**
 * The choices for the setting, labelled with the day's own name in the app's
 * language, so no locale file has to spell out seven weekdays. Capitalised
 * because several languages write weekday names lower-case and these stand
 * alone on a button.
 */
export function weekStartOptions(locale: string): { value: WeekStart; label: string }[] {
  return WEEK_START_VALUES.map(value => {
    const name = sampleDay(WEEK_START_DAY[value]).toLocaleDateString(locale, { weekday: 'long' })
    return { value, label: name.charAt(0).toLocaleUpperCase(locale) + name.slice(1) }
  })
}
