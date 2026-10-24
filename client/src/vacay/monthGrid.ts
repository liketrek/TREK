/**
 * The grid of one month as the vacation planner draws it, shared by the phone's
 * month view and the assistant's vacation card: how many empty cells come
 * before the 1st, and a day's date as the planner stores it.
 */

/** Empty leading cells before the 1st, honoring the configured week start (0 Sunday, 1 Monday). */
export function monthLead(year: number, month: number, weekStart: number): number {
  return (new Date(year, month, 1).getDay() - weekStart + 7) % 7;
}

/** A day as `YYYY-MM-DD`, from a zero-based month. */
export function localDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
