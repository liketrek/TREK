import type { VacayYearSettings } from '../types'

/**
 * Client-side mirror of the server's leave-year window (#737). The server owns
 * the arithmetic that entitlements are computed with; this copy is what the grid
 * renders and what the trip/holiday overlays filter against, so both sides have
 * to agree on where a period starts.
 *
 * A window is [start, end) — start inclusive, end exclusive — and the `year`
 * integer names the period, not necessarily the calendar year it ends in.
 */

export const DEFAULT_YEAR_SETTINGS: VacayYearSettings = {
  year_type: 'calendar',
  year_start_month: 1,
  year_start_day: 1,
  hire_date: null,
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Days a month has in every year — February caps at 28, matching the server. */
export function daysAlwaysInMonth(month: number): number {
  if (month === 2) return 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/**
 * Month (1-12) and day the leave year starts on. 'anniversary' without a hire
 * date has nothing to anchor to and reads as the calendar default rather than
 * borrowing a month a previous 'fiscal' setting left behind — the server's
 * resolveYearWindow resolves it identically.
 */
function startMonthDay(s: VacayYearSettings): { month: number; day: number } {
  if (s.year_type === 'calendar') return { month: 1, day: 1 }
  let month = s.year_start_month || 1
  let day = s.year_start_day || 1
  if (s.year_type === 'anniversary') {
    if (!s.hire_date) return { month: 1, day: 1 }
    const parts = s.hire_date.split('-')
    month = Number.parseInt(parts[1], 10) || 1
    day = Number.parseInt(parts[2], 10) || 1
  }
  month = Math.min(12, Math.max(1, month))
  return { month, day: Math.min(day, daysAlwaysInMonth(month)) }
}

/** The period's exact [start, end) — this is what used/remaining are counted over. */
export function resolveYearWindow(year: number, s: VacayYearSettings = DEFAULT_YEAR_SETTINGS): { start: string; end: string } {
  const { month, day } = startMonthDay(s)
  return { start: `${year}-${pad2(month)}-${pad2(day)}`, end: `${year + 1}-${pad2(month)}-${pad2(day)}` }
}

/**
 * The range the grid actually covers: the twelve whole months the window starts
 * in, since the calendar is built from month cards. For every window that begins
 * on the 1st — all of 'calendar' — this is exactly the counting window.
 *
 * Known limitation for a start day past the 1st: month-aligned at both ends, so
 * the range is shifted rather than widened — the first days of the start month
 * are drawn but count toward the previous period, and the last days of the period
 * count here but have no card. Mirrors the server's viewerGridWindow.
 */
export function gridWindow(year: number, s: VacayYearSettings = DEFAULT_YEAR_SETTINGS): { start: string; end: string } {
  const { month } = startMonthDay(s)
  return { start: `${year}-${pad2(month)}-01`, end: `${year + 1}-${pad2(month)}-01` }
}

/** True when `date` (YYYY-MM-DD) falls inside the grid's range for this period. */
export function inGridWindow(date: string, year: number, s: VacayYearSettings = DEFAULT_YEAR_SETTINGS): boolean {
  const { start, end } = gridWindow(year, s)
  return date >= start && date < end
}

/**
 * The twelve (year, month) pairs the grid renders, in display order. For
 * 'calendar' that is Jan–Dec of `year`; a fiscal year starting in July gives
 * Jul `year` – Jun `year + 1`.
 */
export function windowMonths(year: number, s: VacayYearSettings = DEFAULT_YEAR_SETTINGS): { year: number; month: number }[] {
  const startIndex = startMonthDay(s).month - 1
  return Array.from({ length: 12 }, (_, i) => {
    const absolute = startIndex + i
    return { year: year + Math.floor(absolute / 12), month: absolute % 12 }
  })
}

/** The calendar years the grid's range touches — one for 'calendar', two for a shifted window. */
export function windowCalendarYears(year: number, s: VacayYearSettings = DEFAULT_YEAR_SETTINGS): number[] {
  const years = new Set(windowMonths(year, s).map(m => m.year))
  return [...years].sort((a, b) => a - b)
}

/**
 * The period today falls into. With a window that starts later in the year,
 * today still belongs to the period named after the previous calendar year.
 */
export function currentPeriodYear(s: VacayYearSettings = DEFAULT_YEAR_SETTINGS, today = new Date()): number {
  const year = today.getFullYear()
  const iso = `${year}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
  return iso < resolveYearWindow(year, s).start ? year - 1 : year
}

/**
 * The year Vacay opens on. The period we are actually in wins; adding 2030 to plan
 * ahead should not make 2030 the year the page lands on from then on. When that
 * period has no year yet, the closest one the plan does have is used, and a tie
 * goes to the later year because planning looks forward.
 */
export function defaultPeriodYear(years: number[], s: VacayYearSettings = DEFAULT_YEAR_SETTINGS, today = new Date()): number {
  const current = currentPeriodYear(s, today)
  if (years.length === 0 || years.includes(current)) return current
  // Seeded with years[0] rather than left to reduce's implicit first element:
  // same result, and it cannot throw if the guard above ever loosens.
  return years.reduce((best, year) => {
    const distance = Math.abs(year - current)
    const bestDistance = Math.abs(best - current)
    return distance < bestDistance || (distance === bestDistance && year > best) ? year : best
  }, years[0])
}
