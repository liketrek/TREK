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

/**
 * The day a single-day view should open on: today while the trip is running,
 * otherwise the next dated day still ahead. A trip with a gap in its dates —
 * or one that has not started yet — lands on the day that is actually coming
 * instead of on day one.
 *
 * Null once every dated day has passed, and for an undated itinerary, so the
 * caller keeps its own fallback: a finished trip opens where it always did,
 * on its first day.
 *
 * The desktop plan shows every day at once and only needs findTodayDayId; the
 * phone plan is single-day and has to land somewhere, which is the only reason
 * the two differ. Both read "today" off localToday, so that part cannot drift.
 */
export function findFocusDayId(days: Array<{ id: number; date?: string | null }>, now?: Date): number | null {
  const today = localToday(now)
  const ahead = days
    .map(d => ({ id: d.id, date: typeof d.date === 'string' ? d.date.slice(0, 10) : '' }))
    .filter(d => d.date.length === 10 && d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  return ahead[0]?.id ?? null
}
