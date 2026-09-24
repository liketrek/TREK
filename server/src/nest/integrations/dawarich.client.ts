import { Injectable } from '@nestjs/common';
import type { DawarichErrorCode } from '@trek/shared';
import { safeFetch } from '../../utils/ssrfGuard';
import { readCappedJson } from '../../utils/cappedFetch';
import { mergeVisitedCountries, splitWindow, VISITED_CITIES_WINDOW_DAYS } from './dawarich.helpers';

/**
 * Thin HTTP client for the Dawarich REST API (github.com/Freika/dawarich).
 * This is the ONLY place that talks to a user's Dawarich instance.
 *
 * Verified against the Dawarich source at 1.14.4 (2026-09-06), not against its
 * prose documentation — the two disagree in the places that matter here:
 *
 *  - **Auth**: `Authorization: Bearer <key>` (or `?api_key=`, which this client
 *    never uses — a key in a query string ends up in every access log between
 *    here and there). `User.find_by(api_key:)` means one key per user and no
 *    scopes: the key reads that user's whole archive. Granular Dawarich tokens
 *    were discussed and have not shipped, so TREK must not depend on them.
 *  - **Version**: every response carries `X-Dawarich-Version`. That is the
 *    instance's own word on what it is, which beats guessing from behaviour.
 *  - `GET /api/v1/health` skips authentication, so it proves reachability and
 *    nothing else. `GET /api/v1/users/me` is the key test.
 *  - `GET /api/v1/visits?start_at&end_at` filters on `started_at` ONLY. A stay
 *    that began before the window is not returned even if it ran well into it,
 *    so callers widen the window rather than trusting its edges. Without a
 *    `page` parameter it returns the whole range in one response; with one, the
 *    page size caps at 500 and the count arrives in `X-Total-Pages`.
 *  - A visit carries **no `updated_at`** and its `place` carries **no country
 *    code**. Change detection is therefore hash-based and the country is
 *    resolved from the coordinates; see dawarich-sync.service.ts.
 *  - Deleting a visit is a soft delete that removes it from the index. Absence
 *    from a full re-read is the only deletion signal there is.
 *  - `GET /api/v1/tracks` answers GeoJSON with one LineString per track and
 *    `start_at`/`end_at` in the properties — a far better overlay source than
 *    raw points. `GET /api/v1/points?slim=true` is the fallback, and its
 *    `latitude`/`longitude` arrive as **strings**.
 */

const TIMEOUT_MS = 15000;

/** A page of visits is a few hundred small objects; a megabyte is misbehaviour. */
const MAX_JSON_BYTES = 8 * 1024 * 1024;

/** Dawarich's own ceiling for `per_page` on visits. Asking for more is silently capped. */
export const VISITS_PAGE_SIZE = 500;
/** Tracks default to 500 per page and carry whole geometries, so we ask for fewer. */
export const TRACKS_PAGE_SIZE = 200;
/** Points cap at 10000 upstream. A day of tracking is a few thousand. */
export const POINTS_PAGE_SIZE = 5000;

/**
 * How many pages one call will walk before giving up and saying so.
 *
 * A cap rather than a loop: a misconfigured instance answering the same page
 * forever would otherwise hold a request open until the timeout, and a caller
 * that is told the result is incomplete can do something about it. Every
 * paginated method reports `truncated` rather than pretending it saw everything.
 */
const MAX_PAGES = 20;

export interface DawarichCreds {
  /** Instance origin without a trailing /api. */
  baseUrl: string;
  apiKey: string;
  allowInsecureTls: boolean;
}

/**
 * A failed Dawarich call, carrying the reason as a code.
 *
 * The code is what reaches the user (through i18n on the client) because the
 * upstream message is English, occasionally quotes the URL back, and on a
 * misconfigured reverse proxy is an HTML login page. `detail` keeps the
 * original for the places where a human is debugging their own setup.
 */
export class DawarichError extends Error {
  readonly code: DawarichErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(code: DawarichErrorCode, message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'DawarichError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

/** A visit exactly as `Api::VisitSerializer` emits it. Nothing is assumed optional-but-present. */
export interface DawarichVisitRaw {
  id: number | string;
  area_id: number | null;
  user_id?: number;
  started_at: string;
  ended_at: string;
  /** Seconds in current builds; TREK normalises rather than trusting the unit. */
  duration: number | string | null;
  name: string | null;
  status: string | null;
  confidence: number | string | null;
  confidence_band: string | null;
  place: {
    latitude: number | string | null;
    longitude: number | string | null;
    id: number | null;
    /** Requested upstream, absent at 1.14.4. Read defensively so it lights up on its own. */
    country_code?: string | null;
  } | null;
  /** Requested upstream, absent at 1.14.4. */
  updated_at?: string | null;
}

/** One GeoJSON feature from `GET /api/v1/tracks`. */
export interface DawarichTrackFeature {
  type?: string;
  geometry: { type?: string; coordinates?: unknown } | null;
  properties: {
    id?: number | string;
    start_at?: string;
    end_at?: string;
    distance?: number | null;
    duration?: number | null;
    dominant_mode?: string | null;
  } | null;
}

/** One entry of `GET /api/v1/points?slim=true`. lat/lng are strings upstream. */
export interface DawarichSlimPoint {
  id?: number;
  latitude: string | number;
  longitude: string | number;
  /** Unix seconds. */
  timestamp: number;
  country_name?: string | null;
}

/** One country of `GET /api/v1/countries/visited_cities`. */
export interface DawarichVisitedCountry {
  country: string;
  cities: Array<{
    city: string;
    points?: number;
    /** Unix seconds of the last point in that city. */
    timestamp?: number;
    /** Minutes. */
    stayed_for?: number;
  }>;
}

/** One stay near a coordinate from `GET /api/v1/locations`. */
export interface DawarichLocationVisit {
  timestamp: number;
  date?: string;
  distance_meters?: number;
  points_count?: number;
  visit_details?: {
    start_time?: string;
    end_time?: string;
    duration_minutes?: number;
    city?: string | null;
    country?: string | null;
  } | null;
}

export interface DawarichProbe {
  /** From `X-Dawarich-Version`, null on an instance too old to send it. */
  version: string | null;
}

/**
 * `https://host/extra` → `https://host/extra/api/v1`, tolerating what people
 * actually paste: a trailing slash, a trailing `/api`, or the full `/api/v1`.
 * Without this, half the support load is `/api/api/v1` 404s.
 */
function apiBase(baseUrl: string): string {
  const origin = baseUrl
    .trim()
    .replace(/(?<!\/)\/+$/, '')
    .replace(/\/api\/v1$/i, '')
    .replace(/\/api$/i, '');
  return `${origin}/api/v1`;
}

/** ISO-8601 in UTC. `Time.zone.parse` on the Dawarich side reads this unambiguously. */
export function isoUtc(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Unix seconds as a bare digit string.
 *
 * The points and visited-cities endpoints run their input through
 * `safe_timestamp`, which falls back to **the current time** for anything it
 * cannot parse — silently. A digit string takes the one branch that cannot
 * misread, so a formatting slip becomes an empty result instead of a plausible
 * wrong one.
 */
export function unixSeconds(value: Date): string {
  return String(Math.floor(value.getTime() / 1000));
}

function classify(status: number): DawarichErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  return 'server_error';
}

@Injectable()
export class DawarichClient {
  /**
   * One authenticated GET, size-capped and parsed.
   *
   * Returns the headers alongside the body because two things TREK needs are
   * only in them: the version banner and the page count.
   */
  private async get<T>(
    creds: DawarichCreds,
    path: string,
    query: Record<string, string | undefined>,
  ): Promise<{ data: T; headers: Headers }> {
    const url = new URL(apiBase(creds.baseUrl) + path);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await safeFetch(
        url.toString(),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${creds.apiKey}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(TIMEOUT_MS) as AbortSignal,
        },
        { rejectUnauthorized: !creds.allowInsecureTls },
      );
    } catch (err: unknown) {
      throw new DawarichError(
        'unreachable',
        'Could not reach Dawarich',
        undefined,
        err instanceof Error ? err.message : undefined,
      );
    }

    if (!response.ok) {
      throw new DawarichError(
        classify(response.status),
        `Dawarich answered HTTP ${response.status}`,
        response.status,
      );
    }

    // Read through the cap rather than calling .json(): Dawarich answers chunked
    // over large ranges, so there is no content-length to check first, and an
    // auth proxy in front of it answers with an HTML login page that would
    // otherwise surface as "Unexpected token '<'".
    const data = await readCappedJson<T>(response, MAX_JSON_BYTES);
    if (data === undefined) {
      throw new DawarichError(
        'invalid_response',
        'Dawarich returned something that is not JSON. Check the URL points at Dawarich itself and that it is reachable without a separate login.',
      );
    }
    return { data, headers: response.headers };
  }

  /**
   * Authenticate and read the version banner.
   *
   * `/users/me` rather than `/health`, because health skips authentication
   * upstream: a wrong key would pass it, and "connected" would mean nothing.
   */
  async probe(creds: DawarichCreds): Promise<DawarichProbe> {
    const { headers } = await this.get<unknown>(creds, '/users/me', {});
    return { version: headers.get('x-dawarich-version') };
  }

  /**
   * Visits whose stay STARTED inside the window.
   *
   * Paginated explicitly even though the endpoint returns everything without a
   * `page` parameter: a multi-year archive in one response is exactly the shape
   * the size cap exists to refuse, and the caller would get an error instead of
   * a long answer.
   */
  async listVisits(
    creds: DawarichCreds,
    from: Date,
    to: Date,
  ): Promise<{ visits: DawarichVisitRaw[]; truncated: boolean; version: string | null }> {
    const visits: DawarichVisitRaw[] = [];
    let version: string | null = null;
    let page = 1;
    let truncated = false;

    for (; page <= MAX_PAGES; page++) {
      const { data, headers } = await this.get<DawarichVisitRaw[]>(creds, '/visits', {
        start_at: isoUtc(from),
        end_at: isoUtc(to),
        page: String(page),
        per_page: String(VISITS_PAGE_SIZE),
      });
      version ??= headers.get('x-dawarich-version');
      if (!Array.isArray(data)) {
        throw new DawarichError('invalid_response', 'Dawarich returned a visits payload that is not a list');
      }
      visits.push(...data);
      const totalPages = Number(headers.get('x-total-pages') ?? '1');
      if (!Number.isFinite(totalPages) || page >= totalPages) break;
      if (page === MAX_PAGES) truncated = true;
    }

    return { visits, truncated, version };
  }

  /**
   * Pre-segmented recorded routes overlapping the window, as GeoJSON features.
   *
   * Unlike visits, the upstream filter is a real overlap test
   * (`end_at >= from AND start_at <= to`), so a drive that crosses the window's
   * edge is included rather than dropped.
   */
  async listTracks(
    creds: DawarichCreds,
    from: Date,
    to: Date,
  ): Promise<{ features: DawarichTrackFeature[]; truncated: boolean }> {
    const features: DawarichTrackFeature[] = [];
    let truncated = false;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data, headers } = await this.get<{ features?: DawarichTrackFeature[] }>(creds, '/tracks', {
        start_at: isoUtc(from),
        end_at: isoUtc(to),
        page: String(page),
        per_page: String(TRACKS_PAGE_SIZE),
      });
      const batch = Array.isArray(data?.features) ? data.features : [];
      features.push(...batch);
      const totalPages = Number(headers.get('x-total-pages') ?? '1');
      if (!Number.isFinite(totalPages) || page >= totalPages) break;
      if (page === MAX_PAGES) truncated = true;
    }

    return { features, truncated };
  }

  /**
   * Raw recorded points, oldest first — the fallback when an instance has not
   * generated tracks (they are produced by a background job, so a fresh import
   * has points long before it has tracks).
   */
  async listPoints(
    creds: DawarichCreds,
    from: Date,
    to: Date,
  ): Promise<{ points: DawarichSlimPoint[]; truncated: boolean }> {
    const points: DawarichSlimPoint[] = [];
    let truncated = false;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const { data, headers } = await this.get<DawarichSlimPoint[]>(creds, '/points', {
        start_at: unixSeconds(from),
        end_at: unixSeconds(to),
        order: 'asc',
        slim: 'true',
        page: String(page),
        per_page: String(POINTS_PAGE_SIZE),
      });
      if (!Array.isArray(data)) {
        throw new DawarichError('invalid_response', 'Dawarich returned a points payload that is not a list');
      }
      points.push(...data);
      const totalPages = Number(headers.get('x-total-pages') ?? '1');
      if (!Number.isFinite(totalPages) || page >= totalPages) break;
      if (page === MAX_PAGES) truncated = true;
    }

    return { points, truncated };
  }

  /**
   * Countries and cities the recordings put the user in, for the Atlas.
   *
   * Asked for a month at a time and folded back together: Dawarich computes this
   * over every point in the window, so a year in one request outlasted the
   * timeout for anyone who records densely (see VISITED_CITIES_WINDOW_DAYS).
   * The windows go one after another rather than in parallel, because each one
   * is a full computation on the user's own server.
   */
  async listVisitedCities(
    creds: DawarichCreds,
    from: Date,
    to: Date,
  ): Promise<DawarichVisitedCountry[]> {
    const answers: DawarichVisitedCountry[][] = [];
    for (const window of splitWindow(from, to, VISITED_CITIES_WINDOW_DAYS)) {
      const { data } = await this.get<{ data?: DawarichVisitedCountry[] }>(creds, '/countries/visited_cities', {
        start_at: unixSeconds(window.from),
        end_at: unixSeconds(window.to),
      });
      answers.push(Array.isArray(data?.data) ? data.data : []);
    }
    // A single window is passed through untouched, so the probe and every short
    // range see exactly what Dawarich sent.
    return answers.length === 1 ? answers[0] : mergeVisitedCountries(answers);
  }

  /**
   * "Was I ever here, and for how long?" for one coordinate.
   *
   * `radius_override` is passed explicitly: without it Dawarich picks a radius
   * from the place TYPE, and a coordinate search has no type, so it falls back
   * to 500 m — wide enough to call a drive past a landmark a visit.
   */
  async findVisitsNear(
    creds: DawarichCreds,
    lat: number,
    lng: number,
    radiusMeters: number,
    limit: number,
  ): Promise<DawarichLocationVisit[]> {
    const { data } = await this.get<{
      locations?: Array<{ visits?: DawarichLocationVisit[] }>;
    }>(creds, '/locations', {
      lat: String(lat),
      lon: String(lng),
      radius_override: String(Math.round(radiusMeters)),
      limit: String(limit),
    });
    const first = Array.isArray(data?.locations) ? data.locations[0] : undefined;
    return Array.isArray(first?.visits) ? first.visits : [];
  }
}
