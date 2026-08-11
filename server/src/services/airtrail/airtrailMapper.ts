import { localParts } from '../timezoneService';
import type { AirtrailAirport, AirtrailFlightRaw, AirtrailNamedCode } from './airtrailClient';
import type { AirtrailFlight } from '@trek/shared';

import * as crypto from 'node:crypto';

/** Preferred display/lookup code for an airport. */
function airportCode(a: AirtrailAirport | null): string | null {
  return a?.iata || a?.icao || null;
}

/**
 * Airline/aircraft arrive as joined objects ({icao, iata, name, ...}); reduce
 * them to a single code (ICAO preferred, matching AirTrail's save shape).
 */
export function entityCode(e: AirtrailNamedCode | null | undefined): string | null {
  return e?.icao || e?.iata || null;
}

/**
 * Human-readable name for an airline/aircraft (e.g. "Lufthansa"), falling back to the
 * code when AirTrail doesn't provide a name. Used for what TREK displays/stores; the
 * raw code stays available via entityCode for the writeback payload (#1334).
 */
export function entityName(e: AirtrailNamedCode | null | undefined): string | null {
  return e?.name || e?.icao || e?.iata || null;
}

/** Raw AirTrail flight → the normalized shape the import picker consumes. */
export function normalizeFlight(raw: AirtrailFlightRaw): AirtrailFlight {
  return {
    id: String(raw.id),
    fromCode: airportCode(raw.from),
    fromName: raw.from?.name ?? null,
    toCode: airportCode(raw.to),
    toName: raw.to?.name ?? null,
    date: raw.date ?? null,
    departure: raw.departureScheduled ?? raw.departure ?? null,
    arrival: raw.arrivalScheduled ?? raw.arrival ?? null,
    airline: entityName(raw.airline),
    flightNumber: raw.flightNumber ?? null,
    aircraft: entityCode(raw.aircraft),
    seatClass: (raw.seats?.find((s) => s.userId) ?? raw.seats?.[0])?.seatClass ?? null,
  };
}

export interface MappedEndpoint {
  role: 'from' | 'to' | 'stop';
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_time: string | null;
  local_date: string | null;
}

export interface MappedReservation {
  title: string;
  type: 'flight';
  status: 'confirmed';
  reservation_time: string | null;
  reservation_end_time: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  endpoints: MappedEndpoint[];
  needs_review: number;
}

function hasCoords(a: AirtrailAirport | null): a is AirtrailAirport & { lat: number; lng: number } {
  return !!a && typeof a.lat === 'number' && typeof a.lon === 'number';
}

/** Raw AirTrail flight → the data createReservation() expects (type:'flight'). */
export function mapFlightToReservation(raw: AirtrailFlightRaw): MappedReservation {
  // Prefer the scheduled (booked) time TREK plans against, but fall back to the
  // primary departure/arrival instant when AirTrail has no scheduled time. Manually
  // entered flights only set `departure`/`arrival` (the `*Scheduled` columns stay
  // null), so reading scheduled alone dropped the clock — and the whole arrival —
  // for the common case (#1336). Only when neither exists is the clock left blank
  // (date preserved) rather than fabricated.
  const dep = localParts(raw.departureScheduled ?? raw.departure, raw.from?.tz ?? null);
  const arr = localParts(raw.arrivalScheduled ?? raw.arrival, raw.to?.tz ?? null);

  const fromCode = airportCode(raw.from);
  const toCode = airportCode(raw.to);
  const datePrefix = raw.date || dep.date;
  const reservation_time = dep.date && dep.time ? `${dep.date}T${dep.time}` : (datePrefix ?? null);
  const reservation_end_time = arr.date && arr.time ? `${arr.date}T${arr.time}` : null;

  const endpoints: MappedEndpoint[] = [];
  let needsReview = raw.datePrecision && raw.datePrecision !== 'day' ? 1 : 0;

  if (hasCoords(raw.from)) {
    endpoints.push({
      role: 'from',
      sequence: 0,
      name: raw.from.name || fromCode || 'Departure',
      code: fromCode,
      lat: raw.from.lat,
      lng: raw.from.lon,
      timezone: raw.from.tz,
      local_time: dep.time,
      local_date: datePrefix,
    });
  } else {
    needsReview = 1;
  }

  if (hasCoords(raw.to)) {
    endpoints.push({
      role: 'to',
      sequence: 1,
      name: raw.to.name || toCode || 'Arrival',
      code: toCode,
      lat: raw.to.lat,
      lng: raw.to.lon,
      timezone: raw.to.tz,
      local_time: arr.time,
      local_date: arr.date,
    });
  } else {
    needsReview = 1;
  }

  const seat = raw.seats?.find((s) => s.userId) ?? raw.seats?.[0];
  const airlineName = entityName(raw.airline);
  const airlineCode = entityCode(raw.airline);
  const aircraftCode = entityCode(raw.aircraft);
  const metadata: Record<string, unknown> = {};
  // Display the airline name; keep the code in airline_code for the AirTrail writeback,
  // which expects a code, not a name (#1334 / #1240).
  if (airlineName) metadata.airline = airlineName;
  if (airlineCode) metadata.airline_code = airlineCode;
  if (raw.flightNumber) metadata.flight_number = raw.flightNumber;
  if (aircraftCode) metadata.aircraft = aircraftCode;
  if (raw.aircraftReg) metadata.aircraft_reg = raw.aircraftReg;
  if (raw.flightReason) metadata.flight_reason = raw.flightReason;
  if (seat?.seatNumber) metadata.seat = seat.seatNumber;

  // The flight number already carries the airline prefix (e.g. "SAS983"), so it
  // makes the clearest title; fall back to the route.
  const title = raw.flightNumber?.trim() || `${fromCode || '?'} → ${toCode || '?'}`;

  return {
    title,
    type: 'flight',
    status: 'confirmed',
    reservation_time,
    reservation_end_time,
    notes: raw.note ?? null,
    metadata,
    endpoints,
    needs_review: needsReview,
  };
}

/**
 * A chain of connecting AirTrail flights → ONE multi-leg reservation (#1535).
 *
 * Endpoints follow the manual multi-leg form: from → stop… → to, where a stop is
 * the connection airport and carries the departure of the leg LEAVING it (the
 * last endpoint carries the arrival). Per-leg airline/flight number/times/seat
 * live in metadata.legs; the flat metadata mirrors the first/last leg so legacy
 * readers keep working. Every source flight id rides along in
 * metadata.airtrail_ids so the import dedupe recognizes each leg — the
 * reservation itself is created detached from live sync, because AirTrail has no
 * multi-leg flight entity a merged booking could round-trip to.
 *
 * `resolveDayId` maps a local calendar date to the trip's day id: the day
 * planner files each leg by its own dep_day_id/arr_day_id, so an overnight
 * connection must not inherit the whole booking's first day for every leg.
 */
export function mapFlightsToMultiLegReservation(
  flights: AirtrailFlightRaw[],
  resolveDayId: (date: string | null) => number | null = () => null,
): MappedReservation {
  if (flights.length === 1) return mapFlightToReservation(flights[0]);

  let needsReview = flights.some((f) => f.datePrecision && f.datePrecision !== 'day') ? 1 : 0;
  const endpoints: MappedEndpoint[] = [];
  const legs: Record<string, unknown>[] = [];

  const first = flights[0];
  const firstDep = localParts(first.departureScheduled ?? first.departure, first.from?.tz ?? null);
  const firstDate = first.date || firstDep.date;
  if (hasCoords(first.from)) {
    endpoints.push({
      role: 'from',
      sequence: 0,
      name: first.from.name || airportCode(first.from) || 'Departure',
      code: airportCode(first.from),
      lat: first.from.lat,
      lng: first.from.lon,
      timezone: first.from.tz,
      local_time: firstDep.time,
      local_date: firstDate,
    });
  } else {
    needsReview = 1;
  }

  flights.forEach((f, i) => {
    const isLast = i === flights.length - 1;
    const dep = localParts(f.departureScheduled ?? f.departure, f.from?.tz ?? null);
    const arr = localParts(f.arrivalScheduled ?? f.arrival, f.to?.tz ?? null);

    if (hasCoords(f.to)) {
      // The connection airport's endpoint carries the ONWARD departure, matching
      // what the manual form stores for a stop; only the final arrival keeps its
      // own arrival time.
      const next = isLast ? null : flights[i + 1];
      const nextDep = next ? localParts(next.departureScheduled ?? next.departure, next.from?.tz ?? null) : null;
      endpoints.push({
        role: isLast ? 'to' : 'stop',
        sequence: 0,
        name: f.to.name || airportCode(f.to) || (isLast ? 'Arrival' : 'Stop'),
        code: airportCode(f.to),
        lat: f.to.lat,
        lng: f.to.lon,
        timezone: f.to.tz,
        local_time: isLast ? arr.time : (nextDep?.time ?? null),
        local_date: isLast ? arr.date : next?.date || nextDep?.date || null,
      });
    } else {
      needsReview = 1;
    }

    const seat = f.seats?.find((s) => s.userId) ?? f.seats?.[0];
    const airline = entityName(f.airline);
    legs.push({
      from: airportCode(f.from),
      to: airportCode(f.to),
      ...(airline ? { airline } : {}),
      ...(f.flightNumber ? { flight_number: f.flightNumber } : {}),
      dep_day_id: resolveDayId(f.date || dep.date),
      dep_time: dep.time,
      arr_day_id: resolveDayId(arr.date),
      arr_time: arr.time,
      ...(seat?.seatNumber ? { seat: seat.seatNumber } : {}),
    });
  });
  endpoints.forEach((e, i) => {
    e.sequence = i;
  });

  const last = flights[flights.length - 1];
  const lastArr = localParts(last.arrivalScheduled ?? last.arrival, last.to?.tz ?? null);
  const reservation_time = firstDep.date && firstDep.time ? `${firstDep.date}T${firstDep.time}` : (firstDate ?? null);
  const reservation_end_time = lastArr.date && lastArr.time ? `${lastArr.date}T${lastArr.time}` : null;

  const fromCode = airportCode(first.from);
  const toCode = airportCode(last.to);
  const airlineName = entityName(first.airline);
  const airlineCode = entityCode(first.airline);
  const aircraftCode = entityCode(first.aircraft);
  const metadata: Record<string, unknown> = {
    legs,
    airtrail_ids: flights.map((f) => String(f.id)),
  };
  if (airlineName) metadata.airline = airlineName;
  if (airlineCode) metadata.airline_code = airlineCode;
  if (first.flightNumber) metadata.flight_number = first.flightNumber;
  if (aircraftCode) metadata.aircraft = aircraftCode;
  if (fromCode) metadata.departure_airport = fromCode;
  if (toCode) metadata.arrival_airport = toCode;
  if (legs[0]?.seat) metadata.seat = legs[0].seat;

  const route = [fromCode, ...flights.map((f) => airportCode(f.to))].filter(Boolean).join(' → ');
  const notes = [...new Set(flights.map((f) => f.note?.trim()).filter((n): n is string => !!n))].join('\n') || null;

  return {
    title: route || first.flightNumber?.trim() || 'Flight',
    type: 'flight',
    status: 'confirmed',
    reservation_time,
    reservation_end_time,
    notes,
    metadata,
    endpoints,
    needs_review: needsReview,
  };
}

/**
 * Stable snapshot hash of an AirTrail flight, used by the sync engine to detect
 * remote changes (AirTrail exposes no updated_at/etag) and to suppress TREK's own
 * writes from re-triggering a pull. Only fields that can meaningfully change are
 * included, in a fixed key order.
 */
export function canonicalHash(raw: AirtrailFlightRaw): string {
  const snapshot = {
    from: airportCode(raw.from),
    to: airportCode(raw.to),
    date: raw.date ?? null,
    datePrecision: raw.datePrecision ?? 'day',
    // Hash the same instant the import uses (scheduled, else primary) so a change to
    // whichever time TREK actually shows triggers a re-sync — and existing flights
    // imported without a scheduled time re-sync once to pick up their clock (#1336).
    departureScheduled: raw.departureScheduled ?? raw.departure ?? null,
    arrivalScheduled: raw.arrivalScheduled ?? raw.arrival ?? null,
    airline: entityCode(raw.airline),
    flightNumber: raw.flightNumber ?? null,
    aircraft: entityCode(raw.aircraft),
    aircraftReg: raw.aircraftReg ?? null,
    flightReason: raw.flightReason ?? null,
    note: raw.note ?? null,
    seats: (raw.seats ?? [])
      .map((s) => ({
        userId: s.userId ?? null,
        guestName: s.guestName ?? null,
        seat: s.seat ?? null,
        seatNumber: s.seatNumber ?? null,
        seatClass: s.seatClass ?? null,
      }))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  };
  return crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}
