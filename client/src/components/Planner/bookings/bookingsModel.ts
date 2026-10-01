import {
  Plane, Hotel, Utensils, Train, Car, Ship, Bus, Sailboat, CableCar, Bike, CarTaxiFront, Route, Ticket, FileText,
  TramFront, Users, ParkingSquare, type LucideIcon,
} from 'lucide-react'
import type { AssignmentsMap, Day, Reservation } from '../../../types'
import { TRANSPORT_TYPE_COLOR } from '../../../mobile/screens/trip/tabs/transportsModel'
import { BOOKING_TYPE_COLOR } from '../../../mobile/screens/trip/tabs/bookingsModel'
import { splitReservationDateTime } from '../../../utils/formatters'
import { parseReservationMetadata } from '../../../utils/flightLegs'

/** Which of the two planner tabs a panel shows. */
export type BookingsKind = 'transports' | 'bookings'
export type BookingsView = 'cards' | 'list' | 'timeline'
export type StatusFilter = 'all' | 'confirmed' | 'pending'
export type GroupBy = 'status' | 'day' | 'type' | 'none'
export type SortBy = 'date' | 'title' | 'type' | 'status'

export interface ReservationTypeInfo {
  Icon: LucideIcon
  labelKey: string
  /** The name on a chip or pill, shorter where the full one would crowd a card's head. */
  chipKey: string
  color: string
}

// Icons and label keys for every reservation type. The colours come from the phone's
// models so the two shells can never drift apart on what a flight looks like.
const TYPES: Record<string, { Icon: LucideIcon; chipKey?: string }> = {
  flight: { Icon: Plane }, train: { Icon: Train }, bus: { Icon: Bus }, car: { Icon: Car },
  taxi: { Icon: CarTaxiFront }, bicycle: { Icon: Bike }, cruise: { Icon: Ship }, ferry: { Icon: Sailboat }, cable_car: { Icon: CableCar },
  transit: { Icon: TramFront, chipKey: 'reservations.typeShort.transit' }, transport_other: { Icon: Route },
  hotel: { Icon: Hotel }, restaurant: { Icon: Utensils }, event: { Icon: Ticket }, tour: { Icon: Users },
  parking: { Icon: ParkingSquare }, other: { Icon: FileText },
}

export function typeInfo(type: string): ReservationTypeInfo {
  const known = TYPES[type] ? type : 'other'
  return {
    Icon: TYPES[known].Icon,
    labelKey: `reservations.type.${known}`,
    chipKey: TYPES[known].chipKey ?? `reservations.type.${known}`,
    color: TRANSPORT_TYPE_COLOR[known] || BOOKING_TYPE_COLOR[known] || '#6b7280', // theme-lint-disable: fallback type colour, as on the phone
  }
}

/** The order the type pills appear in, whichever types a trip uses. */
export const TYPE_ORDER = [
  'flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'cable_car', 'transit', 'transport_other',
  'hotel', 'restaurant', 'event', 'tour', 'parking', 'other',
]

/** A booking's metadata, read the way the rest of the planner reads it (double-encoded JSON included). */
export const parseMeta = parseReservationMetadata

export interface AssignmentLookupEntry {
  dayNumber: number
  dayTitle: string | null
  dayDate: string | null
  placeName: string
  startTime: string | null
  endTime: string | null
}

/** Each day-plan assignment by id, so a booking linked to one can name its day, place and time. */
export function buildAssignmentLookup(days: Day[], assignments: AssignmentsMap | undefined): Record<number, AssignmentLookupEntry> {
  const map: Record<number, AssignmentLookupEntry> = {}
  for (const day of days || []) {
    const list = (assignments?.[String(day.id)] || []).slice().sort((a, b) => a.order_index - b.order_index)
    for (const a of list) {
      if (!a.place) continue
      map[a.id] = { dayNumber: day.day_number, dayTitle: day.title ?? null, dayDate: day.date ?? null, placeName: a.place.name, startTime: a.place.place_time ?? null, endTime: a.place.end_time ?? null }
    }
  }
  return map
}

export interface DaySpan {
  start?: Day
  end?: Day
}

/** The days a booking sits on. A hotel reads its stay from the accommodation, which is the source of truth for the range (#1383). */
export function daySpan(r: Reservation, days: Day[]): DaySpan {
  const byId = (id?: number | null) => (id != null ? days.find(d => d.id === id) : undefined)
  if (r.type === 'hotel' && (r.accommodation_start_day_id || r.accommodation_end_day_id)) {
    return { start: byId(r.accommodation_start_day_id), end: byId(r.accommodation_end_day_id) }
  }
  return { start: byId(r.day_id), end: byId(r.end_day_id) }
}

/**
 * The moment a booking starts, as "YYYY-MM-DDTHH:MM" in its own local time, or null
 * without any date. A day-linked transport often carries no date in reservation_time,
 * so the linked day stands in (the stay's first day for a hotel).
 */
export function startKey(r: Reservation, days: Day[]): string | null {
  const { date, time } = splitReservationDateTime(r.reservation_time)
  const dayId = r.type === 'hotel' ? (r.accommodation_start_day_id ?? r.day_id) : r.day_id
  const dayDate = dayId != null ? days.find(d => d.id === dayId)?.date : null
  const effective = date ?? dayDate ?? null
  if (!effective) return null
  return `${effective}T${time ?? '00:00'}`
}

export type Phase = 'before' | 'during' | 'after' | 'undated'

export function phaseOf(key: string | null, tripStart?: string | null, tripEnd?: string | null): Phase {
  if (!key) return 'undated'
  const date = key.slice(0, 10)
  if (tripStart && date < tripStart) return 'before'
  if (tripEnd && date > tripEnd) return 'after'
  return 'during'
}

export interface BookingFilters {
  types: Set<string>
  status: StatusFilter
  travelers: Set<number>
  query: string
}

/** Everything a person could look a booking up by: its title, type, route, codes, carrier, place and people. */
export function searchText(r: Reservation, typeLabel: string): string {
  const meta = parseMeta(r)
  const legs = Array.isArray(meta.legs) ? meta.legs : []
  return [
    r.title, typeLabel, r.location, r.place_name, r.accommodation_name, r.notes, r.confirmation_number,
    meta.airline, meta.flight_number, meta.train_number, meta.departure_airport, meta.arrival_airport,
    ...(r.endpoints || []).flatMap(e => [e.name, e.code]),
    ...legs.flatMap((l: Record<string, unknown>) => [l.confirmation_number, l.flight_number, l.airline, l.train_number]),
    ...(r.travelers || []).map(tv => tv.username),
  ].filter(v => typeof v === 'string' && v).join(' ').toLowerCase()
}

/** Transit journeys carry no status of their own, so a status filter leaves them out. */
function matchesStatus(r: Reservation, status: StatusFilter): boolean {
  if (status === 'all') return true
  if (r.type === 'transit') return false
  return status === 'confirmed' ? r.status === 'confirmed' : r.status !== 'confirmed'
}

export function applyFilters(list: Reservation[], f: BookingFilters, labelOf: (type: string) => string): Reservation[] {
  const q = f.query.trim().toLowerCase()
  return list.filter(r =>
    (f.types.size === 0 || f.types.has(r.type))
    && matchesStatus(r, f.status)
    && (f.travelers.size === 0 || (r.travelers || []).some(tv => f.travelers.has(tv.user_id)))
    && (!q || searchText(r, labelOf(r.type)).includes(q)),
  )
}

/**
 * Chronological, undated last, creation order on a tie (#1507); other keys fall back to that order.
 * With `transitApart` off, a transit journey sorts by status as if confirmed, next to the bookings it sits among.
 */
export function sortReservations(list: Reservation[], days: Day[], by: SortBy, dir: 'asc' | 'desc', labelOf: (type: string) => string, transitApart = true): Reservation[] {
  const keyed = list.map(r => ({ r, key: startKey(r, days) }))
  const byDate = (a: typeof keyed[number], b: typeof keyed[number]) => {
    if (a.key !== b.key) {
      if (a.key === null) return 1
      if (b.key === null) return -1
      return a.key < b.key ? -1 : 1
    }
    return (a.r.created_at ?? '').localeCompare(b.r.created_at ?? '')
  }
  const primary = (a: typeof keyed[number], b: typeof keyed[number]): number => {
    if (by === 'title') return a.r.title.localeCompare(b.r.title)
    if (by === 'type') return labelOf(a.r.type).localeCompare(labelOf(b.r.type))
    if (by === 'status') return statusRank(a.r, transitApart) - statusRank(b.r, transitApart)
    return 0
  }
  const sign = dir === 'desc' ? -1 : 1
  return keyed
    .sort((a, b) => {
      if (by === 'date') {
        // Undated entries stay at the bottom in both directions.
        if (a.key === null || b.key === null) return byDate(a, b)
        return sign * byDate(a, b)
      }
      return sign * primary(a, b) || byDate(a, b)
    })
    .map(x => x.r)
}

function statusRank(r: Reservation, transitApart: boolean): number {
  if (r.type === 'transit') return transitApart ? 2 : 0
  return r.status === 'confirmed' ? 0 : 1
}

export interface BookingGroup {
  id: string
  label: string
  /** A second part of the head, after a straight cut (a day's date and title). */
  sub?: string
  items: Reservation[]
}

export interface GroupLabels {
  confirmed: string
  pending: string
  transit: string
  before: string
  after: string
  undated: string
  dayN: (n: number) => string
  typeLabel: (type: string) => string
  dayDate: (date: string) => string
}

/**
 * Sections of a sorted list. Status follows the phone's order: confirmed, pending, transit.
 * With `transitApart` off, transit journeys have no section of their own: nothing is
 * left to book on them, so they sit among the confirmed entries in time order.
 */
export function groupReservations(sorted: Reservation[], by: GroupBy, days: Day[], tripStart: string | null | undefined, tripEnd: string | null | undefined, L: GroupLabels, transitApart = true): BookingGroup[] {
  if (by === 'none') return [{ id: 'all', label: '', items: sorted }]
  if (by === 'status') {
    const isTransit = (r: Reservation) => r.type === 'transit'
    const groups: BookingGroup[] = [
      { id: 'confirmed', label: L.confirmed, items: sorted.filter(r => (isTransit(r) ? !transitApart : r.status === 'confirmed')) },
      { id: 'pending', label: L.pending, items: sorted.filter(r => !isTransit(r) && r.status !== 'confirmed') },
      { id: 'transit', label: L.transit, items: transitApart ? sorted.filter(isTransit) : [] },
    ]
    return groups.filter(g => g.items.length > 0)
  }
  if (by === 'type') {
    const order: string[] = []
    const map = new Map<string, Reservation[]>()
    for (const r of sorted) {
      if (!map.has(r.type)) { map.set(r.type, []); order.push(r.type) }
      map.get(r.type)!.push(r)
    }
    return order.map(type => ({ id: `type-${type}`, label: L.typeLabel(type), items: map.get(type)! }))
  }
  // By day: the day an entry starts on, with separate groups before and after the trip and without a date.
  const out = new Map<string, BookingGroup>()
  const push = (id: string, make: () => Omit<BookingGroup, 'items'>, r: Reservation) => {
    if (!out.has(id)) out.set(id, { ...make(), items: [] })
    out.get(id)!.items.push(r)
  }
  for (const r of sorted) {
    const key = startKey(r, days)
    const phase = phaseOf(key, tripStart, tripEnd)
    const { start } = daySpan(r, days)
    const day = start ?? (key ? days.find(d => d.date === key.slice(0, 10)) : undefined)
    if (phase === 'before') push('before', () => ({ id: 'before', label: L.before }), r)
    else if (phase === 'after') push('after', () => ({ id: 'after', label: L.after }), r)
    else if (day) push(`day-${day.id}`, () => ({ id: `day-${day.id}`, label: L.dayN(day.day_number), sub: [day.date ? L.dayDate(day.date) : null, day.title].filter(Boolean).join('  ') || undefined }), r)
    else if (key) push(`date-${key.slice(0, 10)}`, () => ({ id: `date-${key.slice(0, 10)}`, label: L.dayDate(key.slice(0, 10)) }), r)
    else push('undated', () => ({ id: 'undated', label: L.undated }), r)
  }
  const groups = [...out.values()]
  const rank = (g: BookingGroup) => (g.id === 'before' ? 0 : g.id === 'after' ? 2 : g.id === 'undated' ? 3 : 1)
  return groups.sort((a, b) => rank(a) - rank(b))
}

export interface CostTotal { currency: string; amount: number }

/** Linked expenses summed per currency. Money in two currencies is never added up. */
export function costsFor(reservationId: number, items: { reservation_id?: number | null; total_price: number; currency?: string | null }[], tripCurrency: string): CostTotal[] {
  const sums = new Map<string, number>()
  for (const it of items) {
    if (it.reservation_id !== reservationId) continue
    const cur = (it.currency || tripCurrency || 'EUR').toUpperCase()
    sums.set(cur, Math.round(((sums.get(cur) ?? 0) + it.total_price) * 100) / 100)
  }
  return [...sums.entries()].map(([currency, amount]) => ({ currency, amount }))
}

/** A title for an entry saved without one: its route, else its place, else nothing. */
export function displayTitle(r: Reservation): string {
  if (r.title?.trim()) return r.title
  const eps = (r.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
  if (eps.length >= 2) return eps.map(e => e.code || e.name).join(' → ')
  return r.place_name || r.location || ''
}
