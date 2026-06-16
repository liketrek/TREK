import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// The Nest service is a thin pass-through to the legacy OIDC helpers plus a few
// adjacent service modules. Mock each one and assert the wrapper forwards every
// argument and returns whatever the legacy function hands back.
const { oidc } = vi.hoisted(() => ({
  oidc: {
    getOidcConfig: vi.fn(),
    discover: vi.fn(),
    createState: vi.fn(),
    consumeState: vi.fn(),
    exchangeCodeForToken: vi.fn(),
    verifyIdToken: vi.fn(),
    getUserInfo: vi.fn(),
    findOrCreateUser: vi.fn(),
    touchLastLogin: vi.fn(),
    generateToken: vi.fn(),
    createAuthCode: vi.fn(),
    consumeAuthCode: vi.fn(),
    frontendUrl: vi.fn(),
  },
}));
vi.mock('../../../src/services/oidcService', () => oidc);

const { getAppUrl } = vi.hoisted(() => ({ getAppUrl: vi.fn() }));
vi.mock('../../../src/services/notifications', () => ({ getAppUrl }));

const { resolveAuthToggles } = vi.hoisted(() => ({ resolveAuthToggles: vi.fn() }));
vi.mock('../../../src/services/authService', () => ({ resolveAuthToggles }));

const { setAuthCookie } = vi.hoisted(() => ({ setAuthCookie: vi.fn() }));
vi.mock('../../../src/services/cookie', () => ({ setAuthCookie }));

import { OidcService } from '../../../src/nest/oidc/oidc.service';

let s: OidcService;
beforeEach(() => {
  vi.clearAllMocks();
  s = new OidcService();
});

describe('OidcService', () => {
  it('oidcLoginEnabled reads the resolved auth toggle', () => {
    resolveAuthToggles.mockReturnValue({ oidc_login: true });
    expect(s.oidcLoginEnabled()).toBe(true);
    resolveAuthToggles.mockReturnValue({ oidc_login: false });
    expect(s.oidcLoginEnabled()).toBe(false);
  });

  it('getOidcConfig delegates to the legacy helper', () => {
    const cfg = { issuer: 'https://idp' };
    oidc.getOidcConfig.mockReturnValue(cfg);
    expect(s.getOidcConfig()).toBe(cfg);
  });

  it('getAppUrl delegates to notifications.getAppUrl', () => {
    getAppUrl.mockReturnValue('https://app');
    expect(s.getAppUrl()).toBe('https://app');
  });

  it('discover forwards the issuer and discovery url', () => {
    const doc = { authorization_endpoint: 'https://idp/auth' };
    oidc.discover.mockReturnValue(doc);
    expect(s.discover('https://idp', 'https://idp/.well-known')).toBe(doc);
    expect(oidc.discover).toHaveBeenCalledWith('https://idp', 'https://idp/.well-known');
  });

  it('discover works without a discovery url', () => {
    oidc.discover.mockReturnValue('doc');
    expect(s.discover('https://idp')).toBe('doc');
    expect(oidc.discover).toHaveBeenCalledWith('https://idp', undefined);
  });

  it('createState forwards the redirect uri and invite token', () => {
    const st = { state: 'st', codeChallenge: 'cc' };
    oidc.createState.mockReturnValue(st);
    expect(s.createState('https://app/cb', 'inv')).toBe(st);
    expect(oidc.createState).toHaveBeenCalledWith('https://app/cb', 'inv');
  });

  it('createState works without an invite token', () => {
    oidc.createState.mockReturnValue({ state: 'st', codeChallenge: 'cc' });
    s.createState('https://app/cb');
    expect(oidc.createState).toHaveBeenCalledWith('https://app/cb', undefined);
  });

  it('consumeState forwards the state', () => {
    oidc.consumeState.mockReturnValue({ redirectUri: 'r', codeVerifier: 'v' });
    expect(s.consumeState('st')).toEqual({ redirectUri: 'r', codeVerifier: 'v' });
    expect(oidc.consumeState).toHaveBeenCalledWith('st');
  });

  it('exchangeCodeForToken spreads all arguments through', () => {
    oidc.exchangeCodeForToken.mockReturnValue({ _ok: true });
    const doc = { token_endpoint: 'https://idp/token' } as never;
    expect(s.exchangeCodeForToken(doc, 'code', 'redir', 'cid', 'secret', 'verifier')).toEqual({ _ok: true });
    expect(oidc.exchangeCodeForToken).toHaveBeenCalledWith(doc, 'code', 'redir', 'cid', 'secret', 'verifier');
  });

  it('verifyIdToken spreads all arguments through', () => {
    oidc.verifyIdToken.mockReturnValue({ ok: true });
    const doc = { issuer: 'https://idp' } as never;
    expect(s.verifyIdToken('id_token', doc, 'cid', 'https://idp')).toEqual({ ok: true });
    expect(oidc.verifyIdToken).toHaveBeenCalledWith('id_token', doc, 'cid', 'https://idp');
  });

  it('getUserInfo forwards the endpoint and access token', () => {
    oidc.getUserInfo.mockReturnValue({ email: 'a@b.c' });
    expect(s.getUserInfo('https://idp/ui', 'at')).toEqual({ email: 'a@b.c' });
    expect(oidc.getUserInfo).toHaveBeenCalledWith('https://idp/ui', 'at');
  });

  it('findOrCreateUser spreads all arguments through', () => {
    const result = { user: { id: 1 } };
    oidc.findOrCreateUser.mockReturnValue(result);
    const info = { email: 'a@b.c' } as never;
    const cfg = { issuer: 'https://idp' } as never;
    expect(s.findOrCreateUser(info, cfg, 'inv')).toBe(result);
    expect(oidc.findOrCreateUser).toHaveBeenCalledWith(info, cfg, 'inv');
  });

  it('touchLastLogin forwards the user id', () => {
    s.touchLastLogin(42);
    expect(oidc.touchLastLogin).toHaveBeenCalledWith(42);
  });

  it('generateToken forwards the user', () => {
    oidc.generateToken.mockReturnValue('jwt');
    expect(s.generateToken({ id: 7 })).toBe('jwt');
    expect(oidc.generateToken).toHaveBeenCalledWith({ id: 7 });
  });

  it('createAuthCode forwards the token', () => {
    oidc.createAuthCode.mockReturnValue('ac');
    expect(s.createAuthCode('jwt')).toBe('ac');
    expect(oidc.createAuthCode).toHaveBeenCalledWith('jwt');
  });

  it('consumeAuthCode forwards the code', () => {
    oidc.consumeAuthCode.mockReturnValue({ token: 'jwt' });
    expect(s.consumeAuthCode('ac')).toEqual({ token: 'jwt' });
    expect(oidc.consumeAuthCode).toHaveBeenCalledWith('ac');
  });

  it('frontendUrl forwards the path', () => {
    oidc.frontendUrl.mockReturnValue('https://app/login');
    expect(s.frontendUrl('/login')).toBe('https://app/login');
    expect(oidc.frontendUrl).toHaveBeenCalledWith('/login');
  });

  it('setAuthCookie forwards res, token and req to the cookie helper', () => {
    const res = {} as Response;
    const req = {} as Request;
    s.setAuthCookie(res, 'jwt', req);
    expect(setAuthCookie).toHaveBeenCalledWith(res, 'jwt', req);
  });
});
