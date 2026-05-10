export const TRANSPORT_TYPES = new Set(['flight', 'train', 'bus', 'car', 'cruise'])

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

/** Filter reservations that are active transports for the given day, excluding assignment-linked ones. */
export function getTransportForDay(opts: {
  reservations: any[]
  dayId: number
  dayAssignmentIds: number[]
  days: Array<{ id: number; day_number?: number }>
}): any[] {
  const { reservations, dayId, dayAssignmentIds, days } = opts

  const getDayOrder = (id: number): number => {
    const d = days.find(x => x.id === id)
    return d ? ((d as any).day_number ?? days.indexOf(d)) : 0
  }
  const thisDayOrder = getDayOrder(dayId)

  return reservations.filter(r => {
    if (!TRANSPORT_TYPES.has(r.type)) return false
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
  })
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

  if (timedTransports.length === 0) return baseItems
  if (baseItems.length === 0) {
    return timedTransports.map((item, i) => ({ type: item.type, sortKey: i, data: item.data }))
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

  return result.sort((a, b) => a.sortKey - b.sortKey)
}
