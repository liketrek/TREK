import { wallClockInstant } from '../common/timezoneService';
import { toCallsign } from './flight-live.callsign';
import type { FlightLiveAirport } from '@trek/shared';

/**
 * The legs of a booked flight with their schedule in UTC, out of what the
 * planner stores: the leg chain in `metadata.legs` (client/src/utils/flightLegs.ts
 * is the model, mirrored here rule for rule), the endpoints with their local
 * date, time and zone, and the trip days a leg names. Pure: the caller reads
 * the rows and hands in the airport lookup.
 */

/** A flight booking as the repository reads it. */
export interface FlightBookingRow {
  id: number;
  trip_id: number;
  metadata: Record<string, unknown>;
  day_id: number | null;
  end_day_id: number | null;
  /** Local "YYYY-MM-DDTHH:MM" of the first departure, when the form stored one. */
  reservation_time: string | null;
  reservation_end_time: string | null;
}

export interface FlightEndpointRow {
  reservation_id: number;
  role: string;
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_date: string | null;
  local_time: string | null;
}

/** What the bundled airport dataset knows about a code. */
export interface AirportFacts {
  name: string;
  city: string;
  lat: number;
  lng: number;
  tz: string;
}

type AirportLookup = (iata: string) => AirportFacts | null;

/** One leg that can be tracked: a callsign, both airports and the local day it departs. */
export interface ScheduledLeg {
  reservation_id: number;
  trip_id: number;
  leg_index: number;
  callsign: string;
  flight_number: string;
  service_date: string;
  origin: FlightLiveAirport;
  destination: FlightLiveAirport;
  /** Epoch ms, null when the booking holds no time for that end. */
  scheduled_departure: number | null;
  scheduled_arrival: number | null;
}

interface RawLeg {
  from: string | null;
  to: string | null;
  airline: string | null;
  flight_number: string | null;
  dep_day_id: number | null;
  dep_time: string | null;
  arr_day_id: number | null;
  arr_time: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function int(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

/** "10:30", "10:30:00" -> "10:30"; anything else is no time. */
function hhmm(value: string | null): string | null {
  return value && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : null;
}

/** The date and the time of a stored "YYYY-MM-DDTHH:MM". */
function splitLocal(iso: string | null): { date: string | null; time: string | null } {
  if (!iso) return { date: null, time: null };
  const [date, time] = iso.split('T');
  return { date: /^\d{4}-\d{2}-\d{2}$/.test(date ?? '') ? date : null, time: hhmm(time ?? null) };
}

/** "Paris Charles de Gaulle (CDG)" -> "Paris Charles de Gaulle", as the client strips it. */
function stripCode(name: string): string {
  const trimmed = name.trimEnd();
  return /\([A-Z]{3}\)$/.test(trimmed) ? trimmed.slice(0, -5).trimEnd() : name;
}

function ordered(endpoints: readonly FlightEndpointRow[]): FlightEndpointRow[] {
  return endpoints.slice().sort((a, b) => a.sequence - b.sequence);
}

/** The legs as the client's getFlightLegs reads them: `metadata.legs`, else one leg from the endpoints. */
function rawLegs(row: FlightBookingRow, endpoints: readonly FlightEndpointRow[]): RawLeg[] {
  const meta = row.metadata;
  if (Array.isArray(meta.legs) && meta.legs.length > 0) {
    return meta.legs.map((value): RawLeg => {
      const leg = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
      return {
        from: str(leg.from),
        to: str(leg.to),
        airline: str(leg.airline),
        flight_number: str(leg.flight_number),
        dep_day_id: int(leg.dep_day_id),
        dep_time: hhmm(str(leg.dep_time)),
        arr_day_id: int(leg.arr_day_id),
        arr_time: hhmm(str(leg.arr_time)),
      };
    });
  }
  const first = endpoints[0];
  const last = endpoints[endpoints.length - 1];
  const from = first?.code ?? str(meta.departure_airport);
  const to = last?.code ?? str(meta.arrival_airport);
  if (!from && !to) return [];
  return [
    {
      from,
      to,
      airline: str(meta.airline),
      flight_number: str(meta.flight_number),
      dep_day_id: row.day_id,
      dep_time: hhmm(first?.local_time ?? null),
      arr_day_id: row.end_day_id ?? row.day_id,
      arr_time: hhmm(last?.local_time ?? null),
    },
  ];
}

/** An airport of the leg from its endpoint, else from the dataset; null when its place is unknown. */
function airportOf(
  code: string | null,
  endpoint: FlightEndpointRow | undefined,
  lookup: AirportLookup,
): FlightLiveAirport | null {
  const iata = code ? code.slice(0, 3).toUpperCase() : null;
  if (!iata || !/^[A-Z0-9]{3}$/.test(iata)) return null;
  const known = lookup(iata);
  const usable = endpoint && Number.isFinite(endpoint.lat) && Number.isFinite(endpoint.lng) ? endpoint : undefined;
  if (!usable && !known) return null;
  return {
    code: iata,
    name: usable ? stripCode(usable.name) : (known?.name ?? null),
    lat: usable ? usable.lat : (known as AirportFacts).lat,
    lng: usable ? usable.lng : (known as AirportFacts).lng,
    timezone: usable?.timezone ?? known?.tz ?? null,
  };
}

/** The endpoint at the leg's end of the chain when it names that airport, else the first one that does. */
function endpointFor(
  endpoints: readonly FlightEndpointRow[],
  index: number,
  code: string | null,
): FlightEndpointRow | undefined {
  if (!code) return undefined;
  const iata = code.slice(0, 3).toUpperCase();
  const atIndex = endpoints[index];
  if (atIndex && atIndex.code?.toUpperCase() === iata) return atIndex;
  return endpoints.find((e) => e.code?.toUpperCase() === iata);
}

/** The instant a local date and time read in a zone; null when any of the three is missing. */
export function localToUtc(date: string | null, time: string | null, zone: string | null): number | null {
  if (!date || !time || !zone) return null;
  return wallClockInstant(date, time, zone);
}

/**
 * Every leg of one flight booking that can be tracked: it has a flight number
 * that maps to a callsign, both airports are known and its departure day is
 * known. The schedule is null where the booking holds no time; an arrival
 * without its own date falls on the departure day, or the next one when that
 * would put it before the departure.
 */
export function legsOfBooking(
  row: FlightBookingRow,
  endpointRows: readonly FlightEndpointRow[],
  dayDates: ReadonlyMap<number, string>,
  lookup: AirportLookup,
  airlines?: ReadonlyMap<string, string>,
): ScheduledLeg[] {
  const endpoints = ordered(endpointRows);
  const legs = rawLegs(row, endpoints);
  const firstEnd = endpoints[0];
  const lastEnd = endpoints[endpoints.length - 1];
  const start = splitLocal(row.reservation_time);
  const end = splitLocal(row.reservation_end_time);
  const single = !(Array.isArray(row.metadata.legs) && row.metadata.legs.length > 0);
  const out: ScheduledLeg[] = [];

  legs.forEach((leg, index) => {
    const callsign = toCallsign(leg.flight_number, leg.airline, airlines);
    if (!callsign || !leg.flight_number) return;
    const fromEnd = endpointFor(endpoints, index, leg.from);
    const toEnd = endpointFor(endpoints, index + 1, leg.to);
    const origin = airportOf(leg.from, fromEnd, lookup);
    const destination = airportOf(leg.to, toEnd, lookup);
    if (!origin || !destination) return;

    const isFirst = index === 0;
    const isLast = index === legs.length - 1;
    const depDayDate = leg.dep_day_id !== null ? (dayDates.get(leg.dep_day_id) ?? null) : null;
    const arrDayDate = leg.arr_day_id !== null ? (dayDates.get(leg.arr_day_id) ?? null) : null;
    const firstDate = isFirst ? (firstEnd?.local_date ?? start.date) : null;
    const lastDate = isLast ? (lastEnd?.local_date ?? end.date) : null;
    // A single leg's endpoints carry its own local dates; a chain's legs name their days.
    const depDate = (single && isFirst ? firstEnd?.local_date : null) ?? depDayDate ?? firstDate;
    const depTime = leg.dep_time ?? (isFirst ? start.time : null);
    if (!depDate) return;
    const arrDateGiven = (single && isLast ? lastEnd?.local_date : null) ?? arrDayDate ?? lastDate;
    const arrTime = leg.arr_time ?? (isLast ? end.time : null);

    const departure = localToUtc(depDate, depTime, origin.timezone);
    let arrival = localToUtc(arrDateGiven ?? depDate, arrTime, destination.timezone);
    if (arrival !== null && departure !== null && arrival <= departure) {
      arrival = arrDateGiven ? null : arrival + DAY_MS;
      if (arrival !== null && arrival <= departure) arrival = null;
    }

    out.push({
      reservation_id: row.id,
      trip_id: row.trip_id,
      leg_index: index,
      callsign,
      flight_number: leg.flight_number,
      service_date: depDate,
      origin,
      destination,
      scheduled_departure: departure,
      scheduled_arrival: arrival,
    });
  });
  return out;
}
