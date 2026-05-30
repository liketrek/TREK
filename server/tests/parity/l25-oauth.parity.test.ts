/**
 * A3 parity — OAuth 2.1 server (public token/userinfo/revoke + the SPA's
 * /api/oauth management endpoints).
 *
 * Same request at the legacy Express routers and the migrated Nest controllers,
 * with oauthService, the MCP addon gate, getMcpSafeUrl, auditLog and auth
 * mocked identically. The Nest app gets cookie-parser and the cookie-auth
 * routes are sent a trek_session cookie (the legacy mocks ignore it). Pins the
 * grant branches, RFC error bodies, the empty-404 gate and the consent redirect.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));
const COOKIE = { Cookie: 'trek_session=x' };

vi.mock('../../src/db/database', () => ({ db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) }, closeDb: () => {}, reinitialize: () => {} }));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => { (req as express.Request & { user: unknown }).user = fixedUser; next(); },
  optionalAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => { (req as express.Request & { user: unknown }).user = fixedUser; next(); },
  requireCookieAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => { (req as express.Request & { user: unknown }).user = fixedUser; next(); },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));
vi.mock('../../src/services/adminService', () => ({ isAddonEnabled }));
vi.mock('../../src/services/notifications', () => ({ getMcpSafeUrl: () => 'https://app' }));
vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: () => '1.2.3.4', logWarn: vi.fn() }));

const { oauthSvc } = vi.hoisted(() => ({
  oauthSvc: {
    validateAuthorizeRequest: vi.fn(), createAuthCode: vi.fn(), consumeAuthCode: vi.fn(), saveConsent: vi.fn(),
    issueTokens: vi.fn(), issueClientCredentialsToken: vi.fn(), refreshTokens: vi.fn(), revokeToken: vi.fn(),
    verifyPKCE: vi.fn(), authenticateClient: vi.fn(), listOAuthClients: vi.fn(), createOAuthClient: vi.fn(),
    deleteOAuthClient: vi.fn(), rotateOAuthClientSecret: vi.fn(), listOAuthSessions: vi.fn(), revokeSession: vi.fn(),
    getUserByAccessToken: vi.fn(),
  },
}));
vi.mock('../../src/services/oauthService', () => oauthSvc);

import { oauthPublicRouter, oauthApiRouter } from '../../src/routes/oauth';
import { OauthModule } from '../../src/nest/oauth/oauth.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('A3 parity (Express vs Nest)', () => {
  let ex: express.Express;
  let ne: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/oauth', oauthApiRouter);
    app.use('/', oauthPublicRouter);
    return app;
  }
  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [OauthModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ex = buildExpress();
    nestApp = await buildNest();
    ne = nestApp.getHttpServer();
    oauthSvc.getUserByAccessToken.mockReturnValue({ user: { id: 1, email: 'a@b.c', username: 'u' } });
    oauthSvc.authenticateClient.mockReturnValue({ id: 'c', is_public: false, user_id: 1, allows_client_credentials: true, allowed_scopes: '["a","b"]' });
    oauthSvc.listOAuthClients.mockReturnValue([{ id: 'c1' }]);
    oauthSvc.listOAuthSessions.mockReturnValue([{ id: 1 }]);
    oauthSvc.createOAuthClient.mockReturnValue({ client_id: 'c1', client_secret: 's' });
    oauthSvc.deleteOAuthClient.mockReturnValue({});
    oauthSvc.revokeSession.mockReturnValue({});
    oauthSvc.validateAuthorizeRequest.mockReturnValue({ valid: true, scopes: ['s'], resource: null, client_name: 'CLI', allowed_scopes: ['s'] });
    oauthSvc.createAuthCode.mockReturnValue('the_code');
  });

  beforeEach(() => { isAddonEnabled.mockReturnValue(true); });

  afterAll(async () => { await nestApp.close(); });

  // Public — token
  it('POST /oauth/token 401 without client_id', () => expectParity(ex, ne, { method: 'post', path: '/oauth/token', body: {} }));
  it('POST /oauth/token unsupported grant', () => expectParity(ex, ne, { method: 'post', path: '/oauth/token', body: { client_id: 'c', grant_type: 'password' } }));
  it('POST /oauth/token authorization_code invalid_grant', () => {
    oauthSvc.consumeAuthCode.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(ex, ne, { method: 'post', path: '/oauth/token', body: { grant_type: 'authorization_code', client_id: 'c', code: 'x', redirect_uri: 'u', code_verifier: 'v' } });
  });
  it('POST /oauth/token authorization_code success', () => {
    oauthSvc.consumeAuthCode.mockReturnValue({ clientId: 'c', redirectUri: 'u', userId: 1, scopes: ['s'], codeChallenge: 'cc', resource: null });
    oauthSvc.verifyPKCE.mockReturnValue(true);
    oauthSvc.issueTokens.mockReturnValue({ access_token: 'at', token_type: 'Bearer', expires_in: 3600 });
    return expectParity(ex, ne, { method: 'post', path: '/oauth/token', body: { grant_type: 'authorization_code', client_id: 'c', code: 'x', redirect_uri: 'u', code_verifier: 'v' } });
  });
  it('POST /oauth/token client_credentials success', () => {
    oauthSvc.issueClientCredentialsToken.mockReturnValue({ access_token: 'cc_at', token_type: 'Bearer' });
    return expectParity(ex, ne, { method: 'post', path: '/oauth/token', body: { grant_type: 'client_credentials', client_id: 'c', client_secret: 's' } });
  });
  it('POST /oauth/token 404 when MCP disabled', () => {
    isAddonEnabled.mockReturnValue(false);
    return expectParity(ex, ne, { method: 'post', path: '/oauth/token', body: { client_id: 'c' } });
  });

  // Public — userinfo + revoke
  it('GET /oauth/userinfo 401 without Bearer', () => expectParity(ex, ne, { path: '/oauth/userinfo' }));
  it('GET /oauth/userinfo with Bearer', () => expectParity(ex, ne, { path: '/oauth/userinfo', headers: { Authorization: 'Bearer tok' } }));
  it('POST /oauth/revoke 400 without token', () => expectParity(ex, ne, { method: 'post', path: '/oauth/revoke', body: { client_id: 'c' } }));
  it('POST /oauth/revoke 200', () => expectParity(ex, ne, { method: 'post', path: '/oauth/revoke', body: { token: 't', client_id: 'c' } }));

  // API — validate / authorize / clients / sessions
  it('GET /api/oauth/authorize/validate', () => expectParity(ex, ne, { path: '/api/oauth/authorize/validate', query: { response_type: 'code', client_id: 'c', redirect_uri: 'u', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256' }, headers: COOKIE }));
  it('GET /api/oauth/authorize/validate 404 MCP off', () => {
    isAddonEnabled.mockReturnValue(false);
    return expectParity(ex, ne, { path: '/api/oauth/authorize/validate', headers: COOKIE });
  });
  it('POST /api/oauth/authorize denied redirect', () => expectParity(ex, ne, { method: 'post', path: '/api/oauth/authorize', headers: COOKIE, body: { client_id: 'c', redirect_uri: 'https://cb', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256', approved: false } }));
  it('POST /api/oauth/authorize approved redirect', () => expectParity(ex, ne, { method: 'post', path: '/api/oauth/authorize', headers: COOKIE, body: { client_id: 'c', redirect_uri: 'https://cb', scope: 's', code_challenge: 'cc', code_challenge_method: 'S256', approved: true } }));
  it('GET /api/oauth/clients', () => expectParity(ex, ne, { path: '/api/oauth/clients', headers: COOKIE }));
  it('POST /api/oauth/clients (201)', () => expectParity(ex, ne, { method: 'post', path: '/api/oauth/clients', headers: COOKIE, body: { name: 'CLI', allowed_scopes: ['a'] } }));
  it('DELETE /api/oauth/clients/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/oauth/clients/c1', headers: COOKIE }));
  it('GET /api/oauth/sessions', () => expectParity(ex, ne, { path: '/api/oauth/sessions', headers: COOKIE }));
  it('DELETE /api/oauth/sessions/:id', () => expectParity(ex, ne, { method: 'delete', path: '/api/oauth/sessions/1', headers: COOKIE }));
  it('GET /api/oauth/clients 403 MCP off', () => {
    isAddonEnabled.mockReturnValue(false);
    return expectParity(ex, ne, { path: '/api/oauth/clients', headers: COOKIE });
  });
});
