/**
 * /api/routing/valhalla e2e: the real JwtAuthGuard, the Zod pipe over the
 * shared contract and RoutingRelayModule on a migrated temp database, against
 * a stub Valhalla behind safeFetchAdminConfigured. The identity port is a
 * fake: NODE_ENV=test registers no key, and the key is the port's to give.
 */
import { servicesConfig } from '../../src/nest/app-config/tokens';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { RoutingRelayModule } from '../../src/nest/routing-relay/routing-relay.module';
import { ServiceIdentityPort } from '../../src/nest/service-identity/service-identity.interface';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { safeFetchAdminConfigured } = vi.hoisted(() => ({ safeFetchAdminConfigured: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetchAdminConfigured,
}));

const db = createSnapshotTestDb();
const USER = 1;
const identity = {
  headersFor: vi.fn((): Record<string, string> => ({ 'User-Agent': 'TREK/5.1.0', Authorization: 'Bearer tk1.k.p.s' })),
  observe: vi.fn(),
};
const ROUTE = {
  locations: [
    { lat: 48.2, lon: 16.37, radius: 50 },
    { lat: 47.8, lon: 13.04, radius: 50 },
  ],
  costing: 'auto',
  costing_options: { auto: { use_tolls: 0 } },
  directions_options: { units: 'kilometers' },
};

let orm: TestOrm;
let app: Awaited<ReturnType<typeof build>>;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RoutingRelayModule],
  })
    .overrideProvider(servicesConfig.KEY)
    .useValue({
      mode: 'auto',
      key: null,
      hosts: ['places.liketrek.com', 'valhalla.liketrek.com'],
      valhallaUrl: 'https://valhalla.liketrek.com',
    })
    .overrideProvider(ServiceIdentityPort)
    .useValue(identity)
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalFilters(new TrekExceptionFilter());
  nest.useGlobalPipes(new ZodValidationPipe());
  await nest.init();
  return nest;
}

const as = (userId: number) => ({ Cookie: sessionCookie(userId) });
const valhallaAnswers = (status: number, body: unknown) =>
  safeFetchAdminConfigured.mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );

beforeAll(async () => {
  orm = await createTestOrm(db);
  await makeUser(orm, { id: USER, username: 'planner', email: 'planner@example.test' });
  app = await build();
});

beforeEach(() => {
  safeFetchAdminConfigured.mockReset();
  identity.headersFor.mockClear();
});

afterAll(async () => {
  await app.close();
  await orm.close();
});

describe('POST /api/routing/valhalla/:action', () => {
  it('RELAY-E2E-001: answers 401 without a session and asks nothing', async () => {
    const res = await request(app.getHttpServer()).post('/api/routing/valhalla/route').send(ROUTE);
    expect(res.status).toBe(401);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('RELAY-E2E-002: relays a route with the installation key and answers with Valhalla’s own body', async () => {
    const trip = { trip: { legs: [{ shape: '_p~iF~ps|U', summary: { length: 1.2, time: 90 } }] } };
    valhallaAnswers(200, trip);
    const res = await request(app.getHttpServer()).post('/api/routing/valhalla/route').set(as(USER)).send(ROUTE);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(trip);
    const [url, init] = safeFetchAdminConfigured.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://valhalla.liketrek.com/route');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tk1.k.p.s');
    expect(JSON.parse(String(init.body))).toEqual(ROUTE);
  });

  it('RELAY-E2E-003: passes Valhalla’s refusal on with its status, for the planner to read', async () => {
    valhallaAnswers(400, { error_code: 442, error: 'No path could be found for input' });
    const res = await request(app.getHttpServer()).post('/api/routing/valhalla/route').set(as(USER)).send(ROUTE);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error_code: 442, error: 'No path could be found for input' });
  });

  it('RELAY-E2E-004: refuses a body outside the contract at the pipe, before Valhalla is asked', async () => {
    const tooMany = { ...ROUTE, locations: Array.from({ length: 21 }, () => ROUTE.locations[0]) };
    const route = await request(app.getHttpServer()).post('/api/routing/valhalla/route').set(as(USER)).send(tooMany);
    expect(route.status).toBe(400);
    const both = await request(app.getHttpServer())
      .post('/api/routing/valhalla/trace_attributes')
      .set(as(USER))
      .send({ shape: [ROUTE.locations[0], ROUTE.locations[1]], encoded_polyline: 'abc', costing: 'pedestrian' });
    expect(both.status).toBe(400);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('RELAY-E2E-005: relays heights and the description of a line', async () => {
    valhallaAnswers(200, { range_height: [[0, 512]] });
    const heights = await request(app.getHttpServer())
      .post('/api/routing/valhalla/height')
      .set(as(USER))
      .send({ shape: [{ lat: 47, lon: 11 }], range: true });
    expect(heights.body).toEqual({ range_height: [[0, 512]] });
    valhallaAnswers(200, { edges: [] });
    const trace = await request(app.getHttpServer())
      .post('/api/routing/valhalla/trace_attributes')
      .set(as(USER))
      .send({ encoded_polyline: '_p~iF~ps|U_ulLnnqC', costing: 'pedestrian', shape_match: 'map_snap' });
    expect(trace.status).toBe(200);
    expect(safeFetchAdminConfigured.mock.calls.map(([url]) => url)).toEqual([
      'https://valhalla.liketrek.com/height',
      'https://valhalla.liketrek.com/trace_attributes',
    ]);
  });

  it('RELAY-E2E-006: answers 503 while the installation holds no key, so the planner turns to FOSSGIS', async () => {
    identity.headersFor.mockReturnValueOnce({ 'User-Agent': 'TREK/5.1.0' });
    const res = await request(app.getHttpServer()).post('/api/routing/valhalla/route').set(as(USER)).send(ROUTE);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'The TREK routing service is not available on this instance' });
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });
});
