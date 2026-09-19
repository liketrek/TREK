/**
 * Pure helpers for the public shared-trip page (#2320). React-free, so the
 * page and its detail blocks can share them and a test can drive them
 * without rendering.
 */

/**
 * Whether a string is a link the page may render as one.
 *
 * The server already drops anything that is not http(s) (share.service.ts),
 * so this is the second gate rather than the first — the page must not become
 * the place where a `javascript:` value turns into an anchor because a future
 * payload forgot to filter it.
 */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * "45 min", "2 h", "1 h 30 min" — the planned time at a place.
 *
 * Nothing for a missing, zero or negative figure: the planner's default of an
 * hour is a default, not a plan, and the field stores what the owner typed.
 */
export function formatDurationMinutes(minutes: number | null | undefined): string | null {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null
  const whole = Math.round(minutes)
  const h = Math.floor(whole / 60)
  const m = whole % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

/** The hostname a booking link points at, for a label that says where it goes. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
