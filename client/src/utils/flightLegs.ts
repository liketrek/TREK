// Multi-leg (layover) flight support.
//
// A flight booking is ONE reservation whose route is an ordered chain of airports
// (e.g. FRA -> BER -> HND). The geometry + order are the source of truth in
// `reservation.endpoints` (role 'from' for the first airport, 'stop' for each
// intermediate one, 'to' for the last, ordered by `sequence`). The per-leg detail
// — airline, flight number, and each segment's own day/time — lives in
// `metadata.legs`. The top-level metadata (`departure_airport`/`arrival_airport`/
// `airline`/`flight_number`) and `day_id`/`end_day_id` mirror the FIRST and LAST
// leg so legacy readers keep working.
//
// A legacy single-leg flight (two endpoints, flat metadata, no `metadata.legs`)
// is normalised here into a one-leg chain, so every renderer can use one path.

import type { Reservation, ReservationEndpoint } from '../types'

export interface FlightLeg {
  from: string | null // IATA code (or null)
  to: string | null
  airline?: string
  flight_number?: string
  dep_day_id?: number | null
  dep_time?: string | null // 'HH:mm'
  arr_day_id?: number | null
  arr_time?: string | null
}

/** reservation.metadata may be a JSON string or an already-parsed object. */
export function parseReservationMetadata(r: Pick<Reservation, 'metadata'>): Record<string, any> {
  const m = r.metadata
  if (!m) return {}
  if (typeof m === 'string') {
    try {
      let parsed = JSON.parse(m || '{}')
      // Defensive: an earlier bug could double-encode metadata (a JSON string of a
      // JSON string) — unwrap it once more so saved flights heal on read.
      if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch { /* keep */ } }
      return (parsed && typeof parsed === 'object') ? parsed : {}
    } catch { return {} }
  }
  return m as Record<string, any>
}

/** Endpoints ordered by `sequence` (geometry + order source of truth). */
export function orderedEndpoints(r: Pick<Reservation, 'endpoints'>): ReservationEndpoint[] {
  return (r.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
}

/**
 * Ordered legs of a flight. `metadata.legs` is preferred; otherwise a single leg
 * is derived from the endpoints (and finally the flat metadata) so that legacy
 * single-leg flights — and flights created before this feature — still work.
 */
export function getFlightLegs(r: Reservation): FlightLeg[] {
  const meta = parseReservationMetadata(r)
  if (Array.isArray(meta.legs) && meta.legs.length > 0) {
    return meta.legs.map((l: any): FlightLeg => ({
      from: l.from ?? null,
      to: l.to ?? null,
      airline: l.airline || undefined,
      flight_number: l.flight_number || undefined,
      dep_day_id: l.dep_day_id ?? null,
      dep_time: l.dep_time ?? null,
      arr_day_id: l.arr_day_id ?? null,
      arr_time: l.arr_time ?? null,
    }))
  }
  // Legacy fallback: one leg from the endpoints / flat metadata.
  const eps = orderedEndpoints(r)
  const first = eps[0]
  const last = eps[eps.length - 1]
  const fromCode = first?.code ?? meta.departure_airport ?? null
  const toCode = last?.code ?? meta.arrival_airport ?? null
  if (!fromCode && !toCode) return []
  return [{
    from: fromCode,
    to: toCode,
    airline: meta.airline || undefined,
    flight_number: meta.flight_number || undefined,
    dep_day_id: r.day_id ?? null,
    dep_time: first?.local_time ?? null,
    arr_day_id: r.end_day_id ?? r.day_id ?? null,
    arr_time: last?.local_time ?? null,
  }]
}

/** Number of flight segments. 1 for a simple from -> to booking. */
export function legCount(r: Reservation): number {
  return getFlightLegs(r).length
}

export function isMultiLegFlight(r: Reservation): boolean {
  return r.type === 'flight' && legCount(r) > 1
}

/**
 * Ordered route labels (IATA codes, or names when no code) for display, e.g.
 * ['FRA','BER','HND']. Uses endpoints; falls back to the flat metadata pair.
 */
export function routeStops(r: Reservation): string[] {
  const eps = orderedEndpoints(r)
  if (eps.length >= 2) return eps.map(e => e.code || e.name)
  const meta = parseReservationMetadata(r)
  return [meta.departure_airport, meta.arrival_airport].filter(Boolean) as string[]
}
