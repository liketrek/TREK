/**
 * Finding "today" inside a trip (#1567).
 *
 * Deliberately local, not UTC. `new Date().toISOString()` is the obvious way to
 * get a YYYY-MM-DD and it is wrong for exactly the people this feature is for:
 * someone in Tokyo opening the planner at 08:00 gets yesterday's date, and
 * someone in Los Angeles at 17:00 gets tomorrow's. A trip day is a calendar day
 * where the traveller is standing, so the comparison has to be made in their
 * own clock.
 */

/** Today as YYYY-MM-DD in the viewer's own timezone. */
export function localToday(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * The most useful dated day when opening a trip on mobile.
 *
 * While the trip is running this is today. Before the trip (and in a gap
 * between dated days) it is the next day on the calendar; after the trip it is
 * the final day. Callers can still fall back to their first day for undated
 * itineraries.
 */
export function findRelevantDayId(days: Array<{ id: number; date?: string | null }>, now?: Date): number | null {
  const today = localToday(now)
  const datedDays = days
    .map((day, index) => ({ day, index, date: typeof day.date === 'string' ? day.date.slice(0, 10) : '' }))
    .filter(item => item.date.length === 10)
    .sort((a, b) => a.date.localeCompare(b.date) || a.index - b.index)

  if (datedDays.length === 0) return null
  return datedDays.find(item => item.date >= today)?.day.id ?? datedDays[datedDays.length - 1].day.id
}

/**
 * The id of the day that is today, or null when the trip is not running.
 *
 * Days without a date (a trip planned as "day 1..7" with no calendar attached)
 * can never match, which is the intended outcome: there is nothing to jump to.
 */
export function findTodayDayId(days: Array<{ id: number; date?: string | null }>, now?: Date): number | null {
  const today = localToday(now)
  // Only the date part: the column is a date, but a caller could hand over an
  // ISO timestamp and a trip would silently stop having a "today".
  const match = days.find(d => typeof d.date === 'string' && d.date.slice(0, 10) === today)
  return match ? match.id : null
}
