/**
 * OIDC e2e — exercises the migrated /api/auth/oidc flow with the real cookie
 * service. The OIDC service + auth toggles are mocked; this proves the flow is
 * unauthenticated, the sso-disabled 403, the login redirect, and that /exchange
 * sets the httpOnly trek_session cookie from a valid auth code.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';

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

import { OidcModule } from '../../src/nest/oidc/oidc.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('OIDC e2e (real cookie service)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [OidcModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    app = await build();
    server = app.getHttpServer();
    oidcSvc.getOidcConfig.mockReturnValue({ issuer: 'https://idp', clientId: 'c', clientSecret: 's', discoveryUrl: null });
    oidcSvc.discover.mockResolvedValue({ authorization_endpoint: 'https://idp/auth', userinfo_endpoint: 'https://idp/ui', issuer: 'https://idp' });
    oidcSvc.createState.mockReturnValue({ state: 'st', codeChallenge: 'cc' });
    oidcSvc.consumeAuthCode.mockReturnValue({ token: 'jwt.value' });
  });

  beforeEach(() => { toggles.oidc_login = true; });

  afterAll(async () => {
    await app.close();
  });

  it('GET /login is unauthenticated and redirects (302) to the provider', async () => {
    const res = await request(server).get('/api/auth/oidc/login').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://idp/auth?');
  });

  it('GET /login returns 403 when SSO is disabled', async () => {
    toggles.oidc_login = false;
    const res = await request(server).get('/api/auth/oidc/login');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'SSO login is disabled.' });
  });

  it('GET /exchange 400 without a code', async () => {
    const res = await request(server).get('/api/auth/oidc/exchange');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Code required' });
  });

  it('GET /exchange sets the httpOnly trek_session cookie + returns the token', async () => {
    oidcSvc.consumeAuthCode.mockReturnValue({ token: 'jwt.value' });
    const res = await request(server).get('/api/auth/oidc/exchange').query({ code: 'good' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'jwt.value' });
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session=') && /HttpOnly/i.test(c))).toBe(true);
  });
});
