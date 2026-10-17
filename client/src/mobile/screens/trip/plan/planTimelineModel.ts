import {
  TRANSPORT_TYPES, getAssignmentReservations, getDisplayTimeForDay, getSpanPhase, getTransportRouteEndpoints, hidesOnMiddleDay,
  parseTimeToMinutes,
} from '../../../../utils/dayMerge'
import { getDayBookendHotels, isDayInAccommodationRange } from '../../../../utils/dayOrder'
import type { MergedItem } from '../../../../utils/dayMerge'
import type { TransitLegDisplay } from '../../../../components/Planner/transitDisplay'
import { projectDayItinerary } from '../../../../components/Map/dayTourProjection'
import type { Accommodation, Assignment, Day, DayNote, Place, Reservation, RouteSegment, TranslationFn } from '../../../../types'

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
  | { key: string; kind: 'place'; item: MergedItem; assignment: Assignment; linkedReservations: Reservation[]; invalidTour?: boolean }
  | { key: string; kind: 'transport'; item: MergedItem; res: TransportEntry }
  | { key: string; kind: 'transit'; item: MergedItem; res: TransportEntry; transit: TransitMeta }
  | { key: string; kind: 'note'; item: MergedItem; note: DayNote }
  | { key: string; kind: 'conn'; seg: RouteSegment; assignmentId?: number }

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
 * under the row each drawn leg belongs to. Segments are matched by their exact
 * waypoint coordinates (the calculator echoes the input waypoints back on each
 * leg), so no index bookkeeping is needed. The hotel bookends are left out up
 * front: they belong to the day's edges, and a stop planned on the hotel's own
 * spot would otherwise pair with them (#2501).
 */
export function buildPlanRows(opts: {
  merged: MergedItem[]
  reservations: Reservation[]
  routeSegments: RouteSegment[]
  dayId: number
  toursEnabled?: boolean
  places?: Place[]
}): PlanRow[] {
  const { merged, reservations, routeSegments, dayId } = opts
  const pool = routeSegments.filter(s => !s.hotelBookend)
  const projected = new Map(projectDayItinerary(
    merged.flatMap(item => item.type === 'place' ? [item.data as Assignment] : []),
    opts.toursEnabled ?? false,
    opts.places,
  ).map(item => [item.assignment.id, item]))
  const takeSegment = (from: [number, number], to: [number, number]): RouteSegment | null => {
    const idx = pool.findIndex(s => sameCoord(s.from, from) && sameCoord(s.to, to))
    return idx >= 0 ? pool.splice(idx, 1)[0] : null
  }

  const base: PlanRow[] = []
  for (const item of merged) {
    if (item.type === 'place') {
      const assignment = item.data as Assignment
      const itineraryItem = projected.get(assignment.id)
      base.push({
        key: `pl-${assignment.id}`,
        kind: 'place',
        item,
        assignment,
        // All of them: a stop can carry a parking pass and the tickets for the same
        // attraction, and getTransportForDay keeps every linked booking out of the
        // timeline, so anything dropped here is gone from the plan tab (#2201).
        linkedReservations: getAssignmentReservations(reservations, assignment.id),
        invalidTour: itineraryItem?.kind === 'tour' && !itineraryItem.valid,
      })
    } else if (item.type === 'note') {
      const note = item.data as DayNote
      base.push({ key: `note-${note.id}`, kind: 'note', item, note })
    } else {
      const res = item.data as TransportEntry
      // A car rental's middle days live in the day header, not the timeline; a
      // multi-day parking drops out of both on those days (#1937).
      if (res.type === 'car' && getSpanPhase(res, dayId) === 'middle') continue
      if (hidesOnMiddleDay(res, dayId)) continue
      const transit = getTransitMeta(res)
      const key = `tr-${res.id}${res.__leg ? `-leg${res.__leg.index}` : ''}`
      if (transit) base.push({ key, kind: 'transit', item, res, transit })
      else base.push({ key, kind: 'transport', item, res })
    }
  }

  // Walk the rows the way the route calc walks the day (buildDayRouteRuns). A
  // located place is a waypoint, possibly across notes. A located booking ends the
  // drive before it at its departure point and starts the next one at its arrival
  // point, so the drive from the arrival airport to the first stop gets its
  // connector too (#2502). Each leg goes under the row it leaves from, the place or
  // the booking it landed with, as on the desktop day plan.
  //
  // The route rides straight past a booking it has no location for, a taxi saved
  // without its stops or a concert, and draws the drive through it. The desktop
  // shows that leg under the booking, so it goes there, and it keeps the mode menu
  // of the stop it left, since that stop's mode is the one it was routed in. Only
  // transport bookings count, as in the route calc: a transit booking changed to
  // another type in the booking form keeps its stations, but the route ignores it.
  //
  // A booking whose station is the stop itself leaves a leg that goes nowhere: the
  // transit planner saves a journey between two of the day's places at their own
  // coordinates. That is no walk and no drive, so it gets no connector.
  type Origin = { at: [number, number]; row: number; assignmentId?: number }
  const legs = new Map<number, { seg: RouteSegment; assignmentId?: number }>()
  const connect = (origin: Origin | null, to: [number, number], toBooking = false) => {
    if (!origin) return
    const seg = takeSegment(origin.at, to)
    const fromBooking = origin.assignmentId == null
    if (!seg || ((toBooking || fromBooking) && sameCoord(origin.at, to))) return
    legs.set(origin.row, { seg, assignmentId: origin.assignmentId })
  }
  let prev: Origin | null = null
  for (let i = 0; i < base.length; i++) {
    const row = base[i]
    if (row.kind === 'place') {
      const place = row.assignment.place
      // Out of the route (#2532): the drive passes it by, so no leg starts or ends here.
      if (row.assignment.route_excluded) continue
      const itineraryItem = projected.get(row.assignment.id)
      if (itineraryItem?.kind === 'tour') {
        if (itineraryItem.start) connect(prev, [itineraryItem.start.lat, itineraryItem.start.lng])
        prev = itineraryItem.end
          ? { at: [itineraryItem.end.lat, itineraryItem.end.lng], row: i, assignmentId: row.assignment.id }
          : null
        continue
      }
      if (place?.lat == null || place?.lng == null) continue
      const at: [number, number] = [place.lat, place.lng]
      connect(prev, at)
      // The leg's mode is stored on its ORIGIN place assignment (#1281), so carry
      // that id for the tap-to-change menu.
      prev = { at, row: i, assignmentId: row.assignment.id }
    } else if (row.kind === 'transport' || row.kind === 'transit') {
      const { from, to } = TRANSPORT_TYPES.has(row.res.type)
        ? getTransportRouteEndpoints(row.res, dayId)
        : { from: null, to: null }
      if (!from && !to) {
        if (prev) prev = { ...prev, row: i }
        continue
      }
      // Only out of a stop: two bookings back to back are no drive (#1394).
      if (from && prev?.assignmentId != null) connect(prev, [from.lat, from.lng], true)
      prev = to ? { at: [to.lat, to.lng], row: i } : null
    }
  }

  return base.flatMap((row, i): PlanRow[] => {
    const leg = legs.get(i)
    return leg ? [row, { key: `conn-${row.key}`, kind: 'conn', seg: leg.seg, assignmentId: leg.assignmentId }] : [row]
  })
}

export interface HotelChip {
  key: string
  variant: 'checkout' | 'checkin' | 'stay'
  name: string
  time: string | null
  /** The stay behind the chip, so a tap can open it rather than the day (#2210). */
  accId: number
  placeId: number | null
}

const accommodationName = (a: Accommodation): string => a.place_name || a.reservation_title || ''

/** Check-out / check-in / stay chips of the timeline header, in demo order (out → in → stay). */
export function hotelChipsForDay(day: Day, days: Day[], accommodations: Accommodation[]): HotelChip[] {
  const inRange = accommodations.filter(a => isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days))
  const chips: HotelChip[] = []
  for (const a of inRange) {
    const stay = { name: accommodationName(a), accId: a.id, placeId: a.place_id ?? null }
    if (a.end_day_id === day.id) {
      chips.push({ ...stay, key: `out-${a.id}`, variant: 'checkout', time: a.check_out || null })
    } else if (a.start_day_id === day.id) {
      chips.push({ ...stay, key: `in-${a.id}`, variant: 'checkin', time: a.check_in || null })
    } else {
      chips.push({ ...stay, key: `stay-${a.id}`, variant: 'stay', time: null })
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
 * route calc already produced these via withHotelBookends, honouring the
 * optimize-from-accommodation setting and the should-draw gates, and tagged
 * them, so we just pick the tagged segments. Their presence is exactly the signal
 * that the leg should be drawn.
 *
 * Not by coordinates alone: a stop planned on the hotel's own spot starts and
 * ends legs there too. Matched that way, the drive from that stop to the next one
 * sat above a day that opens with a flight, and showed a second time in its own
 * place (#2501); an earlier drive onto that spot sat at the day's end (#2476).
 * The tag says which end of the day a leg is, and its hotel end still has to be
 * this stay: the calc keeps the last day's legs until the new day has routed, so
 * right after a day switch the tagged legs can belong to another hotel.
 */
export function hotelLegsForDay(
  day: Day,
  days: Day[],
  accommodations: Accommodation[],
  routeSegments: RouteSegment[],
): HotelLegs {
  const { morning, evening } = getDayBookendHotels(day, days, accommodations)
  const legOf = (a: Accommodation | undefined, bookend: 'morning' | 'evening'): HotelLeg | null => {
    if (!a || a.place_lat == null || a.place_lng == null) return null
    const at: [number, number] = [a.place_lat, a.place_lng]
    const seg = routeSegments.find(s => s.hotelBookend === bookend && sameCoord(bookend === 'morning' ? s.from : s.to, at))
    return seg ? { seg, name: accommodationName(a) } : null
  }
  // A moving day without stops is one drive from one hotel to the next (#1297). The
  // calc tags it as the morning leg, so it shows once, at the top (#2476).
  return { top: legOf(morning, 'morning'), bottom: legOf(evening, 'evening') }
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
 * simply the first stop.
 *
 * Null when the day has no places, when the day is already behind us, and once
 * today's timed plan has run out — a card headed "UP NEXT" that points at this
 * morning's first stop, or at a day from last week, is not a plan, it is noise.
 */
export function findUpNext(day: Day | undefined, dayAssignments: Assignment[], now: Date): UpNext | null {
  if (dayAssignments.length === 0) return null
  const sorted = [...dayAssignments].sort((a, b) => a.order_index - b.order_index)
  const timeOf = (a: Assignment) => parseTimeToMinutes(a.place?.place_time)
  const dayDate = day?.date?.slice(0, 10)
  const today = localIsoDate(now)
  if (dayDate && dayDate < today) return null
  const timed = sorted.filter(a => timeOf(a) != null).sort((a, b) => (timeOf(a) ?? 0) - (timeOf(b) ?? 0))
  if (dayDate === today) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const upcoming = timed.find(a => (timeOf(a) ?? 0) >= nowMinutes)
    if (upcoming) return { assignment: upcoming, minutesUntil: (timeOf(upcoming) ?? 0) - nowMinutes }
    // Every timed stop of today has started — a day whose plan carries no times
    // at all still shows its first stop, there is nothing stale about that.
    if (timed.length > 0) return null
  }
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
