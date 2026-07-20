import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getDisplayTimeForDay, getSpanPhase, parseTimeToMinutes } from '../../../../utils/dayMerge'
import { getDayBookendHotels, isDayInAccommodationRange } from '../../../../utils/dayOrder'
import type { MergedItem } from '../../../../utils/dayMerge'
import type { TransitLegDisplay } from '../../../../components/Planner/transitDisplay'
import type { Accommodation, Assignment, Day, DayNote, Reservation, RouteSegment, TranslationFn } from '../../../../types'

/**
 * Pure derivations for the mobile plan timeline: merged-item → row mapping,
 * connector matching against the calculated route legs, hotel header chips,
 * the up-next pick and small formatting helpers. No store access here.
 */

/** A day-timeline transport row can be a synthetic per-leg expansion of a multi-leg booking. */
export type TransportEntry = Reservation & {
  __leg?: { index: number; total: number; from: string | null; to: string | null }
}

export interface TransitMeta {
  legs: TransitLegDisplay[]
  transfers?: number
  duration?: number
}

export type PlanRow =
  | { key: string; kind: 'place'; item: MergedItem; assignment: Assignment; linkedRes: Reservation | null }
  | { key: string; kind: 'transport'; item: MergedItem; res: TransportEntry }
  | { key: string; kind: 'transit'; item: MergedItem; res: TransportEntry; transit: TransitMeta }
  | { key: string; kind: 'note'; item: MergedItem; note: DayNote }
  | { key: string; kind: 'conn'; seg: RouteSegment }

export function parseReservationMeta(res: Reservation): Record<string, unknown> {
  let meta: unknown = res.metadata
  // Defensive double-parse: heals metadata that an earlier bug double-encoded.
  if (typeof meta === 'string') { try { meta = JSON.parse(meta || '{}') } catch { meta = {} } }
  if (typeof meta === 'string') { try { meta = JSON.parse(meta || '{}') } catch { meta = {} } }
  return meta && typeof meta === 'object' ? (meta as Record<string, unknown>) : {}
}

/** Transit journey metadata (#1065) — present on 'transit' reservations saved from Transitous. */
export function getTransitMeta(res: Reservation): TransitMeta | null {
  if (res.type !== 'transit') return null
  const transit = parseReservationMeta(res).transit as TransitMeta | undefined
  return transit && Array.isArray(transit.legs) ? transit : null
}

/** Same subtitle language as the desktop day plan: airline/number, train/platform/seat, leg detail. */
export function transportSubtitle(res: TransportEntry): string {
  const meta = parseReservationMeta(res) as Record<string, string | undefined>
  if (res.__leg) {
    const parts = [res.__leg.from, res.__leg.to].filter(Boolean).length
      ? [[res.__leg.from, res.__leg.to].filter(Boolean).join(' → ')]
      : []
    return parts.join(' · ')
  }
  if (res.type === 'flight') {
    const parts = [meta.airline, meta.flight_number].filter(Boolean) as string[]
    if (meta.departure_airport || meta.arrival_airport) {
      parts.push([meta.departure_airport, meta.arrival_airport].filter(Boolean).join(' → '))
    }
    return parts.join(' · ')
  }
  if (res.type === 'train') {
    return [meta.train_number, meta.platform ? `Gl. ${meta.platform}` : '', meta.seat ? `Sitz ${meta.seat}` : '']
      .filter(Boolean).join(' · ')
  }
  return res.location || ''
}

const sameCoord = (a: [number, number], b: [number, number]): boolean =>
  Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9

/**
 * Map the day's merged items to render rows and slot a travel-time connector
 * after every located place whose next located stop is again a place. Segments
 * are matched by their exact waypoint coordinates (the calculator echoes the
 * input waypoints back on each leg), so hotel-bookend or transport legs in the
 * pool simply never match and no index bookkeeping is needed.
 */
export function buildPlanRows(opts: {
  merged: MergedItem[]
  reservations: Reservation[]
  routeSegments: RouteSegment[]
  dayId: number
}): PlanRow[] {
  const { merged, reservations, routeSegments, dayId } = opts
  const pool = [...routeSegments]
  const takeSegment = (from: [number, number], to: [number, number]): RouteSegment | null => {
    const idx = pool.findIndex(s => sameCoord(s.from, from) && sameCoord(s.to, to))
    return idx >= 0 ? pool.splice(idx, 1)[0] : null
  }

  const base: PlanRow[] = []
  for (const item of merged) {
    if (item.type === 'place') {
      const assignment = item.data as Assignment
      base.push({
        key: `pl-${assignment.id}`,
        kind: 'place',
        item,
        assignment,
        linkedRes: reservations.find(r => r.assignment_id === assignment.id) ?? null,
      })
    } else if (item.type === 'note') {
      const note = item.data as DayNote
      base.push({ key: `note-${note.id}`, kind: 'note', item, note })
    } else {
      const res = item.data as TransportEntry
      // A car rental's middle days live in the day header, not the timeline.
      if (res.type === 'car' && getSpanPhase(res, dayId) === 'middle') continue
      const transit = getTransitMeta(res)
      const key = `tr-${res.id}${res.__leg ? `-leg${res.__leg.index}` : ''}`
      if (transit) base.push({ key, kind: 'transit', item, res, transit })
      else base.push({ key, kind: 'transport', item, res })
    }
  }

  const coordOf = (row: PlanRow): [number, number] | null =>
    row.kind === 'place' && row.assignment.place?.lat != null && row.assignment.place?.lng != null
      ? [row.assignment.place.lat, row.assignment.place.lng]
      : null

  const out: PlanRow[] = []
  for (let i = 0; i < base.length; i++) {
    const row = base[i]
    out.push(row)
    const from = coordOf(row)
    if (!from) continue
    // Next located stop: a following place connects (possibly across notes);
    // any transport/transit in between means that hop is the ride, not a walk.
    let seg: RouteSegment | null = null
    for (let j = i + 1; j < base.length; j++) {
      const next = base[j]
      if (next.kind === 'transport' || next.kind === 'transit') break
      const to = coordOf(next)
      if (to) { seg = takeSegment(from, to); break }
    }
    if (seg) out.push({ key: `conn-${row.key}`, kind: 'conn', seg })
  }
  return out
}

export interface HotelChip {
  key: string
  variant: 'checkout' | 'checkin' | 'stay'
  name: string
  time: string | null
}

const accommodationName = (a: Accommodation): string => a.place_name || a.reservation_title || ''

/** Check-out / check-in / stay chips of the timeline header, in demo order (out → in → stay). */
export function hotelChipsForDay(day: Day, days: Day[], accommodations: Accommodation[]): HotelChip[] {
  const inRange = accommodations.filter(a => isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days))
  const chips: HotelChip[] = []
  for (const a of inRange) {
    if (a.end_day_id === day.id) {
      chips.push({ key: `out-${a.id}`, variant: 'checkout', name: accommodationName(a), time: a.check_out || null })
    } else if (a.start_day_id === day.id) {
      chips.push({ key: `in-${a.id}`, variant: 'checkin', name: accommodationName(a), time: a.check_in || null })
    } else {
      chips.push({ key: `stay-${a.id}`, variant: 'stay', name: accommodationName(a), time: null })
    }
  }
  const rank = { checkout: 0, checkin: 1, stay: 2 }
  return chips.filter(c => c.name).sort((a, b) => rank[a.variant] - rank[b.variant])
}

export interface HotelLeg { seg: RouteSegment; name: string }
export interface HotelLegs { top: HotelLeg | null; bottom: HotelLeg | null }

/**
 * The two accommodation bookend legs of a day: the drive from the day's hotel to
 * the first stop (top) and from the last stop back to the hotel (bottom). The
 * route calc already produced these via withHotelBookends — honouring the
 * optimize-from-accommodation setting and the should-draw gates — so we just
 * locate the pooled segment that starts (top) / ends (bottom) at the hotel's
 * coordinates. Its presence is exactly the signal that the leg should be drawn.
 */
export function hotelLegsForDay(
  day: Day,
  days: Day[],
  accommodations: Accommodation[],
  routeSegments: RouteSegment[],
): HotelLegs {
  const { morning, evening } = getDayBookendHotels(day, days, accommodations)
  const legAt = (a: Accommodation | undefined, end: 'from' | 'to'): HotelLeg | null => {
    if (!a || a.place_lat == null || a.place_lng == null) return null
    const coord: [number, number] = [a.place_lat, a.place_lng]
    const seg = routeSegments.find(s => sameCoord(end === 'from' ? s.from : s.to, coord))
    return seg ? { seg, name: accommodationName(a) } : null
  }
  return { top: legAt(morning, 'from'), bottom: legAt(evening, 'to') }
}

/** The day headline as city pills — a "Tokyo → Kyoto" title becomes two pills with an arrow. */
export function cityPillsForDay(day: Day | undefined, t: TranslationFn): string[] {
  const title = day?.title?.trim()
  if (title) {
    const parts = title.split('→').map(p => p.trim()).filter(Boolean)
    if (parts.length > 0) return parts
  }
  return [t('planner.dayN', { n: day?.day_number ?? 0 })]
}

export interface UpNext {
  assignment: Assignment
  /** Minutes until the start time — only when the day is today and the stop is still ahead. */
  minutesUntil: number | null
}

const localIsoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * The "UP NEXT" pick: on today's day the first timed stop that hasn't started
 * yet (with a real countdown); otherwise the first timed stop of the day, or
 * simply the first stop. Null when the day has no places.
 */
export function findUpNext(day: Day | undefined, dayAssignments: Assignment[], now: Date): UpNext | null {
  if (dayAssignments.length === 0) return null
  const sorted = [...dayAssignments].sort((a, b) => a.order_index - b.order_index)
  const timeOf = (a: Assignment) => parseTimeToMinutes(a.place?.place_time)
  const isToday = !!day?.date && day.date.slice(0, 10) === localIsoDate(now)
  if (isToday) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const upcoming = sorted
      .filter(a => { const m = timeOf(a); return m != null && m >= nowMinutes })
      .sort((a, b) => (timeOf(a) ?? 0) - (timeOf(b) ?? 0))
    if (upcoming.length > 0) return { assignment: upcoming[0], minutesUntil: (timeOf(upcoming[0]) ?? 0) - nowMinutes }
  }
  const timed = sorted.filter(a => timeOf(a) != null).sort((a, b) => (timeOf(a) ?? 0) - (timeOf(b) ?? 0))
  return { assignment: timed[0] ?? sorted[0], minutesUntil: null }
}

/** Whether a merged item carries its own time (places/notes) or display time (transports). */
export function itemHasTime(item: MergedItem, dayId: number): boolean {
  if (item.type === 'place') return parseTimeToMinutes((item.data as Assignment).place?.place_time) != null
  if (item.type === 'note') return parseTimeToMinutes((item.data as DayNote).time) != null
  return parseTimeToMinutes(getDisplayTimeForDay(item.data as Reservation, dayId)) != null
}

/** Would the proposed merged order violate the chronology of its timed items? */
export function breaksChronology(
  order: MergedItem[],
  dayId: number,
  getDisplayTime: (r: Reservation, dayId: number) => string | null,
): boolean {
  const times = order
    .map(it => {
      if (it.type === 'place') return parseTimeToMinutes((it.data as Assignment).place?.place_time)
      if (it.type === 'note') return parseTimeToMinutes((it.data as DayNote).time)
      return parseTimeToMinutes(getDisplayTime(it.data as Reservation, dayId))
    })
    .filter((m): m is number => m != null)
  return times.some((m, i) => i > 0 && m < times[i - 1])
}

const WEATHER_ICON_MAP: Record<string, LucideIcon> = {
  Clear: Sun, Clouds: Cloud, Rain: CloudRain, Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning, Snow: CloudSnow, Mist: Wind, Fog: Wind, Haze: Wind,
}

export function weatherIconFor(main: string | undefined): LucideIcon {
  return (main && WEATHER_ICON_MAP[main]) || Cloud
}
