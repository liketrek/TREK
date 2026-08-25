import tzlookup from 'tz-lookup'

// The open/closed ring used to show whatever `open_now` the details endpoint had
// handed back — a boolean Google computed when the payload was fetched and that the
// server then cached for days. Read from another continent that value is wrong twice
// over: it is stale, and nothing in the chain ever looked at the place's own clock.
// The details payload also carries machine-readable periods — day/hour/minute, the
// same shape for Google and for OSM places — and those are what the ring is recomputed
// from, in the timezone of the coordinates. The weekday lines stay what they always
// were: display text in the user's language, unusable as a data source. Issue #1680.

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY

// Periods count days the way Google does: Sunday is 0. Intl reports the weekday by
// name, so this maps one to the other.
const WEEKDAY_NUMBER: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export interface OpeningTimePoint {
  day: number
  hour: number
  minute: number
}

export interface OpeningPeriod {
  open: OpeningTimePoint
  /** Absent or null means the place never closes. */
  close?: OpeningTimePoint | null
}

export interface PlaceOpeningHours {
  periods?: OpeningPeriod[] | null
  /** YYYY-MM-DD dates the weekly periods do not describe (holidays and the like). */
  specialDays?: string[] | null
}

export function resolvePlaceTimeZone(lat: unknown, lng: unknown): string | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  try {
    return tzlookup(lat, lng)
  } catch {
    return null
  }
}

/** Monday-based weekday index for `now` in `timeZone`; the viewer's own zone when it is null. */
export function placeWeekdayIndex(now: Date, timeZone: string | null): number {
  const local = localParts(now, timeZone)
  if (local) return (local.day + 6) % 7
  const jsDay = now.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

/** Weekday (Sunday = 0), minute of day and calendar date of `now` in `timeZone`. */
function localParts(now: Date, timeZone: string | null): { day: number; minutes: number; date: string } | null {
  if (!timeZone) return null
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ''
    const day = WEEKDAY_NUMBER[value('weekday')]
    const hour = Number.parseInt(value('hour'), 10)
    const minute = Number.parseInt(value('minute'), 10)
    if (day === undefined || Number.isNaN(hour) || Number.isNaN(minute)) return null
    return {
      day,
      minutes: (hour % 24) * 60 + minute,
      date: `${value('year')}-${value('month')}-${value('day')}`,
    }
  } catch {
    return null
  }
}

function isTimePoint(point: unknown): point is OpeningTimePoint {
  if (!point || typeof point !== 'object') return false
  const { day, hour, minute } = point as OpeningTimePoint
  if (typeof day !== 'number' || typeof hour !== 'number' || typeof minute !== 'number') return false
  return day >= 0 && day <= 6 && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

/** Periods with a usable open point; a close point is optional but must be usable if present. */
function usablePeriods(periods: unknown): OpeningPeriod[] {
  if (!Array.isArray(periods)) return []
  return periods.filter(
    (p): p is OpeningPeriod =>
      !!p && isTimePoint((p as OpeningPeriod).open) && ((p as OpeningPeriod).close == null || isTimePoint((p as OpeningPeriod).close)),
  )
}

function pointMinutes(point: OpeningTimePoint): number {
  return point.day * MINUTES_PER_DAY + point.hour * 60 + point.minute
}

/**
 * Open/closed state of a place at `now`, judged by its own local clock.
 * Returns `fallback` (the server's `open_now`) whenever the periods cannot decide it.
 */
export function resolveOpenNow(
  hours: PlaceOpeningHours | null | undefined,
  lat: unknown,
  lng: unknown,
  fallback: boolean | null | undefined,
  now: Date = new Date(),
): boolean | null {
  const fb = fallback ?? null
  const periods = usablePeriods(hours?.periods)
  if (periods.length === 0) return fb

  const local = localParts(now, resolvePlaceTimeZone(lat, lng))
  if (!local) return fb

  // A holiday is not in the weekly periods, but Google knew about it when it computed
  // open_now — on such a day its verdict stands rather than our recomputation.
  const specialDays = hours?.specialDays
  if (Array.isArray(specialDays) && specialDays.includes(local.date)) return fb

  const nowMinutes = local.day * MINUTES_PER_DAY + local.minutes
  for (const period of periods) {
    if (period.close == null) return true
    const start = pointMinutes(period.open)
    let end = pointMinutes(period.close)
    // A closing time at or before the opening time runs past midnight, and past the end
    // of the week when it opens on Saturday — hence the second comparison.
    if (end <= start) end += MINUTES_PER_WEEK
    if (nowMinutes >= start && nowMinutes < end) return true
    if (nowMinutes + MINUTES_PER_WEEK >= start && nowMinutes + MINUTES_PER_WEEK < end) return true
  }
  return false
}
