/**
 * A2 parity — OIDC SSO.
 *
 * Same request at the legacy Express /api/auth/oidc route and the migrated Nest
 * controller, with oidcService, authService.resolveAuthToggles, the cookie
 * service and getAppUrl mocked identically. Redirects compare by status (302,
 * same Location by construction); the disabled/not-configured/exchange branches
 * compare the JSON bodies. supertest does not follow redirects, so 302 bodies
 * stay empty on both sides.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

vi.mock('../../src/services/cookie', () => ({ setAuthCookie: vi.fn() }));
vi.mock('../../src/services/notifications', () => ({ getAppUrl: () => 'https://app' }));

const { toggles } = vi.hoisted(() => ({ toggles: { oidc_login: true } }));
vi.mock('../../src/services/authService', () => ({ resolveAuthToggles: () => toggles }));

const { oidcSvc } = vi.hoisted(() => ({
  oidcSvc: {
    getOidcConfig: vi.fn(), discover: vi.fn(), createState: vi.fn(), consumeState: vi.fn(), createAuthCode: vi.fn(),
    consumeAuthCode: vi.fn(), exchangeCodeForToken: vi.fn(), getUserInfo: vi.fn(), verifyIdToken: vi.fn(),
    findOrCreateUser: vi.fn(), touchLastLogin: vi.fn(), generateToken: vi.fn(), frontendUrl: (p: string) => 'https://app' + p,
  },
}));
vi.mock('../../src/services/oidcService', () => oidcSvc);

import oidcRoutes from '../../src/routes/oidc';
import { OidcModule } from '../../src/nest/oidc/oidc.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('A2 parity (Express vs Nest)', () => {
  let ex: express.Express;
  let ne: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/auth/oidc', oidcRoutes);
    return app;
  }
  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [OidcModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ex = buildExpress();
    nestApp = await buildNest();
    ne = nestApp.getHttpServer();
    oidcSvc.getOidcConfig.mockReturnValue({ issuer: 'https://idp', clientId: 'c', clientSecret: 's', discoveryUrl: null });
    oidcSvc.discover.mockResolvedValue({ authorization_endpoint: 'https://idp/auth', userinfo_endpoint: 'https://idp/ui', issuer: 'https://idp' });
    oidcSvc.createState.mockReturnValue({ state: 'st', codeChallenge: 'cc' });
    oidcSvc.consumeState.mockReturnValue({ redirectUri: 'https://app/api/auth/oidc/callback', codeVerifier: 'cv' });
    oidcSvc.consumeAuthCode.mockReturnValue({ token: 'jwt' });
  });

  beforeEach(() => { toggles.oidc_login = true; });

  afterAll(async () => { await nestApp.close(); });

  it('GET /login redirects (302)', () => expectParity(ex, ne, { path: '/api/auth/oidc/login' }));
  it('GET /login 403 when SSO disabled', () => {
    toggles.oidc_login = false;
    return expectParity(ex, ne, { path: '/api/auth/oidc/login' });
  });
  it('GET /login 400 not configured', () => {
    oidcSvc.getOidcConfig.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(ex, ne, { path: '/api/auth/oidc/login' });
  });
  it('GET /callback redirects on missing params', () => expectParity(ex, ne, { path: '/api/auth/oidc/callback' }));
  it('GET /callback redirects with provider error', () => expectParity(ex, ne, { path: '/api/auth/oidc/callback', query: { error: 'access_denied' } }));
  it('GET /callback redirects on invalid state', () => {
    oidcSvc.consumeState.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(ex, ne, { path: '/api/auth/oidc/callback', query: { code: 'c', state: 's' } });
  });
  it('GET /callback completes the full flow with an auth-code redirect', () => {
    // Drive the whole success chain so the service wrappers (exchange/verify/
    // userinfo/provision/token/auth-code) run on both stacks.
    oidcSvc.consumeState.mockReturnValueOnce({ redirectUri: 'https://app/cb', codeVerifier: 'cv' }).mockReturnValueOnce({ redirectUri: 'https://app/cb', codeVerifier: 'cv' });
    oidcSvc.exchangeCodeForToken.mockResolvedValue({ _ok: true, access_token: 'at', id_token: 'it' });
    oidcSvc.verifyIdToken.mockResolvedValue({ ok: true, claims: { sub: 'u1' } });
    oidcSvc.getUserInfo.mockResolvedValue({ email: 'a@b.c', sub: 'u1' });
    oidcSvc.findOrCreateUser.mockReturnValue({ user: { id: 1 } });
    oidcSvc.generateToken.mockReturnValue('jwt');
    oidcSvc.createAuthCode.mockReturnValue('ac');
    return expectParity(ex, ne, { path: '/api/auth/oidc/callback', query: { code: 'c', state: 's' } });
  });

  it('GET /exchange 400 without a code', () => expectParity(ex, ne, { path: '/api/auth/oidc/exchange' }));
  it('GET /exchange 400 on an invalid code', () => {
    oidcSvc.consumeAuthCode.mockReturnValueOnce({ error: 'invalid_code' }).mockReturnValueOnce({ error: 'invalid_code' });
    return expectParity(ex, ne, { path: '/api/auth/oidc/exchange', query: { code: 'bad' } });
  });
  it('GET /exchange sets cookie + returns token', () => expectParity(ex, ne, { path: '/api/auth/oidc/exchange', query: { code: 'good' } }));
});
