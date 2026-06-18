import * as crypto from 'node:crypto';
import type { AirtrailAirport, AirtrailFlightRaw, AirtrailNamedCode } from './airtrailClient';
import type { AirtrailFlight } from '@trek/shared';

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
 * Local calendar date + clock time for an instant at a given IANA zone.
 * AirTrail stores `departure`/`arrival` as instants (ISO w/ offset) plus a local
 * `date`; the airport-local wall time is what TREK shows and files days by.
 */
function localParts(iso: string | null, tz: string | null): { date: string | null; time: string | null } {
  if (!iso) return { date: null, time: null };
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: null, time: null };
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
    const date = `${get('year')}-${get('month')}-${get('day')}`;
    let hh = get('hour');
    if (hh === '24') hh = '00'; // some ICU builds emit 24:00 for midnight
    const time = `${hh}:${get('minute')}`;
    return { date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null, time };
  } catch {
    return { date: null, time: null };
  }
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
    departure: raw.departureScheduled ?? null,
    arrival: raw.arrivalScheduled ?? null,
    airline: entityCode(raw.airline),
    flightNumber: raw.flightNumber ?? null,
    aircraft: entityCode(raw.aircraft),
    seatClass: (raw.seats?.find(s => s.userId) ?? raw.seats?.[0])?.seatClass ?? null,
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
  // Read the SCHEDULED times only — TREK plans against the scheduled (booked) time,
  // not the actual/estimated `departure`/`arrival`. When a flight has no scheduled
  // time, the clock is left blank (date preserved) rather than fabricated.
  const dep = localParts(raw.departureScheduled, raw.from?.tz ?? null);
  const arr = localParts(raw.arrivalScheduled, raw.to?.tz ?? null);

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

  const seat = raw.seats?.find(s => s.userId) ?? raw.seats?.[0];
  const airlineCode = entityCode(raw.airline);
  const aircraftCode = entityCode(raw.aircraft);
  const metadata: Record<string, unknown> = {};
  if (airlineCode) metadata.airline = airlineCode;
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
    departureScheduled: raw.departureScheduled ?? null,
    arrivalScheduled: raw.arrivalScheduled ?? null,
    airline: entityCode(raw.airline),
    flightNumber: raw.flightNumber ?? null,
    aircraft: entityCode(raw.aircraft),
    aircraftReg: raw.aircraftReg ?? null,
    flightReason: raw.flightReason ?? null,
    note: raw.note ?? null,
    seats: (raw.seats ?? [])
      .map(s => ({
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
