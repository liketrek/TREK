import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response } from 'express';

import { OidcController } from '../../../src/nest/oidc/oidc.controller';
import type { OidcService } from '../../../src/nest/oidc/oidc.service';

function svc(o: Partial<OidcService> = {}): OidcService {
  return {
    oidcLoginEnabled: vi.fn().mockReturnValue(true),
    getOidcConfig: vi.fn().mockReturnValue({ issuer: 'https://idp', clientId: 'c', clientSecret: 's', discoveryUrl: null }),
    getAppUrl: vi.fn().mockReturnValue('https://app'),
    discover: vi.fn().mockResolvedValue({ authorization_endpoint: 'https://idp/auth', userinfo_endpoint: 'https://idp/ui', issuer: 'https://idp' }),
    createState: vi.fn().mockReturnValue({ state: 'st', codeChallenge: 'cc' }),
    consumeState: vi.fn().mockReturnValue({ redirectUri: 'https://app/api/auth/oidc/callback', codeVerifier: 'cv', inviteToken: undefined }),
    exchangeCodeForToken: vi.fn(),
    verifyIdToken: vi.fn(),
    getUserInfo: vi.fn(),
    findOrCreateUser: vi.fn(),
    touchLastLogin: vi.fn(),
    generateToken: vi.fn().mockReturnValue('jwt'),
    createAuthCode: vi.fn().mockReturnValue('ac'),
    consumeAuthCode: vi.fn(),
    frontendUrl: vi.fn((p: string) => 'https://app' + p),
    setAuthCookie: vi.fn(),
    ...o,
  } as unknown as OidcService;
}

function makeRes() {
  const res = {
    statusCode: 200,
    redirectedTo: '' as string,
    body: undefined as unknown,
    status: vi.fn((c: number) => { res.statusCode = c; return res; }),
    json: vi.fn((b: unknown) => { res.body = b; return res; }),
    redirect: vi.fn((u: string) => { res.redirectedTo = u; }),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  return res as unknown as Response & { statusCode: number; redirectedTo: string; body: unknown };
}

const req = { query: {}, headers: {} } as Request;
// Callback request carrying the state-binding cookie a real browser would send
// after going through /login.
const reqCb = (state = 's') => ({ query: {}, headers: {}, cookies: { trek_oidc_state: state } } as unknown as Request);

beforeEach(() => vi.clearAllMocks());
afterEach(() => { delete process.env.NODE_ENV; });

describe('OidcController /login', () => {
  it('403 when SSO is disabled', async () => {
    const res = makeRes();
    await new OidcController(svc({ oidcLoginEnabled: vi.fn().mockReturnValue(false) })).login(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'SSO login is disabled.' });
  });

  it('400 when not configured', async () => {
    const res = makeRes();
    await new OidcController(svc({ getOidcConfig: vi.fn().mockReturnValue(null) })).login(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'OIDC not configured' });
  });

  it('redirects to the provider authorize endpoint with PKCE params', async () => {
    const res = makeRes();
    await new OidcController(svc()).login(req, res);
    expect(res.redirect).toHaveBeenCalled();
    expect(res.redirectedTo).toContain('https://idp/auth?');
    expect(res.redirectedTo).toContain('code_challenge=cc');
    expect(res.redirectedTo).toContain('code_challenge_method=S256');
  });
});

describe('OidcController /callback', () => {
  it('redirects with sso_disabled when SSO is off', async () => {
    const res = makeRes();
    await new OidcController(svc({ oidcLoginEnabled: vi.fn().mockReturnValue(false) })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=sso_disabled');
  });

  it('redirects with the provider error', async () => {
    const res = makeRes();
    await new OidcController(svc()).callback(undefined, undefined, 'access_denied', reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=access_denied');
  });

  it('redirects missing_params / invalid_state', async () => {
    const r1 = makeRes();
    await new OidcController(svc()).callback(undefined, 's', undefined, reqCb('s'), r1);
    expect(r1.redirectedTo).toBe('https://app/login?oidc_error=missing_params');
    const r2 = makeRes();
    await new OidcController(svc({ consumeState: vi.fn().mockReturnValue(null) })).callback('c', 's', undefined, reqCb('s'), r2);
    expect(r2.redirectedTo).toBe('https://app/login?oidc_error=invalid_state');
  });

  it('rejects a missing id_token, then completes with an auth code on success', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const noId = makeRes();
    await new OidcController(svc({ exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at' }) })).callback('c', 's', undefined, reqCb('s'), noId);
    expect(noId.redirectedTo).toBe('https://app/login?oidc_error=no_id_token');

    const ok = makeRes();
    const c = new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: true, claims: { sub: 'u1' } }),
      getUserInfo: vi.fn().mockResolvedValue({ email: 'a@b.c', sub: 'u1' }),
      findOrCreateUser: vi.fn().mockReturnValue({ user: { id: 1 } }),
    }));
    await c.callback('c', 's', undefined, reqCb('s'), ok);
    expect(ok.redirectedTo).toBe('https://app/login?oidc_code=ac');
  });

  it('rejects a callback whose state cookie does not match the query state', async () => {
    const res = makeRes();
    // Browser presents a different (or no) state cookie than the callback URL —
    // an attacker-initiated flow replayed in the victim's browser.
    await new OidcController(svc()).callback('c', 's', undefined, reqCb('attacker-state'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=invalid_state');
  });

  it('rejects a userinfo subject mismatch', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    const c = new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: true, claims: { sub: 'u1' } }),
      getUserInfo: vi.fn().mockResolvedValue({ email: 'a@b.c', sub: 'OTHER' }),
    }));
    await c.callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=subject_mismatch');
  });
});

describe('OidcController /exchange', () => {
  it('400 without a code, 400 on an invalid code, else sets the cookie + returns the token', () => {
    const r1 = makeRes();
    new OidcController(svc()).exchange(undefined, req, r1);
    expect(r1.statusCode).toBe(400);
    expect(r1.body).toEqual({ error: 'Code required' });

    const r2 = makeRes();
    new OidcController(svc({ consumeAuthCode: vi.fn().mockReturnValue({ error: 'invalid_code' }) })).exchange('x', req, r2);
    expect(r2.statusCode).toBe(400);
    expect(r2.body).toEqual({ error: 'invalid_code' });

    const r3 = makeRes();
    const setAuthCookie = vi.fn();
    new OidcController(svc({ consumeAuthCode: vi.fn().mockReturnValue({ token: 'jwt' }), setAuthCookie })).exchange('x', req, r3);
    expect(setAuthCookie).toHaveBeenCalledWith(r3, 'jwt', req);
    expect(r3.body).toEqual({ token: 'jwt' });
  });
});
