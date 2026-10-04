import { Ticket, type LucideIcon } from 'lucide-react'
import { isCarrierType, isRentalType, isStoredStop } from '@trek/shared/roadtrip'
import { RES_ICONS } from '../Planner/DayPlanSidebar.constants'
import { hidesOnMiddleDay } from '../../utils/dayMerge'
import { splitReservationDateTime } from '../../utils/formatters'
import type { Reservation } from '../../types'
import type { RoadtripStop } from '@trek/shared/roadtrip'

/**
 * The bookings a day carries besides its nights, its rides and its hire car: the table,
 * the tickets, the tour. On the road trip each hangs under the stop it is for, and one
 * that is for no stop on the day is listed under the day, so nothing booked goes unseen
 * in this mode.
 *
 * A booking is a stop's when it is pinned to the stop's assignment, or, failing that,
 * when it is for the stop's place on the stop's day: a table booked at the Bullerei on
 * the day the Bullerei is driven to is the Bullerei's, pinned or not. The night, the
 * ride and the hire car are left out because the rail already draws them as the stay,
 * the terminals and the desks.
 */
export interface DayBookings {
  /** By index into `day.stops`, earliest first. Indexes without a booking are absent. */
  atStop: Map<number, Reservation[]>
  /** On the day, at no stop of it. */
  loose: Reservation[]
}

const EMPTY: DayBookings = { atStop: new Map(), loose: [] }

function drawnElsewhere(type: string): boolean {
  return type === 'hotel' || isRentalType(type) || isCarrierType(type)
}

/** Earliest first, untimed last, id as the tiebreaker: the day plan's own order. */
function byClock(a: Reservation, b: Reservation): number {
  const at = a.reservation_time || ''
  const bt = b.reservation_time || ''
  if (at !== bt) {
    if (!at) return 1
    if (!bt) return -1
    return at < bt ? -1 : 1
  }
  return a.id - b.id
}

/**
 * Whether a booking is on the day: it starts or ends there, or the day lies between the
 * two, the way the day plan lists a three-day tour on its middle day as well. A type
 * that has nothing to say on its middle days (a parked car) is left off them here too.
 * Without a day order only the first and the last day of a span can be told.
 */
function spansDay(r: Reservation, dayId: number, dayOrder?: (dayId: number) => number | null | undefined): boolean {
  if (r.day_id === dayId || (r.end_day_id != null && r.end_day_id === dayId)) return true
  if (!dayOrder || r.day_id == null || r.end_day_id == null) return false
  const here = dayOrder(dayId)
  const first = dayOrder(r.day_id)
  const last = dayOrder(r.end_day_id)
  if (here == null || first == null || last == null) return false
  return here > Math.min(first, last) && here < Math.max(first, last) && !hidesOnMiddleDay(r, dayId)
}

export function dayBookings(
  day: { dayId: number; stops: readonly Pick<RoadtripStop, 'assignmentId' | 'placeId' | 'carrier' | 'automaticNight' | 'bookend'>[] },
  reservations: readonly Reservation[],
  /** A day's position in the trip by its id, so a booking spanning days is on the days between too. */
  dayOrder?: (dayId: number) => number | null | undefined,
): DayBookings {
  if (!reservations.length) return EMPTY
  const atStop = new Map<number, Reservation[]>()
  const loose: Reservation[] = []
  for (const r of reservations) {
    if (drawnElsewhere(r.type)) continue
    const stops = day.stops
    // Only a real stop can hold a booking: a terminal has a negative place, an automatic
    // night has no assignment anybody pinned to, and a booked night at the day's edge is
    // the stay's place on a row that carries no chips. A table at the hotel belongs to the
    // hotel's own stop, or under the day.
    const real = (i: number): boolean => isStoredStop(stops[i]!)
    let index = r.assignment_id ? stops.findIndex((s, i) => real(i) && s.assignmentId === r.assignment_id) : -1
    const onDay = spansDay(r, day.dayId, dayOrder)
    if (index < 0 && onDay && r.place_id) index = stops.findIndex((s, i) => real(i) && s.placeId === r.place_id)
    if (index >= 0) {
      const list = atStop.get(index) ?? []
      list.push(r)
      atStop.set(index, list)
    } else if (onDay) {
      loose.push(r)
    }
  }
  for (const list of atStop.values()) list.sort(byClock)
  loose.sort(byClock)
  return atStop.size || loose.length ? { atStop, loose } : EMPTY
}

/** The booking panel's icon for the type, so a table reads as a table here too. */
export function bookingIcon(type: string): LucideIcon {
  return (RES_ICONS as Record<string, LucideIcon>)[type] ?? Ticket
}

/** The clock the booking starts at, or null when it names none. */
export function bookingClock(r: Pick<Reservation, 'reservation_time'>): string | null {
  return splitReservationDateTime(r.reservation_time).time || null
}
