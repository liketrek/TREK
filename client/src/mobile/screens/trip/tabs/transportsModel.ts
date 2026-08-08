import { splitReservationDateTime } from '../../../../utils/formatters'
import type { Day, Reservation } from '../../../../types'

/**
 * Transport view-model — the real-data counterpart to the demo's `trsSecs`
 * (spec 03 §1.4). Grouping and chronological order mirror the desktop
 * ReservationsPanel (Confirmed / Pending / Automated-Transit) so both surfaces
 * agree.
 */

/** Type-chip accent per transport type (from ReservationsPanel TYPE_OPTIONS). */
export const TRANSPORT_TYPE_COLOR: Record<string, string> = {
  flight: '#3b82f6',
  train: '#06b6d4',
  bus: '#059669',
  car: '#6b7280',
  taxi: '#ca8a04',
  bicycle: '#84cc16',
  cruise: '#0ea5e9',
  ferry: '#0d9488',
  transit: '#7c3aed',
  transport_other: '#6b7280',
}

export interface TransitLeg {
  mode?: string
  line?: string | null
  from?: { name?: string; time?: string | null }
  to?: { name?: string; time?: string | null }
}

export interface TransportMeta {
  airline?: string
  flight_number?: string
  train_number?: string
  seat?: string
  class?: string
  platform?: string
  price?: string | number
  priceCurrency?: string
  departure_airport?: string
  arrival_airport?: string
  check_in_time?: string
  check_in_end_time?: string
  check_out_time?: string
  transit?: { legs?: TransitLeg[] }
}

/** Parse the reservation's JSON metadata blob, tolerant of string or object. */
export function parseTransportMeta(res: Reservation): TransportMeta {
  try {
    return (typeof res.metadata === 'string'
      ? JSON.parse(res.metadata || '{}')
      : res.metadata || {}) as TransportMeta
  } catch {
    return {}
  }
}

/** Waypoints in travel order (from · stops · to). */
export function orderedEndpoints(res: Reservation) {
  return (res.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
}

export interface TransportGroups {
  confirmed: Reservation[]
  pending: Reservation[]
  transit: Reservation[]
}

/**
 * Chronological sort + split into the three demo sections. Undated entries sink
 * to the bottom; `transit` (automated public transport, #1065) is peeled off
 * into its own group regardless of status. Mirrors ReservationsPanel:683-711.
 */
export function groupTransports(list: Reservation[], days: Day[]): TransportGroups {
  const dayDates = new Map(days.map(d => [d.id, d.date]))
  const sortKey = (r: Reservation): string | null => {
    const { date, time } = splitReservationDateTime(r.reservation_time)
    const dayId = r.type === 'hotel' ? r.accommodation_start_day_id ?? r.day_id : r.day_id
    const effectiveDate = date ?? (dayId != null ? dayDates.get(dayId) ?? null : null)
    if (!effectiveDate) return null
    return `${effectiveDate}T${time ?? '00:00'}`
  }
  const sorted = list
    .map(r => ({ r, key: sortKey(r) }))
    .sort((a, b) => {
      if (a.key !== b.key) {
        if (a.key === null) return 1
        if (b.key === null) return -1
        return a.key < b.key ? -1 : 1
      }
      return (a.r.created_at ?? '').localeCompare(b.r.created_at ?? '')
    })
    .map(({ r }) => r)

  const transit = sorted.filter(r => r.type === 'transit')
  const nonTransit = sorted.filter(r => r.type !== 'transit')
  return {
    confirmed: nonTransit.filter(r => r.status === 'confirmed'),
    pending: nonTransit.filter(r => r.status !== 'confirmed'),
    transit,
  }
}
