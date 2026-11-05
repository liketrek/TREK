import { discardBody, exceedsDeclaredLength, readCappedJson } from '../../utils/cappedFetch';
import { ServiceIdentityPort } from '../service-identity/service-identity.interface';
import { ANSWER_MAX_BYTES, CONTRIB_ORIGIN, REQUEST_TIMEOUT_MS } from './place-contrib.constants';
import { retryAfterMs } from './place-contrib.helpers';
import { Injectable } from '@nestjs/common';
import {
  placeContribErrorSchema,
  placeContribImageAnswerSchema,
  placeContribPlaceAnswerSchema,
  placeContribWithdrawAnswerSchema,
  type PlaceContribImageAnswer,
  type PlaceContribPlaceAnswer,
  type PlaceContribPlaceBody,
  type PlaceContribWithdrawAnswer,
} from '@trek/shared';

import { createHash } from 'node:crypto';
import { z, type ZodType } from 'zod';

/** What the service answers a call without an installation key, given here without asking it. */
const NO_KEY_STATUS = 401;

/**
 * What one request came back with:
 * - `ok`: a 200 the schema describes;
 * - `refused`: a status with the service's `{ error }` code;
 * - `failed`: no answer, a server error, or an answer that is not what the
 *   service sends (worth another try later).
 */
export type ContribAnswer<T> =
  | { kind: 'ok'; body: T }
  | { kind: 'refused'; status: number; error: string; retryAfterMs: number | null }
  | { kind: 'failed'; reason: string; retryAfterMs: number | null };

/** What the index serves for a place right now, community values included: the base of a contribution. */
export interface ServedPlace {
  website: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  description: string | null;
}

/** A place lookup is a few kB; it carries more than the contribution answers do. */
const PLACE_LOOKUP_MAX_BYTES = 512 * 1024;

const optionalText = z.string().max(4000).nullable().optional();
const servedPlaceSchema = z.object({
  place: z.object({
    contact: z.object({ website: optionalText, phone: optionalText, email: optionalText }).nullable().optional(),
    hours: z.object({ osm: optionalText }).nullable().optional(),
    description: z.object({ text: optionalText }).nullable().optional(),
  }),
});

/**
 * The client of the contribution routes on the TREK Places API.
 *
 * Every request carries the installation key and goes only out with one: there
 * is no pool to fall back on for these routes, so a missing key sends nothing.
 * The key goes to the allowlisted host only (ServiceIdentityPort decides, as for
 * the search), and each answer is shown to the identity like every other, so a
 * refused key is noticed there too.
 */
@Injectable()
export class PlaceContribClient {
  constructor(private readonly identity: ServiceIdentityPort) {}

  /** Whether a request would carry the installation key right now. */
  hasKey(): boolean {
    return this.authorization() !== null;
  }

  /** A short fingerprint of the key in use, so a pause over a refused key ends once there is a new one. */
  keyFingerprint(): string | null {
    const auth = this.authorization();
    return auth ? createHash('sha256').update(auth).digest('hex').slice(0, 16) : null;
  }

  async postPlace(body: PlaceContribPlaceBody): Promise<ContribAnswer<PlaceContribPlaceAnswer>> {
    return this.send(
      '/v1/contrib/place',
      { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } },
      placeContribPlaceAnswerSchema,
    );
  }

  async postImage(key: string, cid: string, jpeg: Buffer): Promise<ContribAnswer<PlaceContribImageAnswer>> {
    return this.send(
      '/v1/contrib/image',
      {
        method: 'POST',
        body: new Uint8Array(jpeg),
        headers: { 'Content-Type': 'image/jpeg', 'X-TREK-Contrib-Key': key, 'X-TREK-Contrib-Cid': cid },
      },
      placeContribImageAnswerSchema,
    );
  }

  /** Withdraws what this installation sent: everything, or one field, key or image. */
  async withdraw(
    scope: { field?: string; key?: string; image?: string } = {},
  ): Promise<ContribAnswer<PlaceContribWithdrawAnswer>> {
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(scope)) if (value) params.set(name, value);
    const query = params.toString();
    return this.send(
      `/v1/contrib/install${query ? `?${query}` : ''}`,
      { method: 'DELETE' },
      placeContribWithdrawAnswerSchema,
    );
  }

  /**
   * What the index serves for a gers place now, null when it cannot say. Asked
   * with the key like the search, so it is counted like one.
   */
  async servedPlace(gers: string): Promise<ServedPlace | null> {
    const answer = await this.send(
      `/v1/place/${encodeURIComponent(gers)}`,
      { method: 'GET' },
      servedPlaceSchema,
      PLACE_LOOKUP_MAX_BYTES,
    );
    if (answer.kind !== 'ok') return null;
    const { contact, hours, description } = answer.body.place;
    return {
      website: contact?.website ?? null,
      phone: contact?.phone ?? null,
      email: contact?.email ?? null,
      opening_hours: hours?.osm ?? null,
      description: description?.text ?? null,
    };
  }

  private authorization(): string | null {
    return this.identity.headersFor(new URL(CONTRIB_ORIGIN)).Authorization ?? null;
  }

  private async send<T>(
    path: string,
    init: { method: string; body?: string | Uint8Array; headers?: Record<string, string> },
    schema: ZodType<T>,
    maxBytes: number = ANSWER_MAX_BYTES,
  ): Promise<ContribAnswer<T>> {
    const url = new URL(CONTRIB_ORIGIN + path);
    const own = this.identity.headersFor(url);
    if (!own.Authorization) return { kind: 'refused', status: NO_KEY_STATUS, error: 'no_key', retryAfterMs: null };
    let res: Response;
    try {
      res = await fetch(url, {
        method: init.method,
        body: init.body,
        headers: { Accept: 'application/json', ...init.headers, ...own },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      return { kind: 'failed', reason: err instanceof Error ? err.name : 'network', retryAfterMs: null };
    }
    this.identity.observe(url, res);
    return readAnswer(res, schema, maxBytes);
  }
}

async function readAnswer<T>(res: Response, schema: ZodType<T>, maxBytes: number): Promise<ContribAnswer<T>> {
  const retryAfter = retryAfterMs(res.headers.get('retry-after'));
  if (exceedsDeclaredLength(res, maxBytes)) {
    discardBody(res);
    return { kind: 'failed', reason: 'answer_too_large', retryAfterMs: retryAfter };
  }
  const body = await readCappedJson<unknown>(res, maxBytes).catch(() => undefined);
  if (res.ok) {
    const parsed = schema.safeParse(body);
    return parsed.success
      ? { kind: 'ok', body: parsed.data }
      : { kind: 'failed', reason: 'answer_unreadable', retryAfterMs: retryAfter };
  }
  if (res.status >= 500 && res.status !== 503) {
    return { kind: 'failed', reason: `status_${res.status}`, retryAfterMs: retryAfter };
  }
  const refusal = placeContribErrorSchema.safeParse(body);
  return {
    kind: 'refused',
    status: res.status,
    error: refusal.success ? refusal.data.error : `status_${res.status}`,
    retryAfterMs: retryAfter,
  };
}
