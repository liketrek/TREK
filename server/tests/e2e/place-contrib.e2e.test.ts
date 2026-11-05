/**
 * /api/admin/places-contribute e2e: the real JwtAuthGuard, AdminGuard, Zod pipe
 * and response contracts over PlaceContribModule on a migrated temp database,
 * with the installation key from TREK_SERVICES_KEY and fetch standing in for
 * the TREK Places API.
 *
 * NODE_ENV=test makes the instance ineligible, which is what the state says;
 * the decisions, the log and the withdrawal work regardless.
 */
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { PlaceContribLog } from '../../src/db/entities/PlaceContribLog.entity';
import { servicesConfig } from '../../src/nest/app-config/tokens';
import { inOrder } from '../../src/nest/common/in-order';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PlaceContribModule } from '../../src/nest/place-contrib/place-contrib.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows, deleteRows, insertRows } from '../helpers/factories/rows';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { serviceKeyTokenFor } from '../helpers/service-keys';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';
import { PLACE_CONTRIB_TERMS_VERSION } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const USER = 1;
const ADMIN = 2;
const KEY = serviceKeyTokenFor({ i: 'contrib-e2e', iat: 1_793_000_000, exp: 4_102_444_800 });
const FIELDS = { website: true, phone: true, email: false, opening_hours: true, description: true, image: false };
const BASE = '/api/admin/places-contribute';

const fetchMock = vi.fn();
let orm: TestOrm;
let app: Awaited<ReturnType<typeof build>>;
let server: Server;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), PlaceContribModule],
  })
    .overrideProvider(servicesConfig.KEY)
    .useValue({
      mode: 'auto',
      key: KEY,
      hosts: ['places.liketrek.com'],
      photonUrl: 'https://photon.liketrek.com',
      valhallaUrl: 'https://valhalla.liketrek.com',
    })
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalFilters(new TrekExceptionFilter());
  nest.useGlobalPipes(new ZodValidationPipe());
  await nest.init();
  return nest;
}

const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

beforeAll(async () => {
  vi.stubGlobal('fetch', fetchMock);
  orm = await createTestOrm(db);
  await makeUser(orm, { id: USER, username: 'traveler', email: 'traveler@example.test' });
  await makeAdmin(orm, { id: ADMIN, username: 'admin', email: 'admin@example.test' });
  app = await build();
  server = app.getHttpServer();
});

beforeEach(async () => {
  fetchMock.mockReset();
  await deleteRows(orm, PlaceContribLog);
});

afterAll(async () => {
  await app.close();
  await orm.close();
  vi.unstubAllGlobals();
});

describe('the guards', () => {
  it('PCE2E-001: 401 without a session and 403 for a user who is no admin, on every route', async () => {
    const routes = [
      () => request(server).get(BASE),
      () => request(server).put(`${BASE}/decision`).send({ action: 'snooze' }),
      () => request(server).get(`${BASE}/log`),
      () => request(server).post(`${BASE}/withdraw`).send({ confirm: true }),
    ];
    // One after another: the test server resets connections opened all at once.
    await inOrder(routes, async (route) => {
      expect((await route()).status).toBe(401);
      expect((await route().set(as(USER))).status).toBe(403);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('the state and the decisions', () => {
  it('PCE2E-010: a test instance is not eligible, says why, and shows no prompt', async () => {
    const res = await request(server).get(BASE).set(as(ADMIN));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
      ceiling: 'admin',
      eligible: false,
      ineligibleReason: 'not_production',
      showPrompt: false,
      active: false,
      queue: { size: 0, cap: 5000, full: false },
      counts: { accepted: 0, duplicate: 0, rejected: 0, withheld: 0, retracted: 0 },
    });
  });

  it('PCE2E-011: an agreement is stored, answered with the new state and audited', async () => {
    const res = await request(server)
      .put(`${BASE}/decision`)
      .set(as(ADMIN))
      .send({ action: 'agree', termsVersion: PLACE_CONTRIB_TERMS_VERSION, fields: FIELDS });
    expect(res.status).toBe(200);
    expect(res.body.consent).toMatchObject({
      enabled: true,
      fields: FIELDS,
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
      decision: 'agreed',
      decidedBy: ADMIN,
    });
    expect(await countRows(orm, AuditLog, { action: 'admin.places_contribute_decision' })).toBeGreaterThanOrEqual(1);
  });

  it('PCE2E-012: a dialog built for other terms gets 409 with the terms in force', async () => {
    const res = await request(server)
      .put(`${BASE}/decision`)
      .set(as(ADMIN))
      .send({ action: 'agree', termsVersion: PLACE_CONTRIB_TERMS_VERSION + 1, fields: FIELDS });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: 'The contribution terms changed',
      reason: 'terms_outdated',
      termsVersion: PLACE_CONTRIB_TERMS_VERSION,
    });
  });

  it('PCE2E-013: the pipe refuses a body outside the contract', async () => {
    const bodies = [
      { action: 'maybe' },
      { action: 'agree', fields: FIELDS },
      { action: 'agree', termsVersion: 1, fields: { website: true } },
      { action: 'fields', fields: FIELDS, withdraw: 'yes' },
    ];
    await inOrder(bodies, async (body) => {
      const res = await request(server).put(`${BASE}/decision`).set(as(ADMIN)).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    });
  });

  it('PCE2E-014: "Not now" answers when the prompt comes back for this admin', async () => {
    const res = await request(server).put(`${BASE}/decision`).set(as(ADMIN)).send({ action: 'snooze' });
    expect(res.status).toBe(200);
    expect(Date.parse(res.body.snoozedUntil) - Date.now()).toBeGreaterThan(13 * 24 * 3_600_000);
  });
});

describe('the log', () => {
  it('PCE2E-020: pages newest first and filters by result and field', async () => {
    await insertRows(orm, PlaceContribLog, [
      {
        day: '2026-10-29',
        contrib_key: 'osm:node/1',
        place_name: 'A',
        field: 'website',
        result: 'accepted',
        reason: 'published',
      },
      {
        day: '2026-10-30',
        contrib_key: 'osm:node/2',
        place_name: 'B',
        field: 'phone',
        result: 'withheld',
        reason: 'unchanged',
      },
      {
        day: '2026-10-30',
        contrib_key: 'osm:node/3',
        place_name: 'C',
        field: 'website',
        result: 'rejected',
        reason: 'key',
      },
    ]);
    const page = await request(server).get(`${BASE}/log?page=1&perPage=2`).set(as(ADMIN));
    expect(page.status).toBe(200);
    expect(page.body).toMatchObject({ total: 3, page: 1, perPage: 2 });
    expect(page.body.entries.map((entry: { placeName: string }) => entry.placeName)).toEqual(['C', 'B']);
    const filtered = await request(server).get(`${BASE}/log?field=website&result=accepted`).set(as(ADMIN));
    expect(filtered.body.entries).toEqual([
      {
        id: expect.any(Number),
        day: '2026-10-29',
        key: 'osm:node/1',
        placeName: 'A',
        field: 'website',
        valueSummary: null,
        result: 'accepted',
        reason: 'published',
      },
    ]);
    expect((await request(server).get(`${BASE}/log?result=sent`).set(as(ADMIN))).status).toBe(400);
  });
});

describe('withdrawing everything', () => {
  it('PCE2E-030: needs the confirmation', async () => {
    expect((await request(server).post(`${BASE}/withdraw`).set(as(ADMIN)).send({})).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('PCE2E-031: asks the service with the installation key and answers what it took back', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true, withdrawn: { website: 2, image: 0 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const res = await request(server).post(`${BASE}/withdraw`).set(as(ADMIN)).send({ confirm: true });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ withdrawn: { website: 2, image: 0 }, cleared: 0 });
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit & { headers: Record<string, string> }];
    expect(String(url)).toBe('https://places.liketrek.com/v1/contrib/install');
    expect(init.method).toBe('DELETE');
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    expect(await countRows(orm, PlaceContribLog, { result: 'retracted' })).toBe(1);
    expect(await countRows(orm, AuditLog, { action: 'admin.places_contribute_withdraw' })).toBeGreaterThanOrEqual(1);
  });

  it('PCE2E-032: a withdrawal the service does not confirm is a 502', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'unavailable' }), { status: 500 }));
    const res = await request(server).post(`${BASE}/withdraw`).set(as(ADMIN)).send({ confirm: true });
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'The TREK Places API did not confirm the withdrawal', reason: 'status_500' });
  });
});
