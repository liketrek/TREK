/**
 * Pure half of the vacay domain (no DB access), moved out of vacay.service.ts
 * so the service keeps to its size budget.
 */

/** Coerce an arbitrary input to a supported entry fraction: half (0.5) or full (1). */
export function normalizeFraction(value: unknown): number {
  return Number(value) === 0.5 ? 0.5 : 1;
}

/** Coerce an arbitrary input to a supported leave type: comp/flex or vacation (#1074). */
export function normalizeKind(value: unknown): 'vacation' | 'comp' {
  return value === 'comp' ? 'comp' : 'vacation';
}

/**
 * Same semantics as the client's isWeekend guard (holidays.ts): UTC weekday,
 * weekend_days falls back to Sat/Sun when the column is NULL or empty.
 */
export function isBlockedWeekend(
  plan: { block_weekends: number | null; weekend_days: string | null },
  date: string,
): boolean {
  if (!plan.block_weekends) return false;
  const days = plan.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6];
  return days.includes(new Date(date + 'T00:00:00Z').getUTCDay());
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Days a month has in every year — February caps at 28 so no boundary lands on a date a common year lacks. */
export function daysAlwaysInMonth(month: number): number {
  if (month === 2) return 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Coerce an arbitrary input to a supported leave-year type (#737). */
export function normalizeYearType(value: unknown): 'calendar' | 'fiscal' | 'anniversary' {
  return value === 'fiscal' || value === 'anniversary' ? value : 'calendar';
}

/**
 * The calendar year a window's last day falls in. `end` is exclusive, so a window
 * ending on Jan 1 (the calendar default) stops inside the previous year.
 */
export function windowEndYear(end: string): number {
  const y = Number.parseInt(end.slice(0, 4), 10);
  return end.endsWith('-01-01') ? y - 1 : y;
}

/**
 * Parse a date or datetime string the way SQLite's `julianday()` does — the
 * numeric components taken at face value as UTC, never the host's local
 * timezone. `Date.parse` only does this for a bare `YYYY-MM-DD`; a datetime
 * string with no zone suffix (`2025-06-12T23:30`) is local time per the ES
 * spec, which drifted from `julianday`'s always-UTC reading by whatever the
 * server's offset is (M2, task-7-review.md). Unparseable input returns `NaN`.
 */
export function parseAsUtcMillis(value: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value);
  if (!m) return Number.NaN;
  const [, y, mo, d, h, mi, s] = m;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h ?? 0), Number(mi ?? 0), Number(s ?? 0));
}

/** A `YYYY-MM-DD` date moved by whole calendar days, in UTC. */
export function shiftIsoDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
