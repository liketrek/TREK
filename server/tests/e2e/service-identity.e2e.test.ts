/**
 * /api/admin/service-identity e2e: the real JwtAuthGuard, AdminGuard and
 * response contract over ServiceIdentityModule on a migrated temp database,
 * against a fake issuer standing in for places.liketrek.com.
 *
 * Replaced: safeFetch, so the issuer is the fake below, and the audit writer.
 * NODE_ENV=test keeps registration off, as it is in every suite.
 */
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { servicesConfig } from '../../src/nest/app-config/tokens';
import { AuditService } from '../../src/nest/audit/audit.service';
import { encrypt_api_key } from '../../src/nest/common/crypto/apiKeyCrypto';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { ServiceIdentityModule } from '../../src/nest/service-identity/service-identity.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { deleteRows, findRow, upsertRow } from '../helpers/factories/rows';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { serviceKeyTokenFor } from '../helpers/service-keys';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetch } = vi.hoisted(() => ({ safeFetch: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetch,
}));

const db = createSnapshotTestDb();
const USER = 1;
const ADMIN = 2;
const ENV_KEY = serviceKeyTokenFor({ i: 'from-environment', iat: 1_793_000_000, exp: 4_102_444_800, q: 'own' });
const STORED_KEY = serviceKeyTokenFor({ i: 'registered-one', iat: 1_793_000_000, exp: 4_102_444_800 });
const QUOTA = { tier: 'own', limit: 50_000, used: 1_234, remaining: 48_766, reset_at: 1_793_059_200, per_minute: 600 };
const VIEW = { limit: 50_000, used: 1_234, remaining: 48_766, resetAt: new Date(1_793_059_200_000).toISOString() };

const writeAudit = vi.fn();
let orm: TestOrm;

type ServicesConfig = { mode: 'auto' | 'off'; key: string | null; hosts: string[]; valhallaUrl: string };

async function build(config: Partial<ServicesConfig> = {}) {
  const moduleRef = await Test.createTestingModule({
    imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), ServiceIdentityModule],
  })
    .overrideProvider(servicesConfig.KEY)
    .useValue({
      mode: 'auto',
      key: null,
      hosts: ['places.liketrek.com'],
      valhallaUrl: 'https://valhalla.liketrek.com',
      ...config,
    })
    .overrideProvider(AuditService)
    .useValue({ writeAudit })
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalFilters(new TrekExceptionFilter());
  nest.useGlobalPipes(new ZodValidationPipe());
  await nest.init();
  return nest;
}

/** Every liketrek host as it answers /v1/quota. */
function issuerAnswers(status = 200) {
  safeFetch.mockImplementation(async () =>
    status === 200
      ? new Response(JSON.stringify(QUOTA), { status, headers: { 'content-type': 'application/json' } })
      : new Response('{"error":"unavailable"}', { status }),
  );
}

const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

beforeAll(async () => {
  orm = await createTestOrm(db);
  await makeUser(orm, { id: USER, username: 'traveler', email: 'traveler@example.test' });
  await makeAdmin(orm, { id: ADMIN, username: 'admin', email: 'admin@example.test' });
});

beforeEach(async () => {
  safeFetch.mockReset();
  writeAudit.mockReset();
  issuerAnswers();
  await deleteRows(orm, AppSettings, { key: { $in: ['service_key', 'service_key_state'] } });
});

afterAll(async () => {
  await orm.close();
});

describe('with a key from TREK_SERVICES_KEY', () => {
  let app: Awaited<ReturnType<typeof build>>;

  beforeAll(async () => {
    app = await build({ key: ENV_KEY });
  });

  afterAll(async () => {
    await app.close();
  });

  it('SIE2E-001: answers 401 without a session and 403 to a user who is no admin', async () => {
    const server = app.getHttpServer();
    expect((await request(server).get('/api/admin/service-identity')).status).toBe(401);
    expect((await request(server).get('/api/admin/service-identity').set(as(USER))).status).toBe(403);
    expect((await request(server).post('/api/admin/service-identity/regenerate').set(as(USER))).status).toBe(403);
  });

  it('SIE2E-002: shows the allowance the issuer reports for that key, and no other host sees it', async () => {
    const res = await request(app.getHttpServer()).get('/api/admin/service-identity').set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      state: 'connected',
      tier: 'own',
      keySource: 'env',
      services: [
        { service: 'places', inUse: true, quota: VIEW },
        { service: 'photon', inUse: false, quota: null },
        { service: 'valhalla', inUse: false, quota: null },
      ],
      lastSeenAt: null,
    });
    expect(safeFetch).toHaveBeenCalledTimes(1);
    const [url, init] = safeFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('https://places.liketrek.com/v1/quota');
    expect(init.headers.Authorization).toBe(`Bearer ${ENV_KEY}`);
    expect(init.headers['User-Agent']).toMatch(/^TREK\//);
  });

  it('SIE2E-003: will not start over a key the environment sets', async () => {
    const res = await request(app.getHttpServer()).post('/api/admin/service-identity/regenerate').set(as(ADMIN));
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'The key is set by TREK_SERVICES_KEY and is changed there' });
    expect(writeAudit).not.toHaveBeenCalled();
  });
});

describe('with a key the installation registered', () => {
  let app: Awaited<ReturnType<typeof build>>;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  it('SIE2E-010: a stored key counts as connected, and the card still reads while the issuer is down', async () => {
    await upsertRow(orm, AppSettings, { key: 'service_key', value: encrypt_api_key(STORED_KEY) });
    issuerAnswers(503);
    const res = await request(app.getHttpServer()).get('/api/admin/service-identity').set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ state: 'connected', tier: 'std', keySource: 'registered' });
    expect(res.body.services[0]).toEqual({ service: 'places', inUse: true, quota: null });
  });

  it('SIE2E-011: a new identity drops the stored key, is audited, and leaves the shared pool until the next search', async () => {
    await upsertRow(orm, AppSettings, { key: 'service_key', value: encrypt_api_key(STORED_KEY) });
    await upsertRow(orm, AppSettings, { key: 'service_key_state', value: '{"revoked":"abc"}' });
    const res = await request(app.getHttpServer()).post('/api/admin/service-identity/regenerate').set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ state: 'legacy', keySource: null });
    expect(await findRow(orm, AppSettings, { key: 'service_key' })).toBeNull();
    expect(await findRow(orm, AppSettings, { key: 'service_key_state' })).toBeNull();
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userId: ADMIN, action: 'admin.service_identity_regenerate' }),
    );
    const [, init] = safeFetch.mock.calls.at(-1) as [string, RequestInit & { headers: Record<string, string> }];
    expect(init.headers).not.toHaveProperty('Authorization');
  });
});

describe('with every liketrek host listed in TREK_SERVICES_HOSTS', () => {
  const ALL_HOSTS = ['places.liketrek.com', 'photon.liketrek.com', 'valhalla.liketrek.com'];

  it('SIE2E-030: asks each host for its own allowance and says which services this instance uses', async () => {
    const app = await build({ key: ENV_KEY, hosts: ALL_HOSTS });
    try {
      const res = await request(app.getHttpServer()).get('/api/admin/service-identity').set(as(ADMIN));
      expect(res.status).toBe(200);
      expect(res.body.services).toEqual([
        { service: 'places', inUse: true, quota: VIEW },
        { service: 'photon', inUse: true, quota: VIEW },
        { service: 'valhalla', inUse: true, quota: VIEW },
      ]);
      const asked = safeFetch.mock.calls.map(([url]) => String(url)).sort();
      expect(asked).toEqual([
        'https://photon.liketrek.com/v1/quota',
        'https://places.liketrek.com/v1/quota',
        'https://valhalla.liketrek.com/v1/quota',
      ]);
    } finally {
      await app.close();
    }
  });

  it('SIE2E-031: the routing service is not in use once the admin picks FOSSGIS', async () => {
    const app = await build({ key: ENV_KEY, hosts: ALL_HOSTS });
    await upsertRow(orm, AppSettings, { key: 'default_user_setting_routing_valhalla_provider', value: '"fossgis"' });
    try {
      const res = await request(app.getHttpServer()).get('/api/admin/service-identity').set(as(ADMIN));
      expect(res.body.services[2]).toEqual({ service: 'valhalla', inUse: false, quota: VIEW });
    } finally {
      await deleteRows(orm, AppSettings, { key: 'default_user_setting_routing_valhalla_provider' });
      await app.close();
    }
  });
});

describe('with TREK_SERVICES=off', () => {
  it('SIE2E-020: says so and asks the issuer nothing', async () => {
    const app = await build({ mode: 'off' });
    try {
      const res = await request(app.getHttpServer()).get('/api/admin/service-identity').set(as(ADMIN));
      expect(res.body).toEqual({ state: 'off', tier: null, keySource: null, services: [], lastSeenAt: null });
      expect(safeFetch).not.toHaveBeenCalled();
      const regenerate = await request(app.getHttpServer())
        .post('/api/admin/service-identity/regenerate')
        .set(as(ADMIN));
      expect(regenerate.status).toBe(409);
    } finally {
      await app.close();
    }
  });
});
