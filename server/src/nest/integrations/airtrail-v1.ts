import { wallClockInstant } from '../common/timezoneService';
import type { AirtrailAirport, AirtrailFlightRaw, AirtrailSavePayload } from './airtrail.client';

/**
 * The translation between AirTrail's `/api/v1` and the shapes the rest of TREK
 * uses (AirtrailFlightRaw, AirtrailSavePayload), which are the shapes of the
 * legacy `/api/flight/*` routes. The callers use one shape for each API that an
 * instance speaks. This file is the only place that knows the difference.
 *
 * The contract comes from AirTrail 3.13.0 to 3.14.0 (`src/lib/api/v1/schemas.ts`,
 * `src/lib/api/v1/dto.ts`). The v1 contract is the same in these versions.
 *
 * The functions are pure, so the unit test gives them fixture objects.
 */

/** An airport as v1 returns it, on a flight and from `GET /api/v1/airports`. */
export interface AirtrailV1Airport {
  id: number;
  icao: string | null;
  iata: string | null;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  country: string | null;
}

/** An airline or aircraft as v1 returns it. Aircraft have no IATA code. */
export interface AirtrailV1Entity {
  id: number;
  name: string | null;
  icao: string | null;
  iata?: string | null;
}

interface AirtrailV1Passenger {
  id: number;
  user: { id: string } | null;
  guestName: string | null;
  seat: string | null;
  seatNumber: string | null;
  seatClass: string | null;
  flightReason: string | null;
}

/** A flight as `GET /api/v1/flights` and `GET /api/v1/flights/{id}` return it. */
export interface AirtrailV1Flight {
  id: number;
  from: AirtrailV1Airport | null;
  to: AirtrailV1Airport | null;
  airline: AirtrailV1Entity | null;
  aircraft: AirtrailV1Entity | null;
  passengers: AirtrailV1Passenger[];
  [key: string]: unknown;
}

/** What a v1 write needs that a code-based payload does not carry. */
export interface AirtrailV1References {
  from: AirtrailV1Airport;
  to: AirtrailV1Airport;
  airlineId: number | null;
  aircraftId: number | null;
  /** The key owner's AirTrail user id, for a `<USER_ID>` passenger. */
  selfUserId: string | null;
}

/** A payload that cannot become a valid v1 body. The message is for the log. */
export class AirtrailV1InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AirtrailV1InputError';
  }
}

/** The placeholder the legacy save resolved to the key owner. */
export const AIRTRAIL_SELF_USER_PLACEHOLDER = '<USER_ID>';

function toAirport(a: AirtrailV1Airport | null): AirtrailAirport | null {
  if (!a) return null;
  return {
    id: a.id,
    icao: a.icao,
    iata: a.iata,
    name: a.name,
    lat: a.latitude,
    lon: a.longitude,
    tz: a.timezone,
    country: a.country,
  };
}

/**
 * A v1 flight in the legacy shape. Airports rename their coordinate and zone
 * keys, and a passenger names its user as an object instead of a `userId`.
 * Every other key passes through, so `buildSavePayload` still carries the
 * AirTrail-owned fields (terminal, gate, takeoff and landing times) it does not
 * model.
 */
export function fromAirtrailV1Flight(f: AirtrailV1Flight): AirtrailFlightRaw {
  return {
    ...(f as unknown as AirtrailFlightRaw),
    from: toAirport(f.from),
    to: toAirport(f.to),
    passengers: (f.passengers ?? []).map((p) => ({
      userId: p.user?.id ?? null,
      guestName: p.guestName,
      seat: p.seat,
      seatNumber: p.seatNumber,
      seatClass: p.seatClass,
      flightReason: p.flightReason,
    })),
  };
}

/**
 * The entry of a search result whose code is `code`: an ICAO match first, then
 * an IATA match, as the legacy save looked up an airport. With `icaoOnly`, an
 * IATA match does not count, as the legacy save looked up an airline and an
 * aircraft.
 */
export function pickAirtrailByCode<T extends { icao?: string | null; iata?: string | null }>(
  rows: T[],
  code: string,
  icaoOnly: boolean,
): T | null {
  const wanted = code.trim().toUpperCase();
  const icao = rows.find((r) => r.icao?.toUpperCase() === wanted);
  if (icao || icaoOnly) return icao ?? null;
  return rows.find((r) => r.iata?.toUpperCase() === wanted) ?? null;
}

const DATE = /^\d{4}-\d{2}-\d{2}/;
const FULL_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function datePart(value: unknown): string | null {
  return typeof value === 'string' && DATE.test(value) ? value.slice(0, 10) : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * A local date and `HH:MM` at an airport, as an ISO instant. Null when there is no time.
 *
 * AirTrail stores the string as it gets it, and the sync hash reads that string.
 * The instant ends in `+00:00`, as the legacy save wrote it, so that a save
 * that changes no time keeps the hash.
 */
function localInstant(date: string | null, time: unknown, zone: string | null, field: string): string | null {
  if (!date || typeof time !== 'string' || !time) return null;
  const ms = wallClockInstant(date, time, zone || 'UTC');
  if (ms === null) throw new AirtrailV1InputError(`Invalid ${field} time "${time}" on ${date}`);
  return new Date(ms).toISOString().replace(/Z$/, '+00:00');
}

/**
 * A takeoff or landing time. The payload carries it as AirTrail returned it (an
 * ISO instant) unless a caller set the date and `HH:MM` form; the instant then
 * passes through unchanged.
 */
function carriedInstant(p: Record<string, unknown>, key: string, zone: string | null): string | null {
  if (`${key}Time` in p) return localInstant(datePart(p[key]), p[`${key}Time`], zone, key);
  const value = p[key];
  return typeof value === 'string' && FULL_ISO.test(value) ? value : null;
}

/**
 * A legacy save payload as a v1 flight body (`POST /api/v1/flights`,
 * `PUT /api/v1/flights/{id}`), with the rules the legacy save applied:
 *  - Departure and its scheduled time are the local wall clock at the origin,
 *    arrival and its scheduled time at the destination. A date without a time
 *    gives no instant. An arrival time without an arrival date takes the
 *    departure date.
 *  - `date` is the departure date, else the scheduled departure date.
 *  - A precision other than `day` keeps only the departure, at 10:00 UTC.
 *  - A flight-level reason fills each passenger that has none.
 *
 * v1 does not derive `duration`, so it is the departure-to-arrival time when
 * both are known, else the duration AirTrail had.
 *
 * v1 replaces every field a PUT omits with its default, so the body names each
 * field except `track`. Without a track, AirTrail keeps the stored track. A
 * track in the body needs the `tracks.write` scope.
 */
export function toAirtrailV1FlightInput(
  payload: AirtrailSavePayload,
  refs: AirtrailV1References,
): Record<string, unknown> {
  const p = payload as unknown as Record<string, unknown>;
  const fromTz = refs.from.timezone;
  const toTz = refs.to.timezone;

  const depDate = datePart(p.departure);
  const date = depDate ?? datePart(p.departureScheduled);
  if (!date) throw new AirtrailV1InputError('A departure date is required');

  const datePrecision = text(p.datePrecision) ?? 'day';
  const passengers = (payload.passengers ?? payload.seats ?? []).map((s) => {
    const userId = s.userId === AIRTRAIL_SELF_USER_PLACEHOLDER ? refs.selfUserId : s.userId;
    if (s.userId === AIRTRAIL_SELF_USER_PLACEHOLDER && !userId)
      throw new AirtrailV1InputError('The AirTrail user of this API key is unknown');
    return {
      userId: userId ?? null,
      guestName: s.guestName ?? null,
      seat: s.seat ?? null,
      seatNumber: s.seatNumber ?? null,
      seatClass: s.seatClass ?? null,
      flightReason: s.flightReason ?? payload.flightReason ?? null,
    };
  });

  let times: Record<string, string | null>;
  if (datePrecision !== 'day') {
    times = {
      departure: `${date}T10:00:00.000+00:00`,
      arrival: null,
      departureScheduled: null,
      arrivalScheduled: null,
      takeoffScheduled: null,
      takeoffActual: null,
      landingScheduled: null,
      landingActual: null,
    };
  } else {
    const arrivalDate = datePart(p.arrival) ?? (p.arrivalTime ? depDate : null);
    times = {
      departure: localInstant(depDate, p.departureTime, fromTz, 'departure'),
      arrival: localInstant(arrivalDate, p.arrivalTime, toTz, 'arrival'),
      departureScheduled: localInstant(
        datePart(p.departureScheduled),
        p.departureScheduledTime,
        fromTz,
        'scheduled departure',
      ),
      arrivalScheduled: localInstant(datePart(p.arrivalScheduled), p.arrivalScheduledTime, toTz, 'scheduled arrival'),
      takeoffScheduled: carriedInstant(p, 'takeoffScheduled', fromTz),
      takeoffActual: carriedInstant(p, 'takeoffActual', fromTz),
      landingScheduled: carriedInstant(p, 'landingScheduled', toTz),
      landingActual: carriedInstant(p, 'landingActual', toTz),
    };
  }

  const known =
    times.departure && times.arrival ? (Date.parse(times.arrival) - Date.parse(times.departure)) / 1000 : null;
  const duration =
    known !== null && known >= 0 ? Math.round(known) : typeof p.duration === 'number' ? p.duration : null;

  return {
    date,
    datePrecision,
    ...times,
    duration,
    departureTerminal: text(p.departureTerminal),
    departureGate: text(p.departureGate),
    arrivalTerminal: text(p.arrivalTerminal),
    arrivalGate: text(p.arrivalGate),
    flightNumber: text(p.flightNumber),
    aircraftReg: text(p.aircraftReg),
    note: text(p.note),
    fromId: refs.from.id,
    toId: refs.to.id,
    airlineId: refs.airlineId,
    aircraftId: refs.aircraftId,
    passengers,
  };
}
