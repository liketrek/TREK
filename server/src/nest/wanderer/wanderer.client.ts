import { readCappedJson } from '../../utils/cappedFetch';
import { ResponseTooLargeError, safeFetch, SsrfBlockedError } from '../../utils/ssrfGuard';
import { Injectable } from '@nestjs/common';
import { WANDERER_SEARCH_PAGE_SIZE, type WandererBbox, type WandererErrorCode } from '@trek/shared';

import { z } from 'zod';

/**
 * The only place that talks to a user's wanderer instance.
 *
 * Verified against wanderer v0.21.0, its source and a running instance rather
 * than its prose docs:
 *
 *  - **Auth** is `Authorization: Bearer wanderer_key_...` on `/api/*`. The web
 *    hook only exchanges a token that starts with `wanderer_key`; anything else
 *    is quietly served as an anonymous visitor, and a revoked token answers
 *    HTTP 500 "Failed to verify API token ... Invalid or revoked API token".
 *  - So **HTTP 200 proves nothing**. The test lists the caller's own API tokens:
 *    authenticated, that list holds at least the token being used; anonymous,
 *    it is empty.
 *  - **Search** is `POST /api/v1/search/trails` (Meilisearch through the web
 *    app, scoped to what the caller may see). Its documents carry the trail's
 *    extent (`min_lat` ... `max_lon`), which is what the map search filters on,
 *    and a simplified line as an encoded polyline (precision 5).
 *  - The **original GPX** is a PocketBase file: `GET /api/v1/files/trails/{id}/{gpx}`.
 */

const TIMEOUT_MS = 15_000;
/** A page of twenty search hits with their lines is a few dozen kilobytes. */
const MAX_JSON_BYTES = 2 * 1024 * 1024;
/** The same ceiling the GPX upload has. */
const MAX_GPX_BYTES = 10 * 1024 * 1024;

export interface WandererCreds {
  /** Instance origin, without /api. */
  baseUrl: string;
  token: string;
  allowInsecureTls: boolean;
}

/** A failed call, its reason as a code the client translates; `detail` stays in the log. */
export class WandererError extends Error {
  constructor(
    readonly code: WandererErrorCode,
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = 'WandererError';
  }
}

const tokenListSchema = z.object({
  items: z.array(z.object({ user: z.string().nullish() })),
  totalItems: z.number().optional(),
});

/** A user record with the ActivityPub actors that stand for it; the local one authors the user's trails. */
const userActorsSchema = z.object({
  expand: z
    .object({
      activitypub_actors_via_user: z.array(z.object({ id: z.string(), is_local: z.boolean().nullish() })).nullish(),
    })
    .nullish(),
});

const searchHitSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  distance: z.number().nullish(),
  duration: z.number().nullish(),
  elevation_gain: z.number().nullish(),
  elevation_loss: z.number().nullish(),
  difficulty: z.number().nullish(),
  public: z.boolean().nullish(),
  author_name: z.string().nullish(),
  domain: z.string().nullish(),
  polyline: z.string().nullish(),
});
export type WandererSearchHit = z.infer<typeof searchHitSchema>;

const searchResultSchema = z.object({
  hits: z.array(searchHitSchema),
  estimatedTotalHits: z.number().nullish(),
  totalHits: z.number().nullish(),
});

const trailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  gpx: z.string().nullish(),
  updated: z.string().nullish(),
  public: z.boolean().nullish(),
  author: z.string().nullish(),
});
export type WandererTrailRecord = z.infer<typeof trailSchema>;

/**
 * `https://host/sub` from what people paste: a trailing slash, `/api` or the
 * full `/api/v1` are all taken off, so the client can append its own.
 */
export function instanceOrigin(baseUrl: string): string {
  return baseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '')
    .replace(/\/api$/i, '');
}

const TLS_CODES = new Set([
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);

function networkFailure(err: unknown): WandererError {
  if (err instanceof SsrfBlockedError)
    return new WandererError('blocked_address', 'TREK may not reach that wanderer address', err.message);
  const cause = (err as { cause?: { code?: string } })?.cause;
  if (cause?.code && TLS_CODES.has(cause.code)) {
    return new WandererError('tls', 'The wanderer certificate could not be verified', cause.code);
  }
  if (err instanceof ResponseTooLargeError) return new WandererError('too_large', 'wanderer sent more than expected');
  return new WandererError('unreachable', 'Could not reach wanderer', err instanceof Error ? err.message : undefined);
}

async function failureOf(response: Response): Promise<WandererError> {
  const text = await response.text().catch(() => '');
  if (response.status === 401 || /api token/i.test(text)) {
    return new WandererError('unauthorized', 'wanderer did not accept the API token', `HTTP ${response.status}`);
  }
  if (response.status === 403) return new WandererError('forbidden', 'wanderer refused access', 'HTTP 403');
  if (response.status === 404) return new WandererError('not_found', 'wanderer has no such trail', 'HTTP 404');
  return new WandererError('server_error', `wanderer answered HTTP ${response.status}`, text.slice(0, 200));
}

/** PocketBase record ids are short lowercase alphanumerics; anything else never reaches a filter or a path. */
export function isTrailId(value: string): boolean {
  return /^[a-z0-9]{1,32}$/.test(value);
}

const DIFFICULTIES = ['easy', 'moderate', 'difficult'] as const;

/** wanderer indexes difficulty as 0, 1, 2. */
export function difficultyOf(value: number | null | undefined): (typeof DIFFICULTIES)[number] | null {
  return value != null && value >= 0 && value < DIFFICULTIES.length ? DIFFICULTIES[value] : null;
}

/** The Meilisearch filter for trails by these authors; the ids are checked record ids, so they quote safely. */
function authorFilter(authors: readonly string[]): string {
  return `author IN [${authors
    .filter(isTrailId)
    .map((id) => `'${id}'`)
    .join(', ')}]`;
}

/** The Meilisearch filter for trails whose extent overlaps the box; a box over the antimeridian takes either side. */
export function bboxFilter(box: WandererBbox): string {
  const lon =
    box.west > box.east
      ? `(max_lon >= ${box.west} OR min_lon <= ${box.east})`
      : `max_lon >= ${box.west} AND min_lon <= ${box.east}`;
  return `max_lat >= ${box.south} AND min_lat <= ${box.north} AND ${lon}`;
}

@Injectable()
export class WandererClient {
  private async call(
    creds: WandererCreds,
    path: string,
    init: RequestInit = {},
    maxBytes = MAX_JSON_BYTES,
  ): Promise<Response> {
    let response: Response;
    try {
      response = await safeFetch(
        `${instanceOrigin(creds.baseUrl)}${path}`,
        {
          ...init,
          headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${creds.token}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
        { rejectUnauthorized: !creds.allowInsecureTls, maxBytes },
      );
    } catch (err: unknown) {
      throw networkFailure(err);
    }
    if (!response.ok) throw await failureOf(response);
    return response;
  }

  private async json<T>(creds: WandererCreds, path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
    const response = await this.call(creds, path, {
      ...init,
      headers: { Accept: 'application/json', ...(init?.headers as Record<string, string>) },
    });
    let body: unknown;
    try {
      body = await readCappedJson<unknown>(response, MAX_JSON_BYTES);
    } catch (err: unknown) {
      // An answer that is not JSON at all (a proxy's login page, say) is not a network failure.
      if (err instanceof SyntaxError) {
        throw new WandererError(
          'invalid_response',
          'wanderer answered with something TREK does not understand',
          err.message,
        );
      }
      throw networkFailure(err);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new WandererError(
        'invalid_response',
        'wanderer answered with something TREK does not understand',
        parsed.error.message.slice(0, 200),
      );
    }
    return parsed.data;
  }

  /**
   * Proves the token is accepted, and says how many trails it can see. The
   * token list is the proof: see the class comment.
   */
  async check(creds: WandererCreds): Promise<{ trailCount: number | null }> {
    const authors = await this.ownActors(creds);
    const count = await this.json(creds, '/api/v1/search/trails', searchResultSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: '', options: { limit: 0, filter: [authorFilter(authors)] } }),
    }).catch(() => null);
    return { trailCount: count?.estimatedTotalHits ?? count?.totalHits ?? null };
  }

  /**
   * The actors that author the token owner's trails. Only those trails are
   * offered: the index also lists other people's public trails, and copying
   * someone else's trail into a trip is not what a personal connection is for.
   * The token list names its owner (an anonymous call lists none, see the
   * class comment), and the owner's user record names its actors.
   */
  async ownActors(creds: WandererCreds): Promise<string[]> {
    const tokens = await this.json(creds, '/api/v1/api-token?perPage=1', tokenListSchema);
    const userId = tokens.items[0]?.user;
    if (!userId) throw new WandererError('unauthorized', 'wanderer did not accept the API token', 'anonymous');
    if (!isTrailId(userId)) throw new WandererError('invalid_response', 'wanderer named its user oddly');
    const user = await this.json(
      creds,
      `/api/v1/user/${encodeURIComponent(userId)}?expand=activitypub_actors_via_user`,
      userActorsSchema,
    );
    const actors = (user.expand?.activitypub_actors_via_user ?? [])
      .filter((actor) => actor.is_local !== false && isTrailId(actor.id))
      .map((actor) => actor.id);
    if (actors.length === 0) throw new WandererError('invalid_response', 'wanderer named no author for the token');
    return actors;
  }

  async search(
    creds: WandererCreds,
    query: { q: string; page: number; bbox?: WandererBbox },
    authors: readonly string[],
  ): Promise<{ hits: WandererSearchHit[]; total: number }> {
    const result = await this.json(creds, '/api/v1/search/trails', searchResultSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query.q,
        options: {
          limit: WANDERER_SEARCH_PAGE_SIZE,
          offset: (query.page - 1) * WANDERER_SEARCH_PAGE_SIZE,
          filter: [authorFilter(authors), ...(query.bbox ? [bboxFilter(query.bbox)] : [])],
          attributesToRetrieve: Object.keys(searchHitSchema.shape),
        },
      }),
    });
    return { hits: result.hits, total: result.estimatedTotalHits ?? result.totalHits ?? result.hits.length };
  }

  /** One of the owner's trails as the search shows it, or null when it is not theirs or the token cannot see it. */
  async searchById(creds: WandererCreds, id: string, authors: readonly string[]): Promise<WandererSearchHit | null> {
    if (!isTrailId(id)) return null;
    const result = await this.json(creds, '/api/v1/search/trails', searchResultSchema, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: '',
        options: {
          limit: 1,
          filter: [`id = '${id}'`, authorFilter(authors)],
          attributesToRetrieve: Object.keys(searchHitSchema.shape),
        },
      }),
    });
    return result.hits[0] ?? null;
  }

  async trail(creds: WandererCreds, id: string): Promise<WandererTrailRecord> {
    if (!isTrailId(id)) throw new WandererError('not_found', 'wanderer has no such trail');
    return await this.json(creds, `/api/v1/trail/${encodeURIComponent(id)}`, trailSchema);
  }

  /** The trail's original GPX file, as text. */
  async gpx(creds: WandererCreds, trail: WandererTrailRecord): Promise<string> {
    if (!trail.gpx) throw new WandererError('not_found', 'The trail has no GPX file');
    const response = await this.call(
      creds,
      `/api/v1/files/trails/${encodeURIComponent(trail.id)}/${encodeURIComponent(trail.gpx)}`,
      {},
      MAX_GPX_BYTES,
    );
    try {
      return await response.text();
    } catch (err: unknown) {
      throw networkFailure(err);
    }
  }
}
