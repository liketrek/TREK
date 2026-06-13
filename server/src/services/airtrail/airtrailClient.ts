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
 *  - POST /api/flight/save   — `id` present => update, else create. seats[] is
 *    required (>=1). A seat with userId '<USER_ID>' is attributed to the key
 *    owner server-side, so we never need the caller's AirTrail user id.
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
  airline: string | null;
  flightNumber: string | null;
  aircraft: string | null;
  aircraftReg: string | null;
  flightReason: string | null;
  note: string | null;
  seats: AirtrailSeat[];
}

/** Write shape accepted by POST /flight/save (airports/airline/aircraft as codes). */
export interface AirtrailSavePayload {
  id?: number;
  from: string;
  to: string;
  departure: string;
  departureTime?: string | null;
  arrival?: string | null;
  arrivalTime?: string | null;
  datePrecision?: string;
  airline?: string | null;
  flightNumber?: string | null;
  aircraft?: string | null;
  aircraftReg?: string | null;
  flightReason?: string | null;
  note?: string | null;
  seats: Array<{
    userId: string | null;
    guestName: string | null;
    seat: string | null;
    seatNumber: string | null;
    seatClass: string | null;
  }>;
}

function apiBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '') + '/api';
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

export async function listFlights(creds: AirtrailCreds): Promise<AirtrailFlightRaw[]> {
  const resp = await request(creds, '/flight/list', { method: 'GET' });
  if (!resp.ok) throw new AirtrailRequestError(`AirTrail list failed (HTTP ${resp.status})`, resp.status);
  const data = (await resp.json()) as { flights?: AirtrailFlightRaw[] };
  return data.flights ?? [];
}

export async function getFlight(creds: AirtrailCreds, id: number): Promise<AirtrailFlightRaw | null> {
  const resp = await request(creds, `/flight/get/${id}`, { method: 'GET' });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new AirtrailRequestError(`AirTrail get failed (HTTP ${resp.status})`, resp.status);
  const data = (await resp.json()) as { flight?: AirtrailFlightRaw };
  return data.flight ?? null;
}

export async function saveFlight(creds: AirtrailCreds, payload: AirtrailSavePayload): Promise<{ id?: number }> {
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
  const data = (await resp.json()) as { id?: number };
  return { id: data.id };
}
