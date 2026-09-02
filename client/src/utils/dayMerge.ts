// `orderedEndpoints` is the geometry order's single source of truth, in the module
// that documents the multi-leg model. Sorting endpoints a second time here is how
// the two drift.
import { orderedEndpoints } from './flightLegs'

export const TRANSPORT_TYPES = new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other'])

export interface MergedItem {
  type: 'place' | 'note' | 'transport'
  sortKey: number
  data: any
}

export function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null
  if (time.includes('T')) {
    const [h, m] = time.split('T')[1].split(':').map(Number)
    return h * 60 + m
  }
  const parts = time.split(':').map(Number)
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) return parts[0] * 60 + parts[1]
  return null
}

export function getSpanPhase(
  r: { day_id?: number | null; end_day_id?: number | null },
  dayId: number
): 'single' | 'start' | 'middle' | 'end' {
  const startDayId = r.day_id
  const endDayId = r.end_day_id ?? startDayId
  if (!startDayId || startDayId === endDayId) return 'single'
  if (dayId === startDayId) return 'start'
  if (dayId === endDayId) return 'end'
  return 'middle'
}

/**
 * Booking types that carry no information on the days between their start and end and
 * therefore drop out of the day timeline there. A parked car just stands in the garage:
 * you only need to know when you hand it over and when you collect it, so the days in
 * between show nothing at all, not even a badge in the day header (#1937).
 *
 * A car rental is deliberately NOT in this set: its middle days are not dropped but
 * moved into the day header, which is what people expect from a vehicle they are
 * driving around. Kept as a set so another such type can join without editing every
 * render site again.
 */
const MIDDLE_DAY_HIDDEN_TYPES = new Set(['parking'])

export function hidesOnMiddleDay(
  r: { type?: string | null; day_id?: number | null; end_day_id?: number | null },
  dayId: number
): boolean {
  return !!r.type && MIDDLE_DAY_HIDDEN_TYPES.has(r.type) && getSpanPhase(r, dayId) === 'middle'
}

/**
 * Bookings you ride and then leave behind: the vehicle carries you out of the day's
 * geography and keeps going without you. Their endpoints are therefore not the ends of
 * a drive — you did not drive to tonight's hotel from the airport you took off from, and
 * you did not drive to the airport you landed at from this morning's hotel (#2133).
 *
 * A hire car, a parked car or a hired bike is the exact opposite and must stay out of
 * this set: you collect the vehicle and keep driving it, so a multi-day rental's pickup
 * point IS where a drive to the hotel starts, and its drop-off point IS where a drive
 * from the hotel ends (both pinned by the car-rental span rules above).
 *
 * `taxi`, `transit` and `transport_other` are left out on purpose: they are same-day
 * hops, so both their endpoints land on the day anyway and the distinction never fires.
 * Keeping them out means this set cannot change any behaviour they have today.
 */
const CARRIER_TRANSPORT_TYPES = new Set(['flight', 'train', 'ferry', 'cruise', 'bus'])

export function isCarrierTransport(r: { type?: string | null }): boolean {
  return !!r.type && CARRIER_TRANSPORT_TYPES.has(r.type)
}

/**
 * The route waypoints a transport contributes on a given day, respecting multi-day spans.
 * A car rental (or any reservation whose span covers several days) is only routed to on its
 * pickup day (the departure endpoint) and from on its drop-off day (the arrival endpoint) — on
 * the days in between you simply hold the vehicle, so it adds no waypoints and must not pull the
 * route to those points. Single-day transports contribute both endpoints.
 */
export function getTransportRouteEndpoints(
  r: any,
  dayId: number
): { from: { lat: number; lng: number } | null; to: { lat: number; lng: number } | null } {
  // A leg of a multi-leg booking spans its OWN pair of airports, endpoints[i] and
  // endpoints[i+1] — not the booking's outermost two. Handing back the booking's
  // from/to for every leg put a stop between two legs on a road route from the
  // arrival airport back to the departure one (#2071).
  //
  // Only when the endpoints line up one-per-stop with the legs. An endpoint that
  // failed to geocode never reaches the row, and a short list would silently map
  // every earlier leg to the wrong pair — so an ambiguous booking keeps the role
  // lookup it has always used.
  const ordered = orderedEndpoints(r)
  const legIdx: number | null =
    r.__leg && ordered.length === r.__leg.total + 1 ? (r.__leg.index as number) : null
  const point = (e: { lat?: number | null; lng?: number | null } | undefined): { lat: number; lng: number } | null =>
    e && e.lat != null && e.lng != null ? { lat: e.lat, lng: e.lng } : null
  const ep = (role: 'from' | 'to'): { lat: number; lng: number } | null => {
    if (legIdx != null) return point(ordered[role === 'from' ? legIdx : legIdx + 1])
    return point((r.endpoints || []).find((x: { role?: string }) => x.role === role))
  }
  switch (getSpanPhase(r, dayId)) {
    case 'start':
      return { from: ep('from'), to: null }
    case 'end':
      return { from: null, to: ep('to') }
    case 'middle':
      return { from: null, to: null }
    default:
      return { from: ep('from'), to: ep('to') }
  }
}

/**
 * Whether this booking is a carrier that contributes a located route endpoint on the
 * given day — the signal that the day's geography changes by riding something rather
 * than driving, which the hotel-bookend rules need on days without recorded
 * check-in/check-out times (#2157). The span rules above make an overnight carrier
 * count only on the days it actually touches. A carrier saved without coordinates
 * deliberately does not count: it contributes nothing to the drawn route, so treating
 * it as proof of travel would flip hotel legs on data the map cannot see.
 */
export function hasCarrierEndpointOnDay(r: any, dayId: number): boolean {
  if (!isCarrierTransport(r)) return false
  const { from, to } = getTransportRouteEndpoints(r, dayId)
  return from != null || to != null
}

export function getDisplayTimeForDay(
  r: { day_id?: number | null; end_day_id?: number | null; reservation_time?: string | null; reservation_end_time?: string | null },
  dayId: number
): string | null {
  const phase = getSpanPhase(r, dayId)
  if (phase === 'end') return r.reservation_end_time || null
  if (phase === 'middle') return null
  return r.reservation_time || null
}

/** Per-leg detail of a multi-leg flight or train, or null for single-leg / other. */
function parseMultiLegs(r: any): any[] | null {
  if (r?.type !== 'flight' && r?.type !== 'train') return null
  let meta = r.metadata
  if (typeof meta === 'string') { try { meta = JSON.parse(meta || '{}') } catch { meta = {} } }
  // Defensive: recover metadata that was accidentally double-encoded by an earlier
  // bug (a JSON string of a JSON string) so already-saved bookings heal on read.
  if (typeof meta === 'string') { try { meta = JSON.parse(meta || '{}') } catch { meta = {} } }
  if (meta && Array.isArray(meta.legs) && meta.legs.length > 1) return meta.legs
  return null
}

/**
 * Expand a multi-leg flight/train into one synthetic reservation per leg that
 * touches `dayId`, each with its own day span + departure/arrival time so it
 * slots into the timeline independently. A single-leg booking (or any other
 * reservation) is returned untouched, so existing behaviour is unchanged.
 */
export function expandFlightLegsForDay(
  r: any,
  dayId: number,
  getDayOrder: (id: number) => number,
  days: Array<{ id: number; date?: string | null }>
): any[] {
  const legs = parseMultiLegs(r)
  if (!legs) return [r]
  const dateOf = (id: number | null): string | null => (id == null ? null : (days.find(d => d.id === id)?.date ?? null))
  const thisOrder = getDayOrder(dayId)
  const out: any[] = []
  legs.forEach((leg, i) => {
    const dep = leg.dep_day_id ?? r.day_id ?? null
    const arr = leg.arr_day_id ?? dep
    if (dep == null) return
    const depOrder = getDayOrder(dep)
    const arrOrder = getDayOrder(arr ?? dep)
    if (!(thisOrder >= depOrder && thisOrder <= arrOrder)) return
    const depDate = dateOf(dep)
    const arrDate = dateOf(arr ?? dep)
    out.push({
      ...r,
      day_id: dep,
      end_day_id: arr ?? dep,
      reservation_time: leg.dep_time ? (depDate ? `${depDate}T${leg.dep_time}` : leg.dep_time) : null,
      reservation_end_time: leg.arr_time ? (arrDate ? `${arrDate}T${leg.arr_time}` : leg.arr_time) : null,
      // Each leg carries its OWN saved position (not the booking's) so items can be
      // dropped between legs and persist; absent → falls back to time ordering.
      day_positions: leg.day_positions || undefined,
      day_plan_position: undefined,
      __leg: {
        index: i, total: legs.length,
        from: leg.from ?? null, to: leg.to ?? null,
        airline: leg.airline ?? null, flight_number: leg.flight_number ?? null,
        // Train legs carry their own per-leg detail; added only for trains so a
        // flight's __leg object stays byte-identical to before.
        ...(r.type === 'train' ? { train_number: leg.train_number ?? null, platform: leg.platform ?? null, seat: leg.seat ?? null } : {}),
      },
    })
  })
  return out
}

/** Filter reservations that are active transports for the given day, excluding assignment-linked ones. */
export function getTransportForDay(opts: {
  reservations: any[]
  dayId: number
  dayAssignmentIds: number[]
  days: Array<{ id: number; day_number?: number; date?: string | null }>
}): any[] {
  const { reservations, dayId, dayAssignmentIds, days } = opts

  const getDayOrder = (id: number): number => {
    const d = days.find(x => x.id === id)
    return d ? ((d as any).day_number ?? days.indexOf(d)) : 0
  }
  const thisDayOrder = getDayOrder(dayId)

  return reservations.filter(r => {
    if (r.type === 'hotel') return false
    if (r.assignment_id && dayAssignmentIds.includes(r.assignment_id)) return false

    const startDayId = r.day_id
    const endDayId = r.end_day_id ?? startDayId

    if (startDayId == null) return false

    if (endDayId !== startDayId) {
      const startOrder = getDayOrder(startDayId)
      const endOrder = getDayOrder(endDayId)
      return thisDayOrder >= startOrder && thisDayOrder <= endOrder
    }
    return startDayId === dayId
  }).flatMap(r => expandFlightLegsForDay(r, dayId, getDayOrder, days))
}

/**
 * Every booking pinned to one day assignment. A stop can carry several (the parking
 * pass and the tickets for the same zoo), and the exclusion above keeps all of them
 * out of the timeline, so the place row is the only surface that can show them, and
 * a `find()` there dropped the rest without trace (#2201).
 *
 * Earliest first, untimed last, id as the tiebreaker: the store's array order is
 * newest-first for locally created bookings and load order otherwise, which would
 * shuffle the same two bookings between a reload and a live update.
 */
export function getAssignmentReservations<T extends {
  id: number
  assignment_id?: number | null
  reservation_time?: string | null
}>(reservations: T[], assignmentId: number | null | undefined): T[] {
  if (!assignmentId) return []
  return reservations
    .filter(r => r.assignment_id === assignmentId)
    .sort((a, b) => {
      const at = a.reservation_time || ''
      const bt = b.reservation_time || ''
      if (at !== bt) {
        if (!at) return 1
        if (!bt) return -1
        return at < bt ? -1 : 1
      }
      return a.id - b.id
    })
}

/**
 * Order items chronologically: anything with a time (a place's place_time, a
 * transport/leg display time, a timed note) sorts by that time. An item WITHOUT a
 * time inherits the time of the timed item before it, so untimed items stay where
 * they were manually placed. Stable on the incoming order for ties.
 */
function applyChronoOrder(
  items: MergedItem[],
  dayId: number,
  getDisplayTime: (r: any, dayId: number) => string | null
): MergedItem[] {
  const timeOf = (it: MergedItem): number | null => {
    if (it.type === 'place') return parseTimeToMinutes(it.data?.place?.place_time)
    if (it.type === 'note') return parseTimeToMinutes(it.data?.time)
    return parseTimeToMinutes(getDisplayTime(it.data, dayId))
  }
  let last = -Infinity
  return items
    .map((it, i) => {
      const t = timeOf(it)
      if (t != null) last = t
      return { it, i, eff: t != null ? t : last }
    })
    .sort((a, b) => a.eff - b.eff || a.i - b.i)
    .map(k => k.it)
}

/** Merge places, notes, and transports into a single ordered day timeline. */
export function getMergedItems(opts: {
  dayAssignments: any[]
  dayNotes: any[]
  dayTransports: any[]
  dayId: number
  getDisplayTime?: (r: any, dayId: number) => string | null
}): MergedItem[] {
  const { dayAssignments: da, dayNotes: dn, dayTransports: transport, dayId } = opts
  const getDisplayTime = opts.getDisplayTime ?? getDisplayTimeForDay

  const baseItems: MergedItem[] = [
    ...da.map(a => ({ type: 'place' as const, sortKey: a.order_index, data: a })),
    ...dn.map(n => ({ type: 'note' as const, sortKey: n.sort_order ?? 0, data: n })),
  ].sort((a, b) => a.sortKey - b.sortKey)

  const timedTransports = transport.map(r => ({
    type: 'transport' as const,
    data: r,
    minutes: parseTimeToMinutes(getDisplayTime(r, dayId)) ?? 0,
  })).sort((a, b) => a.minutes - b.minutes)

  if (timedTransports.length === 0) return applyChronoOrder(baseItems, dayId, getDisplayTime)
  if (baseItems.length === 0) {
    return applyChronoOrder(timedTransports.map((item, i) => ({ type: item.type, sortKey: i, data: item.data })), dayId, getDisplayTime)
  }

  // Insert transports among base items based on per-day position or time
  const result = [...baseItems]
  for (let ti = 0; ti < timedTransports.length; ti++) {
    const timed = timedTransports[ti]
    const minutes = timed.minutes

    // Per-day position takes precedence (set by user reorder), then the booking's
    // own slot. The map's waypoint builder has always read day_plan_position and
    // this never did, so a booking carrying only that value sat between the places
    // on the map and at the bottom of the day everywhere else (#2071).
    const perDayPos = timed.data.day_positions?.[dayId]
      ?? timed.data.day_positions?.[String(dayId)]
      ?? timed.data.day_plan_position
    if (perDayPos != null) {
      result.push({ type: timed.type, sortKey: perDayPos, data: timed.data })
      continue
    }

    // Time-based fallback: insert after the last item whose time <= this transport's time
    let insertAfterKey = -Infinity
    for (const item of result) {
      if (item.type === 'place') {
        const pm = parseTimeToMinutes(item.data?.place?.place_time)
        if (pm !== null && pm <= minutes) insertAfterKey = item.sortKey
      } else if (item.type === 'transport') {
        const tm = parseTimeToMinutes(item.data?.reservation_time)
        if (tm !== null && tm <= minutes) insertAfterKey = item.sortKey
      }
    }

    const lastKey = result.length > 0 ? Math.max(...result.map(i => i.sortKey)) : 0
    const sortKey = insertAfterKey === -Infinity
      ? lastKey + 0.5 + ti * 0.01
      : insertAfterKey + 0.01 + ti * 0.001

    result.push({ type: timed.type, sortKey, data: timed.data })
  }

  return applyChronoOrder(result.sort((a, b) => a.sortKey - b.sortKey), dayId, getDisplayTime)
}
