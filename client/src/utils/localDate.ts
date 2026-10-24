/**
 * The user's LOCAL calendar date as 'YYYY-MM-DD'.
 *
 * Never derive "today" from `toISOString().split('T')[0]` — that is the UTC
 * date, which disagrees with the wall clock between local midnight and the UTC
 * rollover (for a UTC+2 user, from 00:00 to 02:00 every night). Trip and
 * journey dates are wall-clock dates, so every "is this today/past/upcoming"
 * comparison must use this instead.
 *
 * (Converting a Date you deliberately built in UTC — `new Date(s + 'T00:00:00Z')`
 * round-tripped through date arithmetic — is a different, self-consistent
 * pattern and fine as it is.)
 */
export function localIsoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Minutes since local midnight: the wall clock a day's schedule is read against. */
export function localMinutes(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Whether a trip day's date (anything starting 'YYYY-MM-DD') is today on the wall
 * clock. Local for the reason `localIsoDate` gives; a day without a date is never today.
 */
export function isLocalToday(date: string | null | undefined): boolean {
  return !!date && date.slice(0, 10) === localIsoDate()
}

/**
 * The browser's IANA time zone, or undefined when it cannot name one. Chrome
 * on Windows answers undefined for a system zone it cannot map, such as
 * Alberta's permanent UTC-6 (#2694), so every reader picks its own fallback.
 */
export function browserTimeZone(): string | undefined {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone as string | undefined
  return typeof tz === 'string' && tz ? tz : undefined
}

/** Whether `Intl` accepts the zone; formatting with one it rejects throws a RangeError. */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}
