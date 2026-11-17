import { safeFetch } from '../../utils/ssrfGuard';
import {
  AirtrailV1InputError,
  fromAirtrailV1Flight,
  pickAirtrailByCode,
  AIRTRAIL_SELF_USER_PLACEHOLDER,
  toAirtrailV1FlightInput,
  type AirtrailV1Airport,
  type AirtrailV1Entity,
  type AirtrailV1Flight,
} from './airtrail-v1';
import { Injectable } from '@nestjs/common';

/**
 * Thin HTTP client for the AirTrail REST API (github.com/johanohly/AirTrail).
 * This is the ONLY place that talks to a user's AirTrail instance.
 *
 * AirTrail 3.13.0 and later serve the versioned API under `/api/v1`. They mark
 * the `/api/flight/*` routes as deprecated, and the next major release removes
 * them. Older instances have only `/api/flight/*`. The client asks the public
 * discovery document `GET /api/v1` which API an instance has, and keeps the
 * answer for FLAVOR_TTL_MS (see `apiFlavor`). A 404 from a flight route cannot
 * tell the difference, because v1 also answers 404 for a flight that does not exist.
 *
 * Both APIs, verified against AirTrail source:
 *  - Auth: `Authorization: Bearer <key>`; a key maps to exactly one user. A key
 *    made before 3.13.0 holds every scope. A newer key needs `flight.read.own`,
 *    and for the write-back also `flight.update.own`,
 *    `flight.passengers.manage.own` (a PUT that changes a passenger, for example
 *    the seat), `reference_data.read` (code lookups) and `profile.read`
 *    (`GET /api/v1/me`, for a flight with no passenger). A save with no id also
 *    needs `flight.create.own`. A missing scope raises AirtrailScopeError, which
 *    names it.
 *  - The flight list defaults to scope=mine. We NEVER send a scope param so the
 *    key only ever returns its owner's own flights (isolation holds even if an
 *    admin key is pasted). v1 gives the list in pages, and the client reads every page.
 *  - Legacy: GET /api/flight/list, GET /api/flight/get/{id}, and
 *    POST /api/flight/save (`id` present => update, else create), with airports,
 *    airline and aircraft as codes and times as a local date plus `HH:MM`. An
 *    entry with userId '<USER_ID>' is attributed to the key owner server-side.
 *  - v1: GET /api/v1/flights, GET /api/v1/flights/{id}, POST /api/v1/flights,
 *    PUT /api/v1/flights/{id}, with numeric ids and ISO instants. airtrail-v1.ts
 *    translates both ways, so callers use the legacy shapes for either API.
 *  - The passenger list is required (>=1). AirTrail 3.12.0 renamed it from
 *    `seats` to `passengers` and moved flightReason from the flight onto each
 *    passenger, with no alias on either side (verified against running 3.11.1
 *    and 3.12.0 instances: each returns its own key and null for the other).
 *    TREK reads and writes both shapes so one build works against either version.
 *  - There is no webhook and no updated_at on a flight, so change detection is
 *    snapshot-hash based (see airtrailSync).
 */

const TIMEOUT_MS = 12000;
/** How long the client keeps the answer of the discovery probe. After this time, it sees an AirTrail upgrade. */
const FLAVOR_TTL_MS = 10 * 60_000;
/** The largest page `GET /api/v1/flights` gives. */
const V1_PAGE_LIMIT = 100;
/**
 * The most list pages read in one call (5000 flights). Past it the list fails
 * instead of answering a part, because the sync detaches every linked flight
 * that is missing from the list.
 */
const V1_MAX_PAGES = 50;

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

/**
 * A v1 key that is valid but does not have a scope that the request needs. It is
 * not an AirtrailAuthError, because the key still works for its other scopes.
 * A caller must not detach linked flights for this error.
 */
export class AirtrailScopeError extends Error {
  readonly scope: string | null;
  constructor(scope: string | null) {
    super(
      scope
        ? `The AirTrail API key lacks the scope ${scope}. Add it to the key in AirTrail, or create a new key.`
        : 'The AirTrail API key lacks a scope that this request needs.',
    );
    this.name = 'AirtrailScopeError';
    this.scope = scope;
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
  const origin = baseUrl
    .trim()
    .replace(/(?<!\/)\/+$/, '')
    .replace(/\/api$/i, '');
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

/** The error of a v1 error body (`{error:{code,message,details}}`), when the response holds one. */
async function airtrailV1Error(resp: Response): Promise<{ code: string | null; message: string } | null> {
  try {
    const body = JSON.parse(await resp.text()) as { error?: { code?: unknown; message?: unknown; details?: unknown } };
    const message = typeof body?.error?.message === 'string' ? body.error.message : null;
    if (!message) return null;
    const code = typeof body.error?.code === 'string' ? body.error.code : null;
    const details = body.error?.details;
    return { code, message: details === undefined ? message : `${message}: ${JSON.stringify(details)}` };
  } catch {
    return null;
  }
}

/** The scope name in AirTrail's `insufficient_scope` message ("The credential requires flight.read.own"). */
function scopeIn(message: string): string | null {
  return /\b[a-z_]+(?:\.[a-z_]+)+\b/.exec(message)?.[0] ?? null;
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
    // v1 gives the cause, for example the scope that the key does not have. The legacy API does not.
    const reason = await airtrailV1Error(resp);
    if (reason?.code === 'insufficient_scope') throw new AirtrailScopeError(scopeIn(reason.message));
    throw reason ? new AirtrailAuthError(`AirTrail refused the request: ${reason.message}`) : new AirtrailAuthError();
  }
  return resp;
}

async function airtrailV1Failure(resp: Response, action: string): Promise<AirtrailRequestError> {
  const reason = await airtrailV1Error(resp);
  return new AirtrailRequestError(reason?.message ?? `AirTrail ${action} failed (HTTP ${resp.status})`, resp.status);
}

type ApiFlavor = 'v1' | 'legacy';

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
  /** The API each instance speaks, by API base URL, with the time it was asked. */
  private readonly flavors = new Map<string, { flavor: ApiFlavor; at: number }>();

  async listFlights(creds: AirtrailCreds): Promise<AirtrailFlightRaw[]> {
    if ((await this.apiFlavor(creds)) === 'v1') return this.listFlightsV1(creds);
    const resp = await request(creds, '/flight/list', { method: 'GET' });
    if (!resp.ok) throw new AirtrailRequestError(`AirTrail list failed (HTTP ${resp.status})`, resp.status);
    const data = await parseJson<{ flights?: AirtrailFlightRaw[] }>(resp);
    return data.flights ?? [];
  }

  async getFlight(creds: AirtrailCreds, id: number): Promise<AirtrailFlightRaw | null> {
    const flavor = await this.apiFlavor(creds);
    const flight = await this.getFlightAs(creds, id, flavor);
    if (flight) return flight;
    // A 404 from a stale answer (AirTrail was upgraded or downgraded) looks like a deleted
    // flight, and a caller detaches a deleted flight. Ask the probe again before null.
    this.flavors.delete(apiBase(creds.baseUrl));
    const fresh = await this.apiFlavor(creds);
    return fresh === flavor ? null : this.getFlightAs(creds, id, fresh);
  }

  private async getFlightAs(creds: AirtrailCreds, id: number, flavor: ApiFlavor): Promise<AirtrailFlightRaw | null> {
    const v1 = flavor === 'v1';
    const resp = await request(creds, v1 ? `/v1/flights/${id}` : `/flight/get/${id}`, { method: 'GET' });
    if (resp.status === 404) return null;
    if (!resp.ok) throw new AirtrailRequestError(`AirTrail get failed (HTTP ${resp.status})`, resp.status);
    if (v1) {
      const data = await parseJson<{ data?: AirtrailV1Flight }>(resp);
      return data.data ? fromAirtrailV1Flight(data.data) : null;
    }
    const data = await parseJson<{ flight?: AirtrailFlightRaw }>(resp);
    return data.flight ?? null;
  }

  async saveFlight(creds: AirtrailCreds, payload: AirtrailSavePayload): Promise<{ id?: number }> {
    if ((await this.apiFlavor(creds)) === 'v1') return this.saveFlightV1(creds, payload);
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

  /**
   * Which API the instance speaks. `GET /api/v1` is public and answers a
   * discovery document with `api.version` on 3.13.0 and later. An older
   * instance answers 404. The client keeps only these two answers. For each
   * other answer, the client asks again on the next call:
   *  - A 5xx, a timeout or a network error fails this call.
   *  - A page that is not the discovery document (for example a login page in
   *    front of AirTrail) sends this call to the legacy route. The error of
   *    that route explains a wrong URL.
   */
  private async apiFlavor(creds: AirtrailCreds): Promise<ApiFlavor> {
    const base = apiBase(creds.baseUrl);
    const known = this.flavors.get(base);
    if (known && Date.now() - known.at < FLAVOR_TTL_MS) return known.flavor;

    let resp: Response;
    try {
      resp = await request(creds, '/v1', { method: 'GET' });
    } catch (err) {
      // `GET /api/v1` is public in AirTrail, so a 401 or 403 comes from a proxy in front of it.
      // It says nothing about the key. Use the legacy route for this call, and do not keep the answer.
      if (err instanceof AirtrailAuthError || err instanceof AirtrailScopeError) return 'legacy';
      throw err;
    }
    let flavor: ApiFlavor;
    let keep = true;
    if (resp.status === 404) {
      flavor = 'legacy';
    } else if (resp.ok) {
      let version: unknown;
      try {
        version = (JSON.parse(await resp.text()) as { api?: { version?: unknown } })?.api?.version;
      } catch {
        version = undefined;
      }
      flavor = version === 'v1' ? 'v1' : 'legacy';
      keep = flavor === 'v1';
    } else {
      throw new AirtrailRequestError(`AirTrail did not answer (HTTP ${resp.status})`, resp.status);
    }
    if (keep) {
      if (this.flavors.size >= 1000) this.flavors.clear();
      this.flavors.set(base, { flavor, at: Date.now() });
    }
    return flavor;
  }

  /**
   * Every page of `GET /api/v1/flights`, one after the other, because each
   * request needs the cursor of the page before it.
   */
  private async listFlightsV1(
    creds: AirtrailCreds,
    cursor: string | null = null,
    flights: AirtrailFlightRaw[] = [],
    seen: Set<string> = new Set(),
  ): Promise<AirtrailFlightRaw[]> {
    const query = new URLSearchParams({ limit: String(V1_PAGE_LIMIT) });
    if (cursor) query.set('cursor', cursor);
    const resp = await request(creds, `/v1/flights?${query}`, { method: 'GET' });
    if (!resp.ok) throw new AirtrailRequestError(`AirTrail list failed (HTTP ${resp.status})`, resp.status);
    const body = await parseJson<{ data?: AirtrailV1Flight[]; page?: { nextCursor?: string | null } }>(resp);
    for (const f of body.data ?? []) flights.push(fromAirtrailV1Flight(f));
    const next = body.page?.nextCursor ?? null;
    if (!next) return flights;
    // A cursor that came before makes an endless loop. AirTrail does not send one, but a caching proxy can.
    if (seen.has(next)) throw new AirtrailRequestError('AirTrail repeated a page cursor');
    seen.add(next);
    if (seen.size >= V1_MAX_PAGES)
      throw new AirtrailRequestError(`AirTrail has more than ${V1_MAX_PAGES * V1_PAGE_LIMIT} flights`);
    return this.listFlightsV1(creds, next, flights, seen);
  }

  private async saveFlightV1(creds: AirtrailCreds, payload: AirtrailSavePayload): Promise<{ id?: number }> {
    const [from, to, airline, aircraft] = await Promise.all([
      this.findByCode<AirtrailV1Airport>(creds, 'airports', payload.from, false, 'departure airport'),
      this.findByCode<AirtrailV1Airport>(creds, 'airports', payload.to, false, 'arrival airport'),
      payload.airline ? this.findByCode<AirtrailV1Entity>(creds, 'airlines', payload.airline, true, 'airline') : null,
      payload.aircraft
        ? this.findByCode<AirtrailV1Entity>(creds, 'aircraft', payload.aircraft, true, 'aircraft')
        : null,
    ]);
    const people = payload.passengers ?? payload.seats ?? [];
    const selfUserId = people.some((s) => s.userId === AIRTRAIL_SELF_USER_PLACEHOLDER)
      ? await this.selfUserId(creds)
      : null;

    let body: Record<string, unknown>;
    try {
      body = toAirtrailV1FlightInput(payload, {
        from,
        to,
        airlineId: airline?.id ?? null,
        aircraftId: aircraft?.id ?? null,
        selfUserId,
      });
    } catch (err) {
      if (err instanceof AirtrailV1InputError) throw new AirtrailRequestError(err.message, 400);
      throw err;
    }

    const update = payload.id !== undefined && payload.id !== null;
    const resp = await request(creds, update ? `/v1/flights/${payload.id}` : '/v1/flights', {
      method: update ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw await airtrailV1Failure(resp, 'save');
    // The legacy save answers an id only for a new flight. This method does the same.
    if (update) return {};
    const data = await parseJson<{ data?: { id?: number } }>(resp);
    return { id: data.data?.id };
  }

  /**
   * The row whose code is `code`, from a v1 reference search. The search also
   * matches names, so `pickAirtrailByCode` compares the code again.
   */
  private async findByCode<T extends { id: number; icao?: string | null; iata?: string | null }>(
    creds: AirtrailCreds,
    kind: 'airports' | 'airlines' | 'aircraft',
    code: string,
    icaoOnly: boolean,
    label: string,
  ): Promise<T> {
    const resp = await request(creds, `/v1/${kind}?${new URLSearchParams({ query: code.trim() })}`, {
      method: 'GET',
    });
    if (!resp.ok) throw await airtrailV1Failure(resp, `${label} lookup`);
    const body = await parseJson<{ data?: T[] }>(resp);
    const row = pickAirtrailByCode(body.data ?? [], code, icaoOnly);
    if (!row) throw new AirtrailRequestError(`Invalid ${label}: ${code}`, 400);
    return row;
  }

  /** The AirTrail user id of the key owner, which v1 needs where the legacy save took '<USER_ID>'. */
  private async selfUserId(creds: AirtrailCreds): Promise<string> {
    const resp = await request(creds, '/v1/me', { method: 'GET' });
    if (!resp.ok) throw await airtrailV1Failure(resp, 'profile read');
    const body = await parseJson<{ data?: { id?: unknown } }>(resp);
    if (typeof body.data?.id !== 'string') throw new AirtrailRequestError('AirTrail did not name the key owner');
    return body.data.id;
  }
}
