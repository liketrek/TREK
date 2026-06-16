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

  it('400 when a non-HTTPS issuer is used in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    await new OidcController(svc({ getOidcConfig: vi.fn().mockReturnValue({ issuer: 'http://idp', clientId: 'c', clientSecret: 's', discoveryUrl: null }) })).login(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'OIDC issuer must use HTTPS in production' });
  });

  it('allows a non-HTTPS issuer outside production', async () => {
    process.env.NODE_ENV = 'development';
    const res = makeRes();
    await new OidcController(svc({ getOidcConfig: vi.fn().mockReturnValue({ issuer: 'http://idp', clientId: 'c', clientSecret: 's', discoveryUrl: null }) })).login(req, res);
    expect(res.redirect).toHaveBeenCalled();
  });

  it('500 when APP_URL is not configured', async () => {
    const res = makeRes();
    await new OidcController(svc({ getAppUrl: vi.fn().mockReturnValue('') })).login(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'APP_URL is not configured. OIDC cannot be used.' });
  });

  it('passes the invite token from the query into createState', async () => {
    const res = makeRes();
    const createState = vi.fn().mockReturnValue({ state: 'st', codeChallenge: 'cc' });
    const reqInvite = { query: { invite: 'tok123' }, headers: {} } as unknown as Request;
    await new OidcController(svc({ createState })).login(reqInvite, res);
    expect(createState).toHaveBeenCalledWith('https://app/api/auth/oidc/callback', 'tok123');
  });

  it('trims a trailing slash off APP_URL when building the redirect uri', async () => {
    const res = makeRes();
    const createState = vi.fn().mockReturnValue({ state: 'st', codeChallenge: 'cc' });
    await new OidcController(svc({ getAppUrl: vi.fn().mockReturnValue('https://app///'), createState })).login(req, res);
    expect(createState).toHaveBeenCalledWith('https://app/api/auth/oidc/callback', undefined);
  });

  it('500 when discovery throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await new OidcController(svc({ discover: vi.fn().mockRejectedValue(new Error('boom')) })).login(req, res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'OIDC login failed' });
  });

  it('500 logs a non-Error rejection without crashing', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await new OidcController(svc({ discover: vi.fn().mockRejectedValue('plain string') })).login(req, res);
    expect(res.statusCode).toBe(500);
    expect(spy).toHaveBeenCalledWith('[OIDC] Login error:', 'plain string');
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

  it('redirects invalid_state when there is no bound state cookie at all', async () => {
    const res = makeRes();
    const reqNoCookie = { query: {}, headers: {}, cookies: {} } as unknown as Request;
    await new OidcController(svc()).callback('c', 's', undefined, reqNoCookie, res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=invalid_state');
  });

  it('tolerates a request with no cookies object', async () => {
    const res = makeRes();
    const reqNoCookies = { query: {}, headers: {} } as unknown as Request;
    await new OidcController(svc()).callback('c', 's', undefined, reqNoCookies, res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=invalid_state');
  });

  it('redirects not_configured when the config disappears mid-flow', async () => {
    const res = makeRes();
    await new OidcController(svc({ getOidcConfig: vi.fn().mockReturnValue(null) })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=not_configured');
  });

  it('redirects issuer_not_https when a non-HTTPS issuer is used in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = makeRes();
    await new OidcController(svc({ getOidcConfig: vi.fn().mockReturnValue({ issuer: 'http://idp', clientId: 'c', clientSecret: 's', discoveryUrl: null }) })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=issuer_not_https');
  });

  it('redirects token_failed when the token exchange is not ok', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await new OidcController(svc({ exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: false, _status: 401 }) })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=token_failed');
  });

  it('redirects token_failed when the access token is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await new OidcController(svc({ exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true }) })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=token_failed');
  });

  it('redirects id_token_invalid when verification fails with a reason', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: false, error: 'bad_signature' }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=id_token_invalid');
  });

  it('redirects id_token_invalid when verification fails without an error field', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: false }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=id_token_invalid');
  });

  it('falls back to config.issuer when the discovery doc has no issuer', async () => {
    const verifyIdToken = vi.fn().mockResolvedValue({ ok: true, claims: { sub: 'u1' } });
    const res = makeRes();
    await new OidcController(svc({
      discover: vi.fn().mockResolvedValue({ authorization_endpoint: 'https://idp/auth', userinfo_endpoint: 'https://idp/ui' }),
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken,
      getUserInfo: vi.fn().mockResolvedValue({ email: 'a@b.c', sub: 'u1' }),
      findOrCreateUser: vi.fn().mockReturnValue({ user: { id: 1 } }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    // doc.issuer absent → (doc.issuer ?? '') is '' → falls back to config.issuer
    expect(verifyIdToken).toHaveBeenCalledWith('it', expect.anything(), 'c', 'https://idp');
    expect(res.redirectedTo).toBe('https://app/login?oidc_code=ac');
  });

  it('strips trailing slashes off the discovery doc issuer before verifying', async () => {
    const verifyIdToken = vi.fn().mockResolvedValue({ ok: true, claims: { sub: 'u1' } });
    const res = makeRes();
    await new OidcController(svc({
      discover: vi.fn().mockResolvedValue({ authorization_endpoint: 'https://idp/auth', userinfo_endpoint: 'https://idp/ui', issuer: 'https://idp/' }),
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken,
      getUserInfo: vi.fn().mockResolvedValue({ email: 'a@b.c', sub: 'u1' }),
      findOrCreateUser: vi.fn().mockReturnValue({ user: { id: 1 } }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    expect(verifyIdToken).toHaveBeenCalledWith('it', expect.anything(), 'c', 'https://idp');
  });

  it('redirects no_email when the userinfo has no email', async () => {
    const res = makeRes();
    await new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: true, claims: { sub: 'u1' } }),
      getUserInfo: vi.fn().mockResolvedValue({ sub: 'u1' }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=no_email');
  });

  it('accepts when userinfo omits sub (no cross-check to run)', async () => {
    const res = makeRes();
    await new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: true, claims: { sub: 'u1' } }),
      getUserInfo: vi.fn().mockResolvedValue({ email: 'a@b.c' }),
      findOrCreateUser: vi.fn().mockReturnValue({ user: { id: 1 } }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_code=ac');
  });

  it('accepts when the id_token claims have a non-string sub (cross-check skipped)', async () => {
    const res = makeRes();
    await new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: true, claims: { sub: 12345 } }),
      getUserInfo: vi.fn().mockResolvedValue({ email: 'a@b.c', sub: 'something-else' }),
      findOrCreateUser: vi.fn().mockReturnValue({ user: { id: 1 } }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_code=ac');
  });

  it('surfaces a findOrCreateUser provisioning error', async () => {
    const res = makeRes();
    await new OidcController(svc({
      exchangeCodeForToken: vi.fn().mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' }),
      verifyIdToken: vi.fn().mockResolvedValue({ ok: true, claims: { sub: 'u1' } }),
      getUserInfo: vi.fn().mockResolvedValue({ email: 'a@b.c', sub: 'u1' }),
      findOrCreateUser: vi.fn().mockReturnValue({ error: 'registration_disabled' }),
    })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=registration_disabled');
  });

  it('redirects server_error when the flow throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await new OidcController(svc({ discover: vi.fn().mockRejectedValue(new Error('network down')) })).callback('c', 's', undefined, reqCb('s'), res);
    expect(res.redirectedTo).toBe('https://app/login?oidc_error=server_error');
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
