import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';

vi.mock('../../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4'), logWarn: vi.fn() }));

import { getClientIp } from '../../../src/services/auditLog';
const getClientIpMock = vi.mocked(getClientIp);

import { OauthPublicController } from '../../../src/nest/oauth/oauth-public.controller';
import { OauthApiController } from '../../../src/nest/oauth/oauth-api.controller';
import { RateLimitService } from '../../../src/nest/auth/rate-limit.service';
import type { OauthService } from '../../../src/nest/oauth/oauth.service';
import type { User } from '../../../src/types';

function osvc(o: Partial<OauthService> = {}): OauthService {
  return { mcpEnabled: vi.fn().mockReturnValue(true), mcpSafeUrl: vi.fn().mockReturnValue('https://app'), ...o } as unknown as OauthService;
}
function rl(): RateLimitService { return new RateLimitService(); }
function makeRes() {
  const res = {
    statusCode: 200, headers: {} as Record<string, string>, body: undefined as unknown, ended: false,
    status: vi.fn((c: number) => { res.statusCode = c; return res; }),
    json: vi.fn((b: unknown) => { res.body = b; return res; }),
    set: vi.fn((k: string, v: string) => { res.headers[k] = v; return res; }),
    end: vi.fn(() => { res.ended = true; return res; }),
  };
  return res as unknown as Response & { statusCode: number; headers: Record<string, string>; body: unknown; ended: boolean };
}
function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

const user = { id: 1, email: 'u@example.test' } as User;
beforeEach(() => vi.clearAllMocks());

describe('OauthPublicController /token', () => {
  function reqWith(body: Record<string, string>): Request { return { ip: '7.7.7.7', body } as Request; }

  it('404 (empty) when MCP is disabled', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ mcpEnabled: vi.fn().mockReturnValue(false) }), rl()).token(reqWith({}), res);
    expect(res.statusCode).toBe(404);
    expect(res.ended).toBe(true);
  });

  it('sets no-store headers + 401 without client_id', () => {
    const res = makeRes();
    new OauthPublicController(osvc(), rl()).token(reqWith({}), res);
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_client', error_description: 'client_id is required' });
  });

  it('authorization_code: invalid_grant on a bad code, success issues tokens', () => {
    const bad = makeRes();
    new OauthPublicController(osvc({ consumeAuthCode: vi.fn().mockReturnValue(null) }), rl()).token(reqWith({ grant_type: 'authorization_code', client_id: 'c', code: 'x', redirect_uri: 'u', code_verifier: 'v' }), bad);
    expect(bad.statusCode).toBe(400);
    expect(bad.body).toEqual({ error: 'invalid_grant', error_description: 'Authorization grant is invalid.' });

    const ok = makeRes();
    const svc = osvc({
      consumeAuthCode: vi.fn().mockReturnValue({ clientId: 'c', redirectUri: 'u', userId: 1, scopes: ['s'], codeChallenge: 'cc', resource: null }),
      authenticateClient: vi.fn().mockReturnValue({ id: 'c' }),
      verifyPKCE: vi.fn().mockReturnValue(true),
      issueTokens: vi.fn().mockReturnValue({ access_token: 'at', token_type: 'Bearer' }),
    });
    new OauthPublicController(svc, rl()).token(reqWith({ grant_type: 'authorization_code', client_id: 'c', code: 'x', redirect_uri: 'u', code_verifier: 'v' }), ok);
    expect(ok.body).toEqual({ access_token: 'at', token_type: 'Bearer' });
  });

  it('authorization_code: maps client_id / redirect_uri / resource mismatches + pkce + client auth', () => {
    const base = { grant_type: 'authorization_code', client_id: 'c', code: 'x', redirect_uri: 'u', code_verifier: 'v' };
    const mk = (pending: Record<string, unknown>, extra: Partial<OauthService> = {}, body = base) => {
      const res = makeRes();
      new OauthPublicController(osvc({ consumeAuthCode: vi.fn().mockReturnValue(pending), authenticateClient: vi.fn().mockReturnValue({ id: 'c' }), verifyPKCE: vi.fn().mockReturnValue(true), ...extra }), rl()).token(reqWith(body), res);
      return res;
    };
    expect(mk({ clientId: 'OTHER', redirectUri: 'u', userId: 1 }).statusCode).toBe(400); // client_id mismatch
    expect(mk({ clientId: 'c', redirectUri: 'OTHER', userId: 1 }).statusCode).toBe(400); // redirect_uri mismatch
    expect(mk({ clientId: 'c', redirectUri: 'u', userId: 1, resource: 'https://a' }, {}, { ...base, resource: 'https://b' }).statusCode).toBe(400); // resource mismatch
    expect(mk({ clientId: 'c', redirectUri: 'u', userId: 1 }, { authenticateClient: vi.fn().mockReturnValue(null) }).statusCode).toBe(401); // bad client secret
    expect(mk({ clientId: 'c', redirectUri: 'u', userId: 1, codeChallenge: 'cc' }, { verifyPKCE: vi.fn().mockReturnValue(false) }).statusCode).toBe(400); // pkce fail
  });

  it('authorization_code: 400 when code/redirect/verifier missing', () => {
    const res = makeRes();
    new OauthPublicController(osvc(), rl()).token(reqWith({ grant_type: 'authorization_code', client_id: 'c' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_request', error_description: 'code, redirect_uri, and code_verifier are required' });
  });

  it('refresh_token: 400 without a refresh_token, maps a service error, success', () => {
    const miss = makeRes();
    new OauthPublicController(osvc(), rl()).token(reqWith({ grant_type: 'refresh_token', client_id: 'c' }), miss);
    expect(miss.statusCode).toBe(400);
    const err = makeRes();
    new OauthPublicController(osvc({ refreshTokens: vi.fn().mockReturnValue({ error: 'invalid_grant', status: 400 }) }), rl()).token(reqWith({ grant_type: 'refresh_token', client_id: 'c', refresh_token: 'rt' }), err);
    expect(err.body).toEqual({ error: 'invalid_grant', error_description: 'Refresh token is invalid or expired' });
    const ok = makeRes();
    new OauthPublicController(osvc({ refreshTokens: vi.fn().mockReturnValue({ tokens: { access_token: 'new' } }) }), rl()).token(reqWith({ grant_type: 'refresh_token', client_id: 'c', refresh_token: 'rt' }), ok);
    expect(ok.body).toEqual({ access_token: 'new' });
  });

  it('client_credentials: 401 without secret, invalid_scope for a disallowed scope', () => {
    const noSecret = makeRes();
    new OauthPublicController(osvc(), rl()).token(reqWith({ grant_type: 'client_credentials', client_id: 'c' }), noSecret);
    expect(noSecret.statusCode).toBe(401);
    const badScope = makeRes();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue({ is_public: false, user_id: 1, allows_client_credentials: true, allowed_scopes: '["a"]' }) }), rl()).token(reqWith({ grant_type: 'client_credentials', client_id: 'c', client_secret: 's', scope: 'a zzz' }), badScope);
    expect(badScope.statusCode).toBe(400);
    expect(badScope.body).toEqual({ error: 'invalid_scope', error_description: 'Scopes not allowed for this client: zzz' });
  });

  it('client_credentials: unauthorized_client for a public client, else issues a token', () => {
    const pub = makeRes();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue({ is_public: true, user_id: null, allows_client_credentials: false, allowed_scopes: '[]' }) }), rl()).token(reqWith({ grant_type: 'client_credentials', client_id: 'c', client_secret: 's' }), pub);
    expect(pub.statusCode).toBe(400);
    expect(pub.body).toEqual({ error: 'unauthorized_client', error_description: 'This client is not authorized for the client_credentials grant' });

    const ok = makeRes();
    new OauthPublicController(osvc({
      authenticateClient: vi.fn().mockReturnValue({ is_public: false, user_id: 1, allows_client_credentials: true, allowed_scopes: '["a","b"]' }),
      issueClientCredentialsToken: vi.fn().mockReturnValue({ access_token: 'cc_at' }),
    }), rl()).token(reqWith({ grant_type: 'client_credentials', client_id: 'c', client_secret: 's' }), ok);
    expect(ok.body).toEqual({ access_token: 'cc_at' });
  });

  it('unsupported grant -> 400', () => {
    const res = makeRes();
    new OauthPublicController(osvc(), rl()).token(reqWith({ grant_type: 'password', client_id: 'c' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'unsupported_grant_type', error_description: 'Unsupported grant_type: password' });
  });

  it('429 when the token bucket is exhausted (per ip|client)', () => {
    const s = rl();
    for (let i = 0; i < 30; i++) s.check('oauth_token', '7.7.7.7|c', 30, 60000, Date.now());
    const res = makeRes();
    new OauthPublicController(osvc(), s).token(reqWith({ client_id: 'c' }), res);
    expect(res.statusCode).toBe(429);
  });

  it('falls back to {} when the body is not an object', () => {
    const res = makeRes();
    new OauthPublicController(osvc(), rl()).token({ ip: '7.7.7.7', body: 'not-an-object' } as unknown as Request, res);
    // no client_id in the {} fallback -> 401
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_client', error_description: 'client_id is required' });
  });

  it('authorization_code: invalid client secret writes an audit + 401', () => {
    const res = makeRes();
    new OauthPublicController(osvc({
      consumeAuthCode: vi.fn().mockReturnValue({ clientId: 'c', redirectUri: 'u', userId: 1, scopes: ['s'], codeChallenge: 'cc', resource: null }),
      authenticateClient: vi.fn().mockReturnValue(null),
    }), rl()).token(reqWith({ grant_type: 'authorization_code', client_id: 'c', code: 'x', redirect_uri: 'u', code_verifier: 'v' }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_client', error_description: 'Invalid client credentials' });
  });

  it('refresh_token: invalid_client maps to its specific 401 message', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ refreshTokens: vi.fn().mockReturnValue({ error: 'invalid_client', status: 401 }) }), rl())
      .token(reqWith({ grant_type: 'refresh_token', client_id: 'c', refresh_token: 'rt' }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_client', error_description: 'Invalid client credentials' });
  });

  it('refresh_token: defaults the status to 400 when the service omits it', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ refreshTokens: vi.fn().mockReturnValue({ error: 'invalid_grant' }) }), rl())
      .token(reqWith({ grant_type: 'refresh_token', client_id: 'c', refresh_token: 'rt' }), res);
    expect(res.statusCode).toBe(400);
  });

  it('client_credentials: 401 when the client cannot be authenticated', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue(null) }), rl())
      .token(reqWith({ grant_type: 'client_credentials', client_id: 'c', client_secret: 's' }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_client', error_description: 'Invalid client credentials' });
  });

  it('client_credentials: honours a valid requested scope subset', () => {
    const res = makeRes();
    const issueClientCredentialsToken = vi.fn().mockReturnValue({ access_token: 'cc_at' });
    new OauthPublicController(osvc({
      authenticateClient: vi.fn().mockReturnValue({ is_public: false, user_id: 1, allows_client_credentials: true, allowed_scopes: '["a","b"]' }),
      issueClientCredentialsToken,
    }), rl()).token(reqWith({ grant_type: 'client_credentials', client_id: 'c', client_secret: 's', scope: 'a' }), res);
    expect(res.body).toEqual({ access_token: 'cc_at' });
    expect(issueClientCredentialsToken).toHaveBeenCalledWith('c', 1, ['a'], expect.any(String));
  });

  it('client_credentials: derives the audience from an explicit resource', () => {
    const res = makeRes();
    const issueClientCredentialsToken = vi.fn().mockReturnValue({ access_token: 'cc_at' });
    new OauthPublicController(osvc({
      authenticateClient: vi.fn().mockReturnValue({ is_public: false, user_id: 1, allows_client_credentials: true, allowed_scopes: '["a"]' }),
      issueClientCredentialsToken,
    }), rl()).token(reqWith({ grant_type: 'client_credentials', client_id: 'c', client_secret: 's', resource: 'https://aud/' }), res);
    // trailing slashes are trimmed, not the mcpSafeUrl fallback
    expect(issueClientCredentialsToken).toHaveBeenCalledWith('c', 1, ['a'], 'https://aud');
  });

  it('logs a dash for a missing ip on the authorization_code client-auth failure', () => {
    getClientIpMock.mockReturnValueOnce(undefined);
    const res = makeRes();
    new OauthPublicController(osvc({
      consumeAuthCode: vi.fn().mockReturnValue({ clientId: 'c', redirectUri: 'u', userId: 1, scopes: ['s'], codeChallenge: 'cc', resource: null }),
      authenticateClient: vi.fn().mockReturnValue(null),
    }), rl()).token(reqWith({ grant_type: 'authorization_code', client_id: 'c', code: 'x', redirect_uri: 'u', code_verifier: 'v' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('logs a dash for a missing ip on the refresh invalid_client failure', () => {
    getClientIpMock.mockReturnValueOnce(undefined);
    const res = makeRes();
    new OauthPublicController(osvc({ refreshTokens: vi.fn().mockReturnValue({ error: 'invalid_client', status: 401 }) }), rl())
      .token(reqWith({ grant_type: 'refresh_token', client_id: 'c', refresh_token: 'rt' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('logs a dash for a missing ip on the client_credentials auth failure', () => {
    getClientIpMock.mockReturnValueOnce(undefined);
    const res = makeRes();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue(null) }), rl())
      .token(reqWith({ grant_type: 'client_credentials', client_id: 'c', client_secret: 's' }), res);
    expect(res.statusCode).toBe(401);
  });
});

describe('OauthPublicController /userinfo + /revoke', () => {
  it('userinfo: 401 challenge without a Bearer, returns claims with a valid token', () => {
    const r1 = makeRes();
    new OauthPublicController(osvc(), rl()).userinfo(undefined, r1);
    expect(r1.statusCode).toBe(401);
    expect(r1.headers['WWW-Authenticate']).toBe('Bearer realm="TREK MCP"');
    const r2 = makeRes();
    new OauthPublicController(osvc({ getUserByAccessToken: vi.fn().mockReturnValue({ user: { id: 1, email: 'a@b.c', username: 'u' } }) }), rl()).userinfo('Bearer tok', r2);
    expect(r2.body).toEqual({ sub: '1', email: 'a@b.c', email_verified: true, preferred_username: 'u' });
  });

  it('userinfo: 404 empty when MCP is disabled', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ mcpEnabled: vi.fn().mockReturnValue(false) }), rl()).userinfo('Bearer tok', res);
    expect(res.statusCode).toBe(404);
    expect(res.ended).toBe(true);
  });

  it('userinfo: 401 with the error challenge when the token is unknown', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ getUserByAccessToken: vi.fn().mockReturnValue(null) }), rl()).userinfo('Bearer tok', res);
    expect(res.statusCode).toBe(401);
    expect(res.headers['WWW-Authenticate']).toBe('Bearer realm="TREK MCP", error="invalid_token"');
    expect(res.body).toEqual({ error: 'invalid_token' });
  });

  it('revoke: 400 without token/client, always 200 once authenticated', () => {
    const r1 = makeRes();
    new OauthPublicController(osvc(), rl()).revoke({ ip: '1', body: { client_id: 'c' } } as Request, r1);
    expect(r1.statusCode).toBe(400);
    const r2 = makeRes();
    const revokeToken = vi.fn();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue({ id: 'c' }), revokeToken }), rl()).revoke({ ip: '1', body: { token: 't', client_id: 'c' } } as Request, r2);
    expect(r2.statusCode).toBe(200);
    expect(r2.body).toEqual({});
    expect(revokeToken).toHaveBeenCalled();
  });

  it('revoke: 404 empty when MCP is disabled', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ mcpEnabled: vi.fn().mockReturnValue(false) }), rl()).revoke({ ip: '1', body: {} } as Request, res);
    expect(res.statusCode).toBe(404);
    expect(res.ended).toBe(true);
  });

  it('revoke: 429 when the per-ip bucket is exhausted', () => {
    const s = rl();
    for (let i = 0; i < 10; i++) s.check('oauth_revoke', '1', 10, 60000, Date.now());
    const res = makeRes();
    new OauthPublicController(osvc(), s).revoke({ ip: '1', body: { token: 't', client_id: 'c' } } as Request, res);
    expect(res.statusCode).toBe(429);
  });

  it('revoke: falls back to a default ip key and {} body when both are missing', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue({ id: 'c' }), revokeToken: vi.fn() }), rl())
      .revoke({ body: undefined } as unknown as Request, res);
    // body fell back to {} -> token/client missing -> 400
    expect(res.statusCode).toBe(400);
  });

  it('revoke: 401 when the client credentials are invalid', () => {
    const res = makeRes();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue(null) }), rl())
      .revoke({ ip: '1', body: { token: 't', client_id: 'c' } } as Request, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_client', error_description: 'Invalid client credentials' });
  });

  it('revoke: logs a dash for a missing ip on the invalid-client failure', () => {
    getClientIpMock.mockReturnValueOnce(undefined);
    const res = makeRes();
    new OauthPublicController(osvc({ authenticateClient: vi.fn().mockReturnValue(null) }), rl())
      .revoke({ ip: '1', body: { token: 't', client_id: 'c' } } as Request, res);
    expect(res.statusCode).toBe(401);
  });
});

describe('OauthApiController', () => {
  const req = { ip: '1.2.3.4', user: undefined as unknown } as Request;
  function makeRes2() { const r = { statusCode: 200, ended: false, status: vi.fn((c: number) => { r.statusCode = c; return r; }), end: vi.fn(() => { r.ended = true; }) }; return r as unknown as Response & { statusCode: number; ended: boolean }; }

  it('validate: 404 empty when MCP off, loginRequired when anonymous + valid', () => {
    const off = makeRes2();
    new OauthApiController(osvc({ mcpEnabled: vi.fn().mockReturnValue(false) }), rl()).validate({ ...req } as Request, {}, off);
    expect(off.statusCode).toBe(404);
    expect(off.ended).toBe(true);
    const anon = makeRes2();
    const r = new OauthApiController(osvc({ validateAuthorizeRequest: vi.fn().mockReturnValue({ valid: true }) }), rl()).validate({ ...req, user: undefined } as Request, {}, anon);
    expect(r).toEqual({ valid: true, loginRequired: true });
  });

  it('authorize: denied returns a redirect with access_denied, approved issues a code', () => {
    const denied = new OauthApiController(osvc(), rl()).authorize(user, { client_id: 'c', redirect_uri: 'https://cb', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256', approved: false }, req);
    expect((denied as { redirect: string }).redirect).toContain('error=access_denied');
    const svc = osvc({ validateAuthorizeRequest: vi.fn().mockReturnValue({ valid: true, scopes: ['s'], resource: null }), saveConsent: vi.fn(), createAuthCode: vi.fn().mockReturnValue('the_code') });
    const ok = new OauthApiController(svc, rl()).authorize(user, { client_id: 'c', redirect_uri: 'https://cb', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256', approved: true }, req);
    expect((ok as { redirect: string }).redirect).toContain('code=the_code');
  });

  it('clients/sessions: 403 when MCP off, else CRUD', () => {
    expect(thrown(() => new OauthApiController(osvc({ mcpEnabled: vi.fn().mockReturnValue(false) }), rl()).listClients(user))).toEqual({ status: 403, body: { error: 'MCP is not enabled' } });
    expect(new OauthApiController(osvc({ listOAuthClients: vi.fn().mockReturnValue([{ id: 'c1' }]) }), rl()).listClients(user)).toEqual({ clients: [{ id: 'c1' }] });
    expect(new OauthApiController(osvc({ createOAuthClient: vi.fn().mockReturnValue({ client_id: 'c1', client_secret: 's' }) }), rl()).createClient(user, { name: 'CLI', allowed_scopes: ['a'] }, req)).toEqual({ client_id: 'c1', client_secret: 's' });
    expect(new OauthApiController(osvc({ deleteOAuthClient: vi.fn().mockReturnValue({}) }), rl()).deleteClient(user, 'c1', req)).toEqual({ success: true });
    expect(new OauthApiController(osvc({ listOAuthSessions: vi.fn().mockReturnValue([{ id: 1 }]) }), rl()).listSessions(user)).toEqual({ sessions: [{ id: 1 }] });
    expect(new OauthApiController(osvc({ revokeSession: vi.fn().mockReturnValue({}) }), rl()).revokeSession(user, '1', req)).toEqual({ success: true });
  });

  it('rotate maps a service error, else returns the new secret', () => {
    expect(thrown(() => new OauthApiController(osvc({ rotateOAuthClientSecret: vi.fn().mockReturnValue({ error: 'not_found', status: 404 }) }), rl()).rotateClient(user, 'c1', req))).toEqual({ status: 404, body: { error: 'not_found' } });
    expect(new OauthApiController(osvc({ rotateOAuthClientSecret: vi.fn().mockReturnValue({ client_secret: 'new' }) }), rl()).rotateClient(user, 'c1', req)).toEqual({ client_secret: 'new' });
  });

  it('validate: anonymous + invalid returns a generic error; create maps a service error', () => {
    const res = makeRes2();
    const anon = new OauthApiController(osvc({ validateAuthorizeRequest: vi.fn().mockReturnValue({ valid: false, error: 'x' }) }), rl()).validate({ ...req, user: undefined } as Request, {}, res);
    expect(anon).toEqual({ valid: false, error: 'invalid_request', error_description: 'Invalid authorization request' });
    expect(thrown(() => new OauthApiController(osvc({ createOAuthClient: vi.fn().mockReturnValue({ error: 'invalid_redirect_uri', status: 400 }) }), rl()).createClient(user, { name: 'X', allowed_scopes: ['a'] }, req))).toEqual({ status: 400, body: { error: 'invalid_redirect_uri' } });
  });

  it('authorize: 400 when re-validation fails, 503 when the auth code cannot be issued', () => {
    expect(thrown(() => new OauthApiController(osvc({ validateAuthorizeRequest: vi.fn().mockReturnValue({ valid: false, error: 'invalid_scope', error_description: 'bad' }) }), rl()).authorize(user, { client_id: 'c', redirect_uri: 'https://cb', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256', approved: true }, req))).toEqual({ status: 400, body: { error: 'invalid_scope', error_description: 'bad' } });
    expect(thrown(() => new OauthApiController(osvc({ validateAuthorizeRequest: vi.fn().mockReturnValue({ valid: true, scopes: ['s'], resource: null }), saveConsent: vi.fn(), createAuthCode: vi.fn().mockReturnValue(null) }), rl()).authorize(user, { client_id: 'c', redirect_uri: 'https://cb', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256', approved: true }, req))).toEqual({ status: 503, body: { error: 'server_error', error_description: 'Authorization server is temporarily unavailable' } });
  });

  it('validate: 429 when the per-ip bucket is exhausted', () => {
    const s = rl();
    for (let i = 0; i < 30; i++) s.check('oauth_validate', '1.2.3.4', 30, 60000, Date.now());
    const res = makeRes2();
    expect(thrown(() => new OauthApiController(osvc(), s).validate({ ...req } as Request, {}, res))).toEqual({
      status: 429,
      body: { error: 'too_many_requests', error_description: 'Too many attempts. Please try again later.' },
    });
  });

  it('validate: falls back to the "unknown" rate-limit key when req.ip is absent', () => {
    const res = makeRes2();
    const out = new OauthApiController(osvc({ validateAuthorizeRequest: vi.fn().mockReturnValue({ valid: true }) }), rl())
      .validate({ user: undefined } as unknown as Request, {}, res);
    expect(out).toEqual({ valid: true, loginRequired: true });
  });

  it('validate: forwards the resource + returns the raw result for a logged-in user', () => {
    const res = makeRes2();
    const validateAuthorizeRequest = vi.fn().mockReturnValue({ valid: true, scopes: ['s'] });
    const out = new OauthApiController(osvc({ validateAuthorizeRequest }), rl())
      .validate({ ...req, user: { id: 9 } } as unknown as Request, { resource: 'https://r' }, res);
    expect(out).toEqual({ valid: true, scopes: ['s'] });
    expect(validateAuthorizeRequest).toHaveBeenCalledWith(expect.objectContaining({ resource: 'https://r' }), 9);
  });

  it('authorize: 403 when MCP is disabled', () => {
    expect(thrown(() => new OauthApiController(osvc({ mcpEnabled: vi.fn().mockReturnValue(false) }), rl())
      .authorize(user, { client_id: 'c', redirect_uri: 'https://cb', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256', approved: false }, req)))
      .toEqual({ status: 403, body: { error: 'MCP is not enabled' } });
  });

  it('authorize: carries the state through both the denied and approved redirects', () => {
    const denied = new OauthApiController(osvc(), rl()).authorize(user, { client_id: 'c', redirect_uri: 'https://cb', scope: 's', state: 'xyz', code_challenge: 'cc', code_challenge_method: 'S256', approved: false }, req);
    expect((denied as { redirect: string }).redirect).toContain('state=xyz');

    const svc = osvc({ validateAuthorizeRequest: vi.fn().mockReturnValue({ valid: true, scopes: ['s'], resource: 'https://aud' }), saveConsent: vi.fn(), createAuthCode: vi.fn().mockReturnValue('the_code') });
    const ok = new OauthApiController(svc, rl()).authorize(user, { client_id: 'c', redirect_uri: 'https://cb', scope: 's', state: 'xyz', code_challenge: 'cc', code_challenge_method: 'S256', approved: true }, req);
    expect((ok as { redirect: string }).redirect).toContain('code=the_code');
    expect((ok as { redirect: string }).redirect).toContain('state=xyz');
  });

  it('client/session errors default the status to 400 when the service omits it', () => {
    expect(thrown(() => new OauthApiController(osvc({ createOAuthClient: vi.fn().mockReturnValue({ error: 'bad' }) }), rl()).createClient(user, { name: 'X', allowed_scopes: ['a'] }, req)))
      .toEqual({ status: 400, body: { error: 'bad' } });
    expect(thrown(() => new OauthApiController(osvc({ rotateOAuthClientSecret: vi.fn().mockReturnValue({ error: 'bad' }) }), rl()).rotateClient(user, 'c1', req)))
      .toEqual({ status: 400, body: { error: 'bad' } });
    expect(thrown(() => new OauthApiController(osvc({ deleteOAuthClient: vi.fn().mockReturnValue({ error: 'not_found', status: 404 }) }), rl()).deleteClient(user, 'c1', req)))
      .toEqual({ status: 404, body: { error: 'not_found' } });
    expect(thrown(() => new OauthApiController(osvc({ deleteOAuthClient: vi.fn().mockReturnValue({ error: 'bad' }) }), rl()).deleteClient(user, 'c1', req)))
      .toEqual({ status: 400, body: { error: 'bad' } });
    expect(thrown(() => new OauthApiController(osvc({ revokeSession: vi.fn().mockReturnValue({ error: 'not_found', status: 404 }) }), rl()).revokeSession(user, '1', req)))
      .toEqual({ status: 404, body: { error: 'not_found' } });
    expect(thrown(() => new OauthApiController(osvc({ revokeSession: vi.fn().mockReturnValue({ error: 'bad' }) }), rl()).revokeSession(user, '1', req)))
      .toEqual({ status: 400, body: { error: 'bad' } });
  });

  it('sessions: 403 when MCP is off on the list', () => {
    expect(thrown(() => new OauthApiController(osvc({ mcpEnabled: vi.fn().mockReturnValue(false) }), rl()).listSessions(user)))
      .toEqual({ status: 403, body: { error: 'MCP is not enabled' } });
  });
});
