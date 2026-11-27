/**
 * OidcBackchannelController over a stub service: the parity of section 2.8
 * (status, Cache-Control, body) for success and each kind of refusal, the form
 * field it reads, the rate limit, and the route metadata (public, POST, 200).
 */
import { IS_PUBLIC } from '../../../src/nest/auth-core/public.decorator';
import { DomainError } from '../../../src/nest/common/domain-error';
import type { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { RESPONSE_CONTRACT_KEY } from '../../../src/nest/common/response-contract';
import { PUBLIC_ROUTE_ALLOW_LIST } from '../../../src/nest/common/validate-route-guards';
import {
  BACKCHANNEL_LOGOUT_RATE_LIMIT,
  OidcBackchannelController,
} from '../../../src/nest/oidc/oidc-backchannel.controller';
import type { OidcBackchannelService } from '../../../src/nest/oidc/oidc-backchannel.service';
import { RequestMethod } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { oidcBackchannelLogoutErrorSchema, oidcBackchannelLogoutResponseSchema } from '@trek/shared';

import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const logout = vi.fn();
const check = vi.fn();
const release = vi.fn();
const service = { logout } as unknown as OidcBackchannelService;
const rl = { check, release } as unknown as RateLimitService;
const controller = () => new OidcBackchannelController(service, rl);

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    headers,
    set: vi.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value;
      return res;
    }),
  };
  return res as unknown as Response & { headers: Record<string, string> };
}

const req = (body: unknown, ip = '198.51.100.7') => ({ body, ip, socket: {} }) as unknown as Request;

/** What the global filter makes of a thrown refusal: its status and body. */
async function refused(call: Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  const err = await call.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(DomainError);
  return { status: (err as DomainError).getStatus(), body: (err as DomainError).toBody() };
}

beforeEach(() => {
  vi.clearAllMocks();
  check.mockResolvedValue(true);
  release.mockResolvedValue(undefined);
  logout.mockResolvedValue(undefined);
});

describe('OidcBackchannelController POST /api/auth/oidc/backchannel-logout', () => {
  it('BCL-CTL-001: a valid token answers 200 {} with Cache-Control no-store and is handed to the service with the caller ip', async () => {
    const res = makeRes();
    const body = await controller().logout(req({ logout_token: 'a.b.c' }), res);
    expect(body).toEqual({});
    expect(oidcBackchannelLogoutResponseSchema.safeParse(body).success).toBe(true);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['pragma']).toBe('no-cache');
    expect(logout).toHaveBeenCalledWith('a.b.c', '198.51.100.7');
  });

  it('BCL-CTL-002: a missing logout_token is the 400 invalid_request of section 2.8, with no-store', async () => {
    const res = makeRes();
    const result = await refused(controller().logout(req({}), res));
    expect(result).toEqual({
      status: 400,
      body: { error: 'invalid_request', error_description: 'The logout_token parameter is missing or malformed.' },
    });
    expect(oidcBackchannelLogoutErrorSchema.safeParse(result.body).success).toBe(true);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(logout).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'a repeated form field (an array)', body: { logout_token: ['a', 'b'] } },
    { label: 'an empty one', body: { logout_token: '' } },
    { label: 'no body at all', body: undefined },
  ])('BCL-CTL-003: $label is refused the same way', async ({ body }) => {
    expect((await refused(controller().logout(req(body), makeRes()))).status).toBe(400);
    expect(logout).not.toHaveBeenCalled();
  });

  it('BCL-CTL-004: a token the service refuses keeps its 400 body, and the header is already set', async () => {
    logout.mockRejectedValue(
      new DomainError(400, 'invalid_request', {
        code: 'stale_iat',
        details: { error_description: 'The logout token is missing or invalid.' },
      }),
    );
    const res = makeRes();
    expect(await refused(controller().logout(req({ logout_token: 'a.b.c' }), res))).toEqual({
      status: 400,
      body: { error: 'invalid_request', error_description: 'The logout token is missing or invalid.' },
    });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('BCL-CTL-005: past the flood limit the answer is 429, before the body is read', async () => {
    check.mockResolvedValue(false);
    const res = makeRes();
    expect(await refused(controller().logout(req({ logout_token: 'a.b.c' }), res))).toEqual({
      status: 429,
      body: { error: 'too_many_requests', error_description: 'Too many requests. Please try again later.' },
    });
    expect(check).toHaveBeenCalledWith(
      'oidc_backchannel',
      '198.51.100.7',
      BACKCHANNEL_LOGOUT_RATE_LIMIT,
      60_000,
      expect.any(Number),
    );
    expect(release).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('BCL-CTL-007: every request is counted at the door, and a valid logout gives its attempt back', async () => {
    const n = BACKCHANNEL_LOGOUT_RATE_LIMIT + 5;
    await Promise.all(Array.from({ length: n }, () => controller().logout(req({ logout_token: 'a.b.c' }), makeRes())));
    expect(check).toHaveBeenCalledTimes(n);
    expect(release).toHaveBeenCalledTimes(n);
    expect(release).toHaveBeenLastCalledWith('oidc_backchannel', '198.51.100.7', 60_000, expect.any(Number));

    check.mockClear();
    release.mockClear();
    expect((await refused(controller().logout(req({}), makeRes()))).status).toBe(400);
    logout.mockRejectedValue(new DomainError(400, 'invalid_request'));
    expect((await refused(controller().logout(req({ logout_token: 'x.y.z' }), makeRes()))).status).toBe(400);
    expect(check).toHaveBeenCalledTimes(2);
    expect(release).not.toHaveBeenCalled();
  });

  it('BCL-CTL-008: a failure that is not a refused token is passed on without counting', async () => {
    logout.mockRejectedValue(new Error('database down'));
    await expect(controller().logout(req({ logout_token: 'a.b.c' }), makeRes())).rejects.toThrow('database down');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('BCL-CTL-006: the route is a public POST that answers 200 under the OIDC prefix', () => {
    const handler = OidcBackchannelController.prototype.logout;
    expect(Reflect.getMetadata(PATH_METADATA, OidcBackchannelController)).toBe('api/auth/oidc');
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('backchannel-logout');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(200);
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, handler)).toBe(oidcBackchannelLogoutResponseSchema);
    expect(PUBLIC_ROUTE_ALLOW_LIST).toContain('OidcBackchannelController.logout');
    expect(Reflect.getMetadata(IS_PUBLIC, OidcBackchannelController)).toEqual({ reason: expect.any(String) });
  });
});
