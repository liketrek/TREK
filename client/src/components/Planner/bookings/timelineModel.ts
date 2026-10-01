import type { Day, Reservation } from '../../../types'
import { daySpan, parseMeta } from './bookingsModel'
import { splitReservationDateTime } from '../../../utils/formatters'

export interface AxisDay {
  /** The calendar date, or null on a trip whose days carry no dates. */
  date: string | null
  dayNumber: number | null
  dayId: number | null
  title: string | null
}

/** The trip's days in order: its dated days, or day 1..N when the days have no dates. */
export function buildAxis(days: Day[]): AxisDay[] {
  const dated = days.filter(d => d.date).sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : 0))
  if (dated.length > 0) return dated.map(d => ({ date: d.date!, dayNumber: d.day_number, dayId: d.id, title: d.title ?? null }))
  return days.slice().sort((a, b) => a.day_number - b.day_number).map(d => ({ date: null, dayNumber: d.day_number, dayId: d.id, title: d.title ?? null }))
}

export interface Moment { day: number; hour: number }
export type Placement = { kind: 'on'; start: Moment; end: Moment } | { kind: 'before' | 'after' | 'undated' }

const toHour = (time: string | null | undefined, fallback: number) => {
  if (!time) return fallback
  const [h, m] = time.split(':').map(Number)
  return Number.isFinite(h) ? h + (Number.isFinite(m) ? m / 60 : 0) : fallback
}

/**
 * Where a booking sits on the axis, both ends in their own local time as the day
 * plan draws them. A hotel runs from check-in to check-out (15:00 and 11:00 when
 * the booking does not say), anything without an end gets one hour.
 */
export function placeReservation(r: Reservation, axis: AxisDay[], days: Day[]): Placement {
  const meta = parseMeta(r)
  const span = daySpan(r, days)
  const eps = (r.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
  const from = eps.find(e => e.role === 'from')
  const to = eps.find(e => e.role === 'to')
  const s = splitReservationDateTime(r.reservation_time)
  const e = splitReservationDateTime(r.reservation_end_time)
  const hotel = r.type === 'hotel'

  const index = (date: string | null | undefined, dayId: number | null | undefined): number | 'before' | 'after' | null => {
    if (axis.length === 0) return null
    if (axis[0].date) {
      if (!date) return null
      if (date < axis[0].date) return 'before'
      if (date > axis[axis.length - 1].date!) return 'after'
      const i = axis.findIndex(a => a.date === date)
      return i >= 0 ? i : null
    }
    if (dayId == null) return null
    const i = axis.findIndex(a => a.dayId === dayId)
    return i >= 0 ? i : null
  }

  const startDate = hotel ? span.start?.date ?? s.date : s.date ?? from?.local_date ?? span.start?.date
  const startDayId = hotel ? span.start?.id ?? r.day_id : r.day_id ?? span.start?.id
  const si = index(startDate, startDayId)
  if (si === null) return { kind: 'undated' }
  if (si === 'before' || si === 'after') return { kind: si }

  const startHour = hotel ? toHour(meta.check_in_time, 15) : toHour(s.time || from?.local_time, 9)
  const endDate = hotel ? span.end?.date ?? e.date : e.date ?? to?.local_date ?? span.end?.date ?? startDate
  const endDayId = hotel ? span.end?.id ?? r.end_day_id : r.end_day_id ?? span.end?.id ?? startDayId
  let ei = index(endDate, endDayId)
  const openEnded = ei === null
  if (ei === null) ei = hotel ? Math.min(si + 1, axis.length - 1) : si
  const endHourRaw = hotel ? toHour(meta.check_out_time, 11) : toHour(e.time || to?.local_time, startHour + 1)
  let end: Moment = ei === 'after' ? { day: axis.length - 1, hour: 24 } : ei === 'before' ? { day: si, hour: startHour + 1 } : { day: ei, hour: endHourRaw }
  // A stay checked into on the last day with no end runs to the end of the axis, not back before its check-in.
  if (hotel && openEnded && end.day === si && end.hour <= startHour) end = { day: si, hour: 24 }
  // An arrival that reads earlier than the departure in local time (a date line, a typo) keeps a small bar.
  if (end.day < si || (end.day === si && end.hour <= startHour)) return { kind: 'on', start: { day: si, hour: startHour }, end: { day: si, hour: startHour + 1 } }
  return { kind: 'on', start: { day: si, hour: startHour }, end }
}

/** A moment as hours since the start of the axis' first day. */
export const absHour = (m: Moment) => m.day * 24 + m.hour

/**
 * The hours a day view shows: 06:00 to 22:00, widened to whatever starts or
 * ends on that day earlier or later, so nothing on the day is cut off.
 */
export function dayWindow(items: { start: Moment; end: Moment }[], day: number): { from: number; to: number } {
  let from = 6
  let to = 22
  for (const it of items) {
    if (it.start.day === day) { from = Math.min(from, Math.floor(it.start.hour)); to = Math.max(to, Math.ceil(it.start.hour + 1)) }
    if (it.end.day === day) { to = Math.max(to, Math.ceil(it.end.hour)); from = Math.min(from, Math.floor(it.end.hour - 1)) }
  }
  return { from: Math.max(0, from), to: Math.min(24, to) }
}

export interface Bar { r: Reservation; lane: number; x: number; w: number; cutStart: boolean; cutEnd: boolean }

/**
 * Packs bars into as few lanes as possible, using the width a bar is DRAWN with
 * (never narrower than `minWidth`), so two clickable bars never overlap. `toX`
 * places a moment in pixels; a bar reaching past 0 or `max` is cut there and
 * says so, for the day view's arrows.
 */
export function packBars(items: { r: Reservation; start: Moment; end: Moment }[], toX: (m: Moment) => number, max: number, minWidth = 26, gap = 4): { bars: Bar[]; lanes: number } {
  const sorted = items.map(i => {
    const a = toX(i.start)
    const b = toX(i.end)
    const w = Math.max(minWidth, Math.min(max, b) - Math.max(0, a))
    const x = Math.min(Math.max(0, a), Math.max(0, max - w))
    return { r: i.r, x, w, cutStart: a < 0, cutEnd: b > max }
  }).sort((p, q) => p.x - q.x)
  const laneEnds: number[] = []
  const bars: Bar[] = []
  for (const it of sorted) {
    let lane = laneEnds.findIndex(end => end + gap <= it.x)
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(0) }
    laneEnds[lane] = it.x + it.w
    bars.push({ ...it, lane })
  }
  return { bars, lanes: Math.max(1, laneEnds.length) }
}
