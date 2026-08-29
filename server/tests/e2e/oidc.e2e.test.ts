/**
 * OIDC e2e — exercises the migrated /api/auth/oidc flow with the real cookie
 * service. The OIDC methods and the auth toggles are stubbed with vi.spyOn on
 * the container's real OidcService/AuthService instances (the domain is
 * DI-native since the oidc fold — a services/oidcService path mock would
 * silently miss); this proves the flow is unauthenticated, the sso-disabled
 * 403, the login redirect, and that /exchange sets the httpOnly trek_session
 * cookie from a valid auth code.
 */
import { AuthService } from '../../src/nest/auth/auth.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { OidcModule } from '../../src/nest/oidc/oidc.module';
import { OidcService } from '../../src/nest/oidc/oidc.service';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import type { MockInstance } from 'vitest';

vi.mock('../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/app-config')>();
  return { ...actual, getAppUrl: () => 'https://app' };
});

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  // Otherwise-bare :memory: db — nothing in these flows queries it (the
  // db-touching OidcService methods and the toggles are stubbed on the
  // container instances below), the container just needs a connection to
  // construct the oidc/auth/permissions/atlas providers. app_settings is the
  // one real exception: StorageRegistryService (behind AuthModule →
  // StorageModule) reads it at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});
vi.mock('../../src/db/database', () => ({
  db,
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: () => null,
  canAccessTrip: () => undefined,
  isOwner: () => false,
}));
vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const toggles = { oidc_login: true };

describe('OIDC e2e (real cookie service)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let consumeAuthCode: MockInstance;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, OidcModule] }).compile();
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
    vi.spyOn(app.get(AuthService), 'resolveAuthToggles').mockImplementation(() => toggles as never);
    const oidc = app.get(OidcService);
    vi.spyOn(oidc, 'getOidcConfig').mockReturnValue({
      issuer: 'https://idp',
      clientId: 'c',
      clientSecret: 's',
      displayName: 'SSO',
      discoveryUrl: null,
    });
    vi.spyOn(oidc, 'discover').mockResolvedValue({
      authorization_endpoint: 'https://idp/auth',
      userinfo_endpoint: 'https://idp/ui',
      issuer: 'https://idp',
    } as never);
    vi.spyOn(oidc, 'createState').mockReturnValue({ state: 'st', codeChallenge: 'cc' });
    consumeAuthCode = vi.spyOn(oidc, 'consumeAuthCode').mockReturnValue({ token: 'jwt.value' });
  });

  beforeEach(() => {
    toggles.oidc_login = true;
  });

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
    consumeAuthCode.mockReturnValue({ token: 'jwt.value' });
    const res = await request(server).get('/api/auth/oidc/exchange').query({ code: 'good' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'jwt.value' });
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session=') && /HttpOnly/i.test(c))).toBe(true);
  });

  it('GET /exchange with a remembered code sets a persistent Max-Age cookie (#1927)', async () => {
    consumeAuthCode.mockReturnValue({ token: 'jwt.value', remember: true });
    const res = await request(server).get('/api/auth/oidc/exchange').query({ code: 'good' });
    expect(res.status).toBe(200);
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session='))!;
    expect(cookie).toContain('Max-Age=2592000');
  });

  it('GET /exchange with remember=false sets a browser-session cookie (no Max-Age) (#1927)', async () => {
    consumeAuthCode.mockReturnValue({ token: 'jwt.value', remember: false });
    const res = await request(server).get('/api/auth/oidc/exchange').query({ code: 'good' });
    expect(res.status).toBe(200);
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session='))!;
    expect(cookie).not.toContain('Max-Age=');
    expect(cookie).not.toContain('Expires=');
  });
});
