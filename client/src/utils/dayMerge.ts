export const TRANSPORT_TYPES = new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transport_other'])

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
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return parts[0] * 60 + parts[1]
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

export function getDisplayTimeForDay(
  r: { day_id?: number | null; end_day_id?: number | null; reservation_time?: string | null; reservation_end_time?: string | null },
  dayId: number
): string | null {
  const phase = getSpanPhase(r, dayId)
  if (phase === 'end') return r.reservation_end_time || null
  if (phase === 'middle') return null
  return r.reservation_time || null
}

/** Per-leg detail of a multi-leg flight, or null for single-leg / non-flight. */
function parseFlightLegs(r: any): any[] | null {
  if (r?.type !== 'flight') return null
  let meta = r.metadata
  if (typeof meta === 'string') { try { meta = JSON.parse(meta || '{}') } catch { meta = {} } }
  // Defensive: recover metadata that was accidentally double-encoded by an earlier
  // bug (a JSON string of a JSON string) so already-saved flights heal on read.
  if (typeof meta === 'string') { try { meta = JSON.parse(meta || '{}') } catch { meta = {} } }
  if (meta && Array.isArray(meta.legs) && meta.legs.length > 1) return meta.legs
  return null
}

/**
 * Expand a multi-leg flight into one synthetic reservation per leg that touches
 * `dayId`, each with its own day span + departure/arrival time so it slots into
 * the timeline independently. A single-leg flight (or any other reservation) is
 * returned untouched, so existing behaviour is unchanged.
 */
export function expandFlightLegsForDay(
  r: any,
  dayId: number,
  getDayOrder: (id: number) => number,
  days: Array<{ id: number; date?: string | null }>
): any[] {
  const legs = parseFlightLegs(r)
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
      __leg: { index: i, total: legs.length, from: leg.from ?? null, to: leg.to ?? null, airline: leg.airline ?? null, flight_number: leg.flight_number ?? null },
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

    // Per-day position takes precedence (set by user reorder)
    const perDayPos = timed.data.day_positions?.[dayId] ?? timed.data.day_positions?.[String(dayId)]
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
