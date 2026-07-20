import { useEffect, useMemo, useState } from 'react'
import { Zap } from 'lucide-react'
import { pluginsApi, type PluginDayScheduleItem } from '../../api/client'

/**
 * Host-rendered rows for the `dayScheduleProvider` plugin hook — time
 * contributions in the day plan ("35 min charging at this stop", "45 min
 * security before this flight"). Everything here is host-vetted data from
 * /api/day-schedule; the hook groups it by anchor so the timelines can slot
 * a row under the right place/booking (or at a day's start/end), and sums
 * the minutes per day for the route footer.
 */
const TONE_COLORS: Record<PluginDayScheduleItem['tone'], string> = {
  default: '#4F46E5',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
}

export interface PluginDaySchedule {
  /** dayId → assignmentId → rows anchored under that place row. */
  byAssignment: Record<number, Record<number, PluginDayScheduleItem[]>>
  /** dayId → reservationId → rows anchored under that booking row. */
  byReservation: Record<number, Record<number, PluginDayScheduleItem[]>>
  /** dayId → rows pinned to the start / end of the day (end = default anchor). */
  byPosition: Record<number, { start: PluginDayScheduleItem[]; end: PluginDayScheduleItem[] }>
  /** dayId → total contributed minutes (for the route-footer "+X min"). */
  minutesByDay: Record<number, number>
}

const EMPTY: PluginDaySchedule = { byAssignment: {}, byReservation: {}, byPosition: {}, minutesByDay: {} }

export function usePluginDaySchedule(tripId?: number | string | null): PluginDaySchedule {
  const [items, setItems] = useState<PluginDayScheduleItem[]>([])

  useEffect(() => {
    if (tripId == null) { setItems([]); return }
    let alive = true
    pluginsApi.daySchedule(tripId)
      .then(r => { if (alive) setItems(r.items || []) })
      .catch(() => { if (alive) setItems([]) }) // fail-safe: no extra rows
    return () => { alive = false }
  }, [tripId])

  return useMemo(() => {
    if (items.length === 0) return EMPTY
    const out: PluginDaySchedule = { byAssignment: {}, byReservation: {}, byPosition: {}, minutesByDay: {} }
    for (const it of items) {
      if (it.assignmentId != null) {
        const day = (out.byAssignment[it.dayId] ??= {})
        ;(day[it.assignmentId] ??= []).push(it)
      } else if (it.reservationId != null) {
        const day = (out.byReservation[it.dayId] ??= {})
        ;(day[it.reservationId] ??= []).push(it)
      } else {
        const day = (out.byPosition[it.dayId] ??= { start: [], end: [] })
        day[it.position === 'start' ? 'start' : 'end'].push(it)
      }
      if (it.minutes) out.minutesByDay[it.dayId] = (out.minutesByDay[it.dayId] || 0) + it.minutes
    }
    return out
  }, [items])
}

export function formatScheduleMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

/** One contributed row — a slim line in the timeline, styled like the route
 * connectors so it reads as schedule information, not as an itinerary item. */
export function PluginDayScheduleRow({ item }: { item: PluginDayScheduleItem }) {
  const color = TONE_COLORS[item.tone] ?? TONE_COLORS.default
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 14px', fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))', color: 'var(--text-muted)', lineHeight: 1.3 }}>
      <Zap size={11} strokeWidth={2} style={{ color, flexShrink: 0 }} />
      {item.minutes != null && <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatScheduleMinutes(item.minutes)}</span>}
      {item.minutes != null && <span style={{ opacity: 0.4 }}>·</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
    </div>
  )
}
