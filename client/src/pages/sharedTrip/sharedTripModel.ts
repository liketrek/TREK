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

/**
 * Why the share payload did not arrive (#2505).
 *
 * The share endpoint answers 404 with its JSON `{ error }` body for a token
 * that is unknown, expired or revoked, and that is the only answer that says
 * anything about the link. A 5xx while the server restarts, a rate limit, a
 * timeout or no response at all because the viewer is offline says the request
 * failed, not the link, so the page offers a retry instead of sending the
 * viewer back to the owner for a new link that would not have been needed.
 *
 * A 404 without that body is not TREK talking: a reverse proxy with no
 * upstream answers one on its own (Traefik while the container is stopped or
 * still starting, nginx with a missing location), so it counts as a failed
 * load too.
 */
export type SharedTripLoadError = 'expired' | 'unavailable'

export function sharedTripLoadError(err: unknown): SharedTripLoadError {
  const response = (err as { response?: { status?: number; data?: unknown } } | null | undefined)?.response
  if (response?.status !== 404) return 'unavailable'
  return isPlainObject(response.data) && typeof response.data.error === 'string' ? 'expired' : 'unavailable'
}

/**
 * Whether a 200 carried the share payload. An auth wall or a captive portal
 * can answer the API call with its own HTML page, which axios hands over as a
 * string; the page would crash on it, so the hook treats it as a failed load.
 */
export function isSharedTripPayload(payload: unknown): boolean {
  return isPlainObject(payload) && isPlainObject(payload.trip)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Where a trip's cover lives. The column holds whichever of three shapes the
 * upload path wrote over the years: an absolute URL, a root path, or a bare
 * file name under the uploads directory.
 */
export function coverSrc(cover: string | null | undefined): string | null {
  if (!cover) return null
  if (cover.startsWith('http') || cover.startsWith('/')) return cover
  return `/uploads/${cover}`
}

/** A date range the way the booking cards print one: "7 Jul 2026 → 25 Jul 2026". */
export function formatDateRange(start: string | null | undefined, end: string | null | undefined, locale: string): string | null {
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const dates = [start, end].filter((d): d is string => !!d)
  if (dates.length === 0) return null
  return dates.map(fmt).join(' → ')
}

export interface StopLike {
  id: number
  order_index?: number | null
  place?: { id: number } | null
}

/**
 * The numbers a day's stops wear, on the map and in the list alike. They run
 * over the full sorted list, like the planner's, so a stop whose place has no
 * coordinates still takes its number and "3" means the same stop everywhere.
 * A place the day visits twice gets both numbers.
 */
export function stopNumbers(stops: StopLike[]): { byAssignment: Record<number, number>; byPlace: Record<number, number[]> } {
  const byAssignment: Record<number, number> = {}
  const byPlace: Record<number, number[]> = {}
  ;[...stops]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .forEach((a, i) => {
      byAssignment[a.id] = i + 1
      if (a.place?.id != null) (byPlace[a.place.id] ||= []).push(i + 1)
    })
  return { byAssignment, byPlace }
}

/** Items in groups by a key, the groups in the order their first item came. */
export function groupInOrder<T>(items: readonly T[], keyOf: (item: T) => string): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const list = groups.get(key)
    if (list) list.push(item)
    else groups.set(key, [item])
  }
  return [...groups.entries()]
}

export type SpanPhase = 'single' | 'start' | 'middle' | 'end'

/** What a day in the middle of a booking's span calls it, as the planner says it. */
export function spanLabelKey(type: string, phase: SpanPhase): string | null {
  if (phase === 'single') return null
  const pick = (start: string, end: string, middle: string) => `reservations.span.${phase === 'start' ? start : phase === 'end' ? end : middle}`
  if (type === 'flight') return pick('departure', 'arrival', 'inTransit')
  if (type === 'car') return pick('pickup', 'return', 'active')
  if (type === 'parking') return pick('dropOff', 'pickup', 'ongoing')
  return pick('start', 'end', 'ongoing')
}

export interface LegLike {
  airline?: string | null
  flight_number?: string | null
  train_number?: string | null
  platform?: string | null
  from?: string | null
  to?: string | null
}

const route = (from?: string | null, to?: string | null) => (from || to ? [from, to].filter(Boolean).join(' → ') : '')

/**
 * The facts a transport row states under its title: carrier, number, route
 * and platform, each on its own so the row can set them apart. A leg of a
 * multi-leg flight or train states its own, not the whole booking's.
 */
export interface SharedTransport {
  id: number
  type: string
  title: string
  day_id?: number | null
  end_day_id?: number | null
  reservation_time?: string | null
  reservation_end_time?: string | null
  metadata?: unknown
  /** Set on the rows a multi-leg flight or train is split into, one per leg. */
  __leg?: (LegLike & { index: number }) | null
}

export function transportFacts(
  r: Pick<SharedTransport, 'type' | 'metadata' | '__leg'>,
  platformLabel: string,
): string[] {
  const meta = (typeof r.metadata === 'string' ? safeJson(r.metadata) : r.metadata || {}) as Record<string, string | undefined>
  const platform = (p?: string | null) => (p ? `${platformLabel} ${p}` : '')
  let facts: (string | null | undefined)[] = []
  if (r.type === 'flight') {
    facts = r.__leg
      ? [r.__leg.airline, r.__leg.flight_number, route(r.__leg.from, r.__leg.to)]
      : [meta.airline, meta.flight_number, meta.departure_airport && meta.arrival_airport ? route(meta.departure_airport, meta.arrival_airport) : '']
  } else if (r.type === 'train') {
    facts = r.__leg
      ? [r.__leg.train_number, platform(r.__leg.platform), route(r.__leg.from, r.__leg.to)]
      : [meta.train_number, platform(meta.platform)]
  }
  return facts.filter((f): f is string => !!f)
}

/** One leg of a flight or train, as the booking card lists it. */
export function legFacts(leg: LegLike, platformLabel: string): string[] {
  return [leg.airline, leg.flight_number, leg.train_number, leg.platform ? `${platformLabel} ${leg.platform}` : '', route(leg.from, leg.to)]
    .filter((f): f is string => !!f)
}

/** The pool's places no day has picked up yet (#1758), in the pool's own order. */
export function unplannedPlaces<P extends { id: number }>(
  places: P[],
  assignments: Record<string, { place?: { id: number } | null }[]>,
): P[] {
  const planned = new Set<number>()
  for (const rows of Object.values(assignments)) for (const a of rows) if (a.place) planned.add(a.place.id)
  return places.filter(p => !planned.has(p.id))
}

/**
 * A day worth a card on a "travel and stays" link (#1712): one that has something
 * on it or a night booked. The rest would be a column of empty days.
 */
export function dayHasEntries(itemCount: number, stayCount: number): boolean {
  return itemCount > 0 || stayCount > 0
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text || '{}')
  } catch {
    return {}
  }
}
