import { Injectable } from '@nestjs/common';
import { safeFetch } from '../../utils/ssrfGuard';

/**
 * Thin HTTP client for the AirTrail REST API (github.com/johanohly/AirTrail).
 * This is the ONLY place that talks to a user's AirTrail instance.
 *
 * Verified against AirTrail source:
 *  - Auth: `Authorization: Bearer <key>`; a key maps to exactly one user.
 *  - GET  /api/flight/list   — defaults to scope=mine. We NEVER send a scope
 *    param so the key only ever returns its owner's own flights (isolation
 *    holds even if an admin key is pasted).
 *  - GET  /api/flight/get/{id}
 *  - POST /api/flight/save   — `id` present => update, else create. The
 *    passenger list is required (>=1). An entry with userId '<USER_ID>' is
 *    attributed to the key owner server-side, so we never need the caller's
 *    AirTrail user id.
 *  - AirTrail 3.12.0 renamed that list from `seats` to `passengers` and moved
 *    flightReason from the flight onto each passenger, with no alias on either
 *    side (verified against running 3.11.1 and 3.12.0 instances: each returns
 *    its own key and null for the other). TREK reads and writes both shapes so
 *    one build works against either version.
 *  - There is no webhook and no updated_at on a flight, so change detection is
 *    snapshot-hash based (see airtrailSync).
 */

const TIMEOUT_MS = 12000;

export interface AirtrailCreds {
  /** Instance origin without a trailing /api. */
  baseUrl: string;
  apiKey: string;
  allowInsecureTls: boolean;
}

export class AirtrailAuthError extends Error {
  constructor(message = 'AirTrail rejected the API key') {
    super(message);
    this.name = 'AirtrailAuthError';
  }
}

export class AirtrailRequestError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AirtrailRequestError';
    this.status = status;
  }
}

export interface AirtrailAirport {
  id: number;
  icao: string | null;
  iata: string | null;
  name: string | null;
  lat: number | null;
  lon: number | null;
  tz: string | null;
  country: string | null;
}

export interface AirtrailSeat {
  userId: string | null;
  guestName: string | null;
  seat: string | null;
  seatNumber: string | null;
  seatClass: string | null;
  /** Per-passenger since 3.12.0; absent on older instances. */
  flightReason?: string | null;
}

/** Airline/aircraft come back as joined objects (not bare codes) on a flight. */
export interface AirtrailNamedCode {
  id?: number;
  icao?: string | null;
  iata?: string | null;
  name?: string | null;
}

/** A flight as returned by list/get (the fields TREK consumes). */
export interface AirtrailFlightRaw {
  id: number;
  from: AirtrailAirport | null;
  to: AirtrailAirport | null;
  date: string | null;
  datePrecision: string | null;
  departure: string | null;
  arrival: string | null;
  departureScheduled: string | null;
  arrivalScheduled: string | null;
  airline: AirtrailNamedCode | null;
  flightNumber: string | null;
  aircraft: AirtrailNamedCode | null;
  aircraftReg: string | null;
  /** Flight-level up to 3.11.x; gone in 3.12.0, where it sits on the passenger. */
  flightReason?: string | null;
  note: string | null;
  /** 3.11.x and older. */
  seats?: AirtrailSeat[];
  /** 3.12.0 and newer. */
  passengers?: AirtrailSeat[];
}

/**
 * The passenger list under whichever name this instance uses, and the entry
 * belonging to the key owner (the one carrying a userId).
 */
export function flightPassengers(raw: Pick<AirtrailFlightRaw, 'seats' | 'passengers'>): AirtrailSeat[] {
  return raw.passengers ?? raw.seats ?? [];
}

export function ownPassenger(raw: Pick<AirtrailFlightRaw, 'seats' | 'passengers'>): AirtrailSeat | undefined {
  const people = flightPassengers(raw);
  return people.find((s) => s.userId) ?? people[0];
}

/** Write shape accepted by POST /flight/save (airports/airline/aircraft as codes). */
export interface AirtrailSavePayload {
  id?: number;
  from: string;
  to: string;
  departure: string | null;
  departureTime?: string | null;
  arrival?: string | null;
  arrivalTime?: string | null;
  departureScheduled?: string | null;
  departureScheduledTime?: string | null;
  arrivalScheduled?: string | null;
  arrivalScheduledTime?: string | null;
  datePrecision?: string;
  airline?: string | null;
  flightNumber?: string | null;
  aircraft?: string | null;
  aircraftReg?: string | null;
  flightReason?: string | null;
  note?: string | null;
  /**
   * Sent under both names on purpose. Neither schema is strict, so each version
   * validates the key it knows and strips the other one.
   */
  seats: AirtrailPassengerWrite[];
  passengers: AirtrailPassengerWrite[];
}

export interface AirtrailPassengerWrite {
  userId: string | null;
  guestName: string | null;
  seat: string | null;
  seatNumber: string | null;
  seatClass: string | null;
  flightReason?: string | null;
}

function apiBase(baseUrl: string): string {
  // Tolerate a pasted trailing slash or '/api' suffix so we never build '/api/api'.
  // The lookbehind matches only the first slash of the trailing run. Without it the
  // engine retries from every slash, which is quadratic on a slash-heavy value.
  const origin = baseUrl.trim().replace(/(?<!\/)\/+$/, '').replace(/\/api$/i, '');
  return origin + '/api';
}

/**
 * Parse a response as JSON, but turn the cryptic "Unexpected token '<'" that a
 * misconfigured URL produces (AirTrail serving its SPA / an auth-proxy login
 * page) into an actionable message.
 */
async function parseJson<T>(resp: Response): Promise<T> {
  const text = await resp.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AirtrailRequestError(
      'AirTrail returned a non-JSON response. Check the URL is your AirTrail base URL (e.g. https://airtrail.example.com, without /api) and that the instance is reachable without a separate login.',
    );
  }
}

async function request(creds: AirtrailCreds, path: string, init: RequestInit): Promise<Response> {
  const url = apiBase(creds.baseUrl) + path;
  let resp: Response;
  try {
    resp = await safeFetch(
      url,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${creds.apiKey}`,
          Accept: 'application/json',
          ...(init.headers || {}),
        },
        signal: AbortSignal.timeout(TIMEOUT_MS) as any,
      },
      { rejectUnauthorized: !creds.allowInsecureTls },
    );
  } catch (err: unknown) {
    throw new AirtrailRequestError(err instanceof Error ? err.message : 'Could not reach AirTrail');
  }
  if (resp.status === 401 || resp.status === 403) {
    throw new AirtrailAuthError();
  }
  return resp;
}


/**
 * The AirTrail HTTP surface, as a provider.
 *
 * It has no constructor dependencies: `safeFetch` is the SSRF guard, a plain
 * util that fifteen other nest services import directly. The error classes stay
 * exported classes rather than becoming anything injectable, because four call
 * sites branch on `instanceof` and on `err.status === 400`.
 */
@Injectable()
export class AirtrailClient {
  async listFlights(creds: AirtrailCreds): Promise<AirtrailFlightRaw[]> {
    const resp = await request(creds, '/flight/list', { method: 'GET' });
    if (!resp.ok) throw new AirtrailRequestError(`AirTrail list failed (HTTP ${resp.status})`, resp.status);
    const data = await parseJson<{ flights?: AirtrailFlightRaw[] }>(resp);
    return data.flights ?? [];
  }

  async getFlight(creds: AirtrailCreds, id: number): Promise<AirtrailFlightRaw | null> {
    const resp = await request(creds, `/flight/get/${id}`, { method: 'GET' });
    if (resp.status === 404) return null;
    if (!resp.ok) throw new AirtrailRequestError(`AirTrail get failed (HTTP ${resp.status})`, resp.status);
    const data = await parseJson<{ flight?: AirtrailFlightRaw }>(resp);
    return data.flight ?? null;
  }

  async saveFlight(creds: AirtrailCreds, payload: AirtrailSavePayload): Promise<{ id?: number }> {
    const resp = await request(creds, '/flight/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      let msg = `AirTrail save failed (HTTP ${resp.status})`;
      try {
        const body = (await resp.json()) as { message?: string; errors?: unknown };
        if (body?.message) msg = body.message;
        else if (body?.errors) msg = JSON.stringify(body.errors);
      } catch {
        /* keep the generic message */
      }
      throw new AirtrailRequestError(msg, resp.status);
    }
    const data = await parseJson<{ id?: number }>(resp);
    return { id: data.id };
  }
}
