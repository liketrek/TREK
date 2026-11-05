import { safeFetch } from '../../utils/ssrfGuard';
import type { RegistrationRequest } from './registration-dialect.types';
import { SERVICE_ISSUER_ORIGIN } from './service-identity.constants';
import { retryAfterMs, serverDateMs } from './service-identity.helpers';
import { serviceUserAgent } from './user-agent';
import { Injectable } from '@nestjs/common';
import {
  serviceChallengeSchema,
  serviceKeyGrantSchema,
  serviceQuotaSchema,
  type ServiceChallenge,
  type ServiceKeyGrant,
  type ServiceQuota,
} from '@trek/shared';

import type { z } from 'zod';

const TIMEOUT_MS = 10_000;
/** Every answer of the issuer is a few hundred bytes. */
const MAX_BYTES = 4096;

/*
 * What a registration dialect may ask of a request. The dialect module is
 * written by the issuer, so it is held to the paths the issuer serves, to
 * headers of its own and to a small body; anything else is refused before it
 * leaves. scripts/ci/check-registration-dialect.mjs applies the same rules to
 * a new dialect in the release job.
 */
const CHALLENGE_PATH = /^\/v1\/register(\/[A-Za-z0-9_-]{12})?\/challenge$/;
const REGISTER_PATH = /^\/v1\/register(\/[A-Za-z0-9_-]{12})?$/;
const DIALECT_HEADER = /^X-TREK-[A-Za-z0-9-]{1,40}$/;
/** The headers the gate itself answers with or reads; a dialect never sends them. */
const RESERVED_HEADER = /^X-TREK-(Install|Tier|Legacy|Quota|Instance|Notice)(-|$)/i;
const HEADER_VALUE = /^[\x20-\x7e]{1,256}$/;
const MAX_REGISTRATION_BYTES = 2048;

export interface IssuerAnswer<T> {
  body: T;
  /** The issuer's clock from its Date header. */
  serverMs: number | null;
}

/** A refusal of the issuer, with how long it asked to be left alone. */
export class IssuerError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs: number | null,
    readonly serverMs: number | null,
  ) {
    super(`the TREK services issuer answered ${status}`);
    this.name = 'IssuerError';
  }
}

/** The calls TREK makes to the key issuer at places.liketrek.com, and the allowance any liketrek host reports. */
@Injectable()
export class IssuerClient {
  /** A challenge to solve, at the path of the dialect this build registers in. */
  challenge(path = '/v1/register/challenge'): Promise<IssuerAnswer<ServiceChallenge>> {
    if (!CHALLENGE_PATH.test(path)) {
      return Promise.reject(new Error('the registration dialect asks for a challenge elsewhere'));
    }
    return this.call('GET', path, serviceChallengeSchema);
  }

  register(path: string, request: RegistrationRequest): Promise<IssuerAnswer<ServiceKeyGrant>> {
    const refusal = registrationRefusal(path, request);
    if (refusal) return Promise.reject(new Error(`the registration dialect ${refusal}`));
    return this.call('POST', path, serviceKeyGrantSchema, { body: request.body, headers: request.headers });
  }

  renew(key: string): Promise<IssuerAnswer<ServiceKeyGrant>> {
    return this.call('POST', '/v1/register/renew', serviceKeyGrantSchema, { bearer: key });
  }

  /**
   * Today's allowance of the key at the host of `origin`, or of the shared
   * legacy pool without one (only Places has that pool). Costs no allowance itself.
   */
  quota(origin: string, key: string | null): Promise<IssuerAnswer<ServiceQuota>> {
    return this.call('GET', '/v1/quota', serviceQuotaSchema, { bearer: key, origin });
  }

  private async call<T>(
    method: 'GET' | 'POST',
    path: string,
    schema: z.ZodType<T>,
    opts: {
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
      bearer?: string | null;
      origin?: string;
    } = {},
  ): Promise<IssuerAnswer<T>> {
    const headers: Record<string, string> = {
      ...opts.headers,
      Accept: 'application/json',
      'User-Agent': serviceUserAgent(),
    };
    if (opts.bearer) headers.Authorization = `Bearer ${opts.bearer}`;
    if (opts.body) headers['Content-Type'] = 'application/json';
    const res = await safeFetch(
      `${opts.origin ?? SERVICE_ISSUER_ORIGIN}${path}`,
      {
        method,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
      { maxBytes: MAX_BYTES },
    );
    const serverMs = serverDateMs(res.headers);
    if (!res.ok) throw new IssuerError(res.status, retryAfterMs(res.headers), serverMs);
    return { body: schema.parse(await res.json()), serverMs };
  }
}

/** Why a dialect's registration may not go out, or null when it may. */
function registrationRefusal(path: string, request: RegistrationRequest): string | null {
  if (!REGISTER_PATH.test(path)) return 'registers elsewhere';
  if (!Object.entries(request.headers).every(isDialectHeader)) return 'sends a header TREK does not send';
  if (Buffer.byteLength(JSON.stringify(request.body), 'utf8') > MAX_REGISTRATION_BYTES) {
    return 'sends a body larger than a registration';
  }
  return null;
}

function isDialectHeader([name, value]: [string, string]): boolean {
  return DIALECT_HEADER.test(name) && !RESERVED_HEADER.test(name) && HEADER_VALUE.test(value);
}
