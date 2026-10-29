import { safeFetch } from '../../utils/ssrfGuard';
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

interface IssuerAnswer<T> {
  body: T;
  /** The issuer's clock from its Date header. */
  serverMs: number | null;
}

interface RegistrationRequest {
  c: string;
  nonce: string;
  v: string;
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

/** The four calls TREK makes to the key issuer at places.liketrek.com. */
@Injectable()
export class IssuerClient {
  challenge(): Promise<IssuerAnswer<ServiceChallenge>> {
    return this.call('GET', '/v1/register/challenge', serviceChallengeSchema);
  }

  register(request: RegistrationRequest): Promise<IssuerAnswer<ServiceKeyGrant>> {
    return this.call('POST', '/v1/register', serviceKeyGrantSchema, { body: request });
  }

  renew(key: string): Promise<IssuerAnswer<ServiceKeyGrant>> {
    return this.call('POST', '/v1/register/renew', serviceKeyGrantSchema, { bearer: key });
  }

  /** Today's allowance of the key, or of the shared legacy pool without one. Costs no allowance itself. */
  quota(key: string | null): Promise<IssuerAnswer<ServiceQuota>> {
    return this.call('GET', '/v1/quota', serviceQuotaSchema, { bearer: key });
  }

  private async call<T>(
    method: 'GET' | 'POST',
    path: string,
    schema: z.ZodType<T>,
    opts: { body?: RegistrationRequest; bearer?: string | null } = {},
  ): Promise<IssuerAnswer<T>> {
    const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': serviceUserAgent() };
    if (opts.bearer) headers.Authorization = `Bearer ${opts.bearer}`;
    if (opts.body) headers['Content-Type'] = 'application/json';
    const res = await safeFetch(
      `${SERVICE_ISSUER_ORIGIN}${path}`,
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
