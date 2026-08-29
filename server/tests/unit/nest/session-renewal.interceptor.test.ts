/**
 * Unit tests for SessionRenewalInterceptor (#1927) — sliding renewal of the
 * trek_session cookie once a cookie-authenticated token is past half of its
 * lifetime. Covers the renew path (fresh token + cookie semantics per the
 * `remember` claim) and every skip condition: young token, bearer-only request,
 * unauthenticated request, purpose token, id mismatch, malformed claims,
 * headers already sent, non-http context.
 */
import type { AuthService } from '../../../src/nest/auth/auth.service';
import { SessionRenewalInterceptor } from '../../../src/nest/auth/session-renewal.interceptor';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

import jwt from 'jsonwebtoken';
import { of, lastValueFrom } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER: '30d',
  SESSION_DURATION_REMEMBER_MS: 2592000000,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  updateJwtSecret: () => {},
}));

const SECRET = 'test-jwt-secret-for-trek-testing-only';

/** Sign a session token whose lifetime is `lifetime` seconds, `consumed` of which have already passed. */
function token(payload: Record<string, unknown>, lifetime: number, consumed: number): string {
  const iat = Math.floor(Date.now() / 1000) - consumed;
  // jsonwebtoken computes exp = iat + expiresIn when iat is supplied in the payload.
  return jwt.sign({ ...payload, iat }, SECRET, { expiresIn: lifetime, algorithm: 'HS256' });
}

function makeRes(headersSent = false) {
  return { headersSent, cookie: vi.fn() };
}

type ReqShape = {
  cookies?: Record<string, string>;
  user?: { id: number };
  headers?: Record<string, string>;
  secure?: boolean;
};

function ctx(req: ReqShape, res: ReturnType<typeof makeRes>, type = 'http'): ExecutionContext {
  return {
    getType: () => type,
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
}

function handler(): CallHandler & { handle: ReturnType<typeof vi.fn> } {
  return { handle: vi.fn(() => of('ok')) };
}

function makeInterceptor() {
  const generateToken = vi.fn().mockReturnValue('renewed.jwt');
  const interceptor = new SessionRenewalInterceptor({ generateToken } as unknown as AuthService);
  return { interceptor, generateToken };
}

async function run(
  interceptor: SessionRenewalInterceptor,
  req: ReqShape,
  res: ReturnType<typeof makeRes>,
  type = 'http',
) {
  const h = handler();
  const out = await lastValueFrom(interceptor.intercept(ctx(req, res, type), h));
  expect(out).toBe('ok');
  expect(h.handle).toHaveBeenCalled();
}

describe('SessionRenewalInterceptor', () => {
  it('SES-RENEW-001: does not renew a token under half of its lifetime', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    const t = token({ id: 1, pv: 0 }, 86400, 1000); // ~1% consumed
    await run(interceptor, { cookies: { trek_session: t }, user: { id: 1 } }, res);
    expect(generateToken).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('SES-RENEW-002: renews a token past half of its lifetime, copying pv from the old token', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    const t = token({ id: 1, pv: 3 }, 86400, 60000); // ~70% consumed
    await run(interceptor, { cookies: { trek_session: t }, user: { id: 1 } }, res);
    expect(generateToken).toHaveBeenCalledWith({ id: 1, password_version: 3 }, undefined);
    expect(res.cookie).toHaveBeenCalledWith(
      'trek_session',
      'renewed.jwt',
      expect.objectContaining({ maxAge: 86400000, httpOnly: true }),
    );
  });

  it('SES-RENEW-003: a remember:true claim renews with the long persistent cookie', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    const t = token({ id: 1, pv: 0, remember: true }, 2592000, 1600000); // ~62% consumed
    await run(interceptor, { cookies: { trek_session: t }, user: { id: 1 } }, res);
    expect(generateToken).toHaveBeenCalledWith({ id: 1, password_version: 0 }, true);
    expect(res.cookie).toHaveBeenCalledWith(
      'trek_session',
      'renewed.jwt',
      expect.objectContaining({ maxAge: 2592000000 }),
    );
  });

  it('SES-RENEW-004: a remember:false claim renews as a browser-session cookie (no maxAge)', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    const t = token({ id: 1, pv: 0, remember: false }, 86400, 60000);
    await run(interceptor, { cookies: { trek_session: t }, user: { id: 1 } }, res);
    expect(generateToken).toHaveBeenCalledWith({ id: 1, password_version: 0 }, false);
    const options = res.cookie.mock.calls[0][2];
    expect(options).not.toHaveProperty('maxAge');
  });

  it('SES-RENEW-005: a claimless legacy token renews with the historical default cookie', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    const t = token({ id: 1, pv: 0 }, 86400, 60000);
    await run(interceptor, { cookies: { trek_session: t }, user: { id: 1 } }, res);
    expect(generateToken).toHaveBeenCalledWith({ id: 1, password_version: 0 }, undefined);
    expect(res.cookie).toHaveBeenCalledWith(
      'trek_session',
      'renewed.jwt',
      expect.objectContaining({ maxAge: 86400000 }),
    );
  });

  it('SES-RENEW-006: never renews a Bearer-only request (no session cookie)', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    await run(interceptor, { headers: { authorization: 'Bearer x' }, user: { id: 1 } }, res);
    expect(generateToken).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('SES-RENEW-007: never renews an unauthenticated (public-route) request', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    const t = token({ id: 1, pv: 0 }, 86400, 60000);
    await run(interceptor, { cookies: { trek_session: t } }, res);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it('SES-RENEW-008: never renews a purpose-scoped token or a cookie whose id differs from req.user', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const purposeRes = makeRes();
    const purposeToken = token({ id: 1, pv: 0, purpose: 'mfa_login' }, 86400, 60000);
    await run(interceptor, { cookies: { trek_session: purposeToken }, user: { id: 1 } }, purposeRes);

    const mismatchRes = makeRes();
    const otherUsers = token({ id: 2, pv: 0 }, 86400, 60000);
    await run(interceptor, { cookies: { trek_session: otherUsers }, user: { id: 1 } }, mismatchRes);

    expect(generateToken).not.toHaveBeenCalled();
    expect(purposeRes.cookie).not.toHaveBeenCalled();
    expect(mismatchRes.cookie).not.toHaveBeenCalled();
  });

  it('SES-RENEW-009: skips when headers were already sent or the cookie is not a JWT', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const sentRes = makeRes(true);
    const t = token({ id: 1, pv: 0 }, 86400, 60000);
    await run(interceptor, { cookies: { trek_session: t }, user: { id: 1 } }, sentRes);

    const garbageRes = makeRes();
    await run(interceptor, { cookies: { trek_session: 'not-a-jwt' }, user: { id: 1 } }, garbageRes);

    expect(generateToken).not.toHaveBeenCalled();
    expect(sentRes.cookie).not.toHaveBeenCalled();
    expect(garbageRes.cookie).not.toHaveBeenCalled();
  });

  it('SES-RENEW-010: skips tokens with missing or inverted iat/exp claims', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    // Hand-built token without exp (noTimestamp keeps iat but expiresIn omitted).
    const noExp = jwt.sign({ id: 1, pv: 0 }, SECRET, { algorithm: 'HS256' });
    await run(interceptor, { cookies: { trek_session: noExp }, user: { id: 1 } }, res);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it('SES-RENEW-011: ignores non-http execution contexts', async () => {
    const { interceptor, generateToken } = makeInterceptor();
    const res = makeRes();
    const t = token({ id: 1, pv: 0 }, 86400, 60000);
    await run(interceptor, { cookies: { trek_session: t }, user: { id: 1 } }, res, 'ws');
    expect(generateToken).not.toHaveBeenCalled();
  });
});
