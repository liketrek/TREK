/**
 * Piste router e2e (spec 12.5): `POST /api/trips/:tripId/ski/route`,
 * `GET .../ski/area-near` and `GET .../ski/network/:areaId` through the real
 * AddonGuard, JwtAuthGuard and TripAccessGuard, the Zod pipe and the response
 * contracts, over the real services and router on a migrated temp SQLite db.
 * The Places host is a stub serving one area drawn by the test, so nothing
 * leaves the test; its client is covered in trek-places.winter.test.ts.
 */
import { AppConfigModule } from '../../src/nest/app-config/app-config.module';
import { DataPathsService } from '../../src/nest/app-config/data-paths.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TrekPlacesWinterService } from '../../src/nest/maps/trek-places-winter.service';
import { SkiRoutingModule } from '../../src/nest/ski-routing/ski-routing.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { setAddonEnabled, setAppSetting } from '../helpers/factories/settings';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { SkiWorld } from '../helpers/ski-world';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';
import { skiAreaNearResponseSchema, skiNetworkResponseSchema, skiRouteResponseSchema } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const db = createSnapshotTestDb();

const OWNER = 1;
const MEMBER = 2;
const STRANGER = 3;
let tripId: number;
let orm: TestOrm;
let server: Server;
let dir: string;
let app: Awaited<ReturnType<typeof build>>;

/** Testalp: a chair up, a red run down. */
const testalp = new SkiWorld();
const valley = testalp.node(0, 0, 1200);
const top = testalp.node(0, 2000, 2200);
testalp.lift(valley, top, { name: 'Sonnenbahn', sec: 420 });
testalp.run(top, valley, 2, { name: 'Rote Eins', via: [[300, 1000]] });
const GZ = testalp.gz();
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const south = testalp.at(-500, -500);
const north = testalp.at(500, 2500);
const ROW = {
  id: 'w:1',
  name: 'Testalp',
  kind: 'resort',
  country: 'CH',
  colourScheme: 'europe' as const,
  bbox: [south.lng, south.lat, north.lng, north.lat] as [number, number, number, number],
  counts: { runsKm: 2.1, nordicKm: 0, lifts: 1, skitourKm: 0, hikeKm: 0 },
  bytes: GZ.length,
  sha256: sha(GZ),
};
const INDEX = { build: '2026-11-02', format: 1, areas: [ROW] };
const INDEX_SHA = sha(JSON.stringify(INDEX));

const winter = {
  enabled: vi.fn(() => true),
  meta: vi.fn(async () => ({
    build: '2026-11-02',
    format: 1,
    areas: 1,
    indexSha: INDEX_SHA,
    sourceTimestamp: null,
    attribution: { data: '© OpenStreetMap contributors, ODbL', terrain: 'Terrain: Mapzen Terrarium' },
  })),
  index: vi.fn(async () => ({ status: 'ok' as const, index: INDEX, sha256: INDEX_SHA, dropped: 0 })),
  area: vi.fn(async () => ({ status: 'ok' as const, bytes: GZ, etag: ROW.sha256 })),
};

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      await TestUnitOfWorkModule.forRoot(db),
      await createTestMikroOrmModule(db),
      AppConfigModule,
      SkiRoutingModule,
    ],
  })
    .overrideProvider(DataPathsService)
    .useValue({ dataDir: dir, tmpDir: dir })
    .overrideProvider(TrekPlacesWinterService)
    .useValue(winter)
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalPipes(new ZodValidationPipe());
  nest.useGlobalFilters(new TrekExceptionFilter());
  await nest.init();
  return nest;
}

const route = (body: unknown, userId?: number, trip = tripId) => {
  const req = request(server)
    .post(`/api/trips/${trip}/ski/route`)
    .send(body as object);
  return userId === undefined ? req : req.set({ Cookie: sessionCookie(userId) });
};
const down = { from: testalp.at(0, 2000), to: testalp.at(0, 0) };

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-ski-routing-e2e-'));
  orm = await createTestOrm(db);
  await makeUser(orm, { id: OWNER, email: 'owner@example.test' });
  await makeUser(orm, { id: MEMBER, email: 'member@example.test' });
  await makeUser(orm, { id: STRANGER, email: 'stranger@example.test' });
  tripId = (await makeTrip(orm, OWNER)).id;
  await addTripMember(orm, tripId, MEMBER);
  app = await build();
  server = app.getHttpServer();
});

beforeEach(async () => {
  await setAddonEnabled(orm, 'tours', true);
  await setAppSetting(orm, 'ski_routing_enabled', 'true');
  winter.enabled.mockReturnValue(true);
});

afterAll(async () => {
  await app.close();
  await orm.close();
  db.close();
  await rm(dir, { recursive: true, force: true });
});

describe('POST /api/trips/:tripId/ski/route', () => {
  it('SKIROUTE-E2E-001: 404 while Tours is off; 401 without a session', async () => {
    await setAddonEnabled(orm, 'tours', false);
    const off = await route({ legs: [down], discipline: 'alpine' }, OWNER);
    expect(off.status).toBe(404);
    expect(off.body).toEqual({ error: 'Tours addon is not enabled' });
    await setAddonEnabled(orm, 'tours', true);
    expect((await route({ legs: [down], discipline: 'alpine' })).status).toBe(401);
  });

  it('SKIROUTE-E2E-002: a trip the caller is not on answers 404, as one that does not exist', async () => {
    expect((await route({ legs: [down], discipline: 'alpine' }, STRANGER)).status).toBe(404);
    expect((await route({ legs: [down], discipline: 'alpine' }, OWNER, 999_999)).status).toBe(404);
  });

  it('SKIROUTE-E2E-003: refuses a request off the contract with 400', async () => {
    // One after another: supertest binds the unstarted server per request, and requests at once reset each other.
    const answers = [
      await route({ legs: [down] }, OWNER),
      await route({ legs: [], discipline: 'alpine' }, OWNER),
      await route({ legs: [{ from: { lat: 95, lng: 0 }, to: down.to }], discipline: 'alpine' }, OWNER),
      await route({ legs: [down], discipline: 'alpine', options: { colour: 'red' } }, OWNER),
      await route({ legs: [down], discipline: 'sledge' }, OWNER),
    ];
    expect(answers.map((res) => res.status)).toEqual([400, 400, 400, 400, 400]);
  });

  it('SKIROUTE-E2E-004: owner and member get the leg planned down the red run, on the contract', async () => {
    const answers = [
      await route({ legs: [down], discipline: 'alpine' }, OWNER),
      await route({ legs: [down], discipline: 'alpine' }, MEMBER),
    ];
    for (const res of answers) {
      expect(res.status).toBe(200);
      const answer = skiRouteResponseSchema.parse(res.body);
      const [leg] = answer.legs;
      if (leg?.status !== 'ok') throw new Error('not planned');
      expect(leg.segments.map((segment) => segment.name)).toEqual(['Rote Eins']);
      expect(answer).toMatchObject({ build: '2026-11-02', stale: false, area_names: ['Testalp'] });
    }
    // The area was downloaded once, by its id; no point ever went to the host.
    expect(winter.area).toHaveBeenCalledTimes(1);
    expect(winter.area).toHaveBeenCalledWith('w:1', null);
  });

  it('SKIROUTE-E2E-005: the admin switch off answers disabled; TREK Places off answers unavailable', async () => {
    await setAppSetting(orm, 'ski_routing_enabled', 'false');
    const off = await route({ legs: [down], discipline: 'alpine' }, OWNER);
    expect(off.status).toBe(200);
    expect(off.body.legs[0]).toMatchObject({ status: 'failed', code: 'disabled', hint: { free_draw: true } });
    await setAppSetting(orm, 'ski_routing_enabled', 'true');
    winter.enabled.mockReturnValue(false);
    const none = await route({ legs: [down], discipline: 'alpine' }, OWNER);
    expect(none.body.legs[0]).toMatchObject({ code: 'places_unavailable' });
  });
});

describe('GET /api/trips/:tripId/ski/area-near and /network/:areaId', () => {
  it('SKIROUTE-E2E-010: names the area at a point and its state; none off every area; 400 off the globe', async () => {
    const at = testalp.at(0, 1000);
    const near = await request(server)
      .get(`/api/trips/${tripId}/ski/area-near`)
      .query({ lat: at.lat, lng: at.lng })
      .set({ Cookie: sessionCookie(MEMBER) });
    expect(near.status).toBe(200);
    expect(skiAreaNearResponseSchema.parse(near.body).area).toMatchObject({ id: 'w:1', name: 'Testalp' });
    const nowhere = await request(server)
      .get(`/api/trips/${tripId}/ski/area-near`)
      .query({ lat: 53.5, lng: 10 })
      .set({ Cookie: sessionCookie(MEMBER) });
    expect(nowhere.body).toEqual({ area: null });
    const bad = await request(server)
      .get(`/api/trips/${tripId}/ski/area-near`)
      .query({ lat: 95, lng: 10 })
      .set({ Cookie: sessionCookie(MEMBER) });
    expect(bad.status).toBe(400);
  });

  it('SKIROUTE-E2E-011: an area lines for the map, tagged with its checksum; an unknown area 404', async () => {
    const lines = await request(server)
      .get(`/api/trips/${tripId}/ski/network/w:1`)
      .set({ Cookie: sessionCookie(OWNER) });
    expect(lines.status).toBe(200);
    expect(lines.headers.etag).toBe(`"${ROW.sha256}"`);
    const network = skiNetworkResponseSchema.parse(lines.body);
    expect(network.features.map((feature) => feature.kind).sort()).toEqual(['lift', 'run']);
    const unknown = await request(server)
      .get(`/api/trips/${tripId}/ski/network/w:404`)
      .set({ Cookie: sessionCookie(OWNER) });
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ error: 'Ski area not found' });
  });
});
