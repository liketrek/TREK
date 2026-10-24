/**
 * Paddle routing e2e (PAD-11): `POST /api/trips/:tripId/paddle/route` through
 * the real AddonGuard, JwtAuthGuard and TripAccessGuard, the Zod pipe and the
 * response contract, over the real service, repository and router on a
 * migrated temp SQLite db. The region's network is built from an extract the
 * test draws (tests/helpers/water-world.ts) and handed over as the import does.
 */
import { PaddleRegions } from '../../src/db/entities/PaddleRegions.entity';
import { AppConfigModule } from '../../src/nest/app-config/app-config.module';
import { DataPathsService } from '../../src/nest/app-config/data-paths.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { withRequestContext } from '../../src/nest/database/request-context';
import { importExtract } from '../../src/nest/paddle-obstacles/paddle-import';
import { PaddleRoutingModule } from '../../src/nest/paddle-routing/paddle-routing.module';
import { PaddleRoutingService } from '../../src/nest/paddle-routing/paddle-routing.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { insertRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { WaterWorld } from '../helpers/water-world';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';
import { paddleRouteResponseSchema } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
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

/** The Regen, 6 km from Regenstauf south, with the Lindenmühle weir across it and no portage mapped. */
const regen = new WaterWorld({ lat: 49.07, lng: 12.12 });
const river = regen.line(
  [
    [0, 6000],
    [0, 0],
  ],
  { waterway: 'river', name: 'Regen' },
);
regen.tag(river.refs[30] as number, { waterway: 'weir', name: 'Lindenmühle' });
// A mill canal 1.5 km to the east, so the region spans land too.
regen.line(
  [
    [1500, 6000],
    [1500, 0],
  ],
  { waterway: 'canal', name: 'Mühlkanal' },
);

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      await TestUnitOfWorkModule.forRoot(db),
      await createTestMikroOrmModule(db),
      AppConfigModule,
      PaddleRoutingModule,
    ],
  })
    .overrideProvider(DataPathsService)
    .useValue({ dataDir: dir, tmpDir: dir })
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
    .post(`/api/trips/${trip}/paddle/route`)
    .send(body as object);
  return userId === undefined ? req : req.set({ Cookie: sessionCookie(userId) });
};
const leg = { from: regen.at(20, 5500), to: regen.at(-30, 500) };

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-paddle-routing-e2e-'));
  orm = await createTestOrm(db);
  await makeUser(orm, { id: OWNER, email: 'owner@example.test' });
  await makeUser(orm, { id: MEMBER, email: 'member@example.test' });
  await makeUser(orm, { id: STRANGER, email: 'stranger@example.test' });
  tripId = (await makeTrip(orm, OWNER)).id;
  await addTripMember(orm, tripId, MEMBER);
  app = await build();
  server = app.getHttpServer();

  // The region's read, as the paddle obstacles import hands its network over.
  const extract = join(dir, 'oberpfalz.osm.pbf');
  await writeFile(extract, regen.pbf());
  const { graph } = await importExtract(extract, 'oberpfalz', () => undefined);
  if (!graph) throw new Error('no network');
  await insertRow(orm, PaddleRegions, { id: 'oberpfalz', name: 'Oberpfalz', status: 'ready' });
  const routing = app.get(PaddleRoutingService);
  const file = await routing.writeGraphFile('oberpfalz', graph);
  await withRequestContext(app.get(MikroORM), () => routing.recordGraph('oberpfalz', file, graph));
});

beforeEach(async () => {
  await setAddonEnabled(orm, 'tours', true);
});

afterAll(async () => {
  await app.close();
  await orm.close();
  db.close();
  await rm(dir, { recursive: true, force: true });
});

describe('POST /api/trips/:tripId/paddle/route', () => {
  it('PADROUTE-E2E-001: 404 while Tours is off; 401 without a session', async () => {
    await setAddonEnabled(orm, 'tours', false);
    const off = await route({ legs: [leg] }, OWNER);
    expect(off.status).toBe(404);
    expect(off.body).toEqual({ error: 'Tours addon is not enabled' });
    await setAddonEnabled(orm, 'tours', true);
    const anonymous = await route({ legs: [leg] });
    expect(anonymous.status).toBe(401);
  });

  it('PADROUTE-E2E-002: a trip the caller is not on answers 404, as one that does not exist', async () => {
    expect((await route({ legs: [leg] }, STRANGER)).status).toBe(404);
    expect((await route({ legs: [leg] }, OWNER, 999_999)).status).toBe(404);
  });

  it('PADROUTE-E2E-003: refuses a request off the contract with 400', async () => {
    // One after another: supertest binds the unstarted server per request, and requests at once reset each other.
    const answers = [
      await route({}, OWNER),
      await route({ legs: [] }, OWNER),
      await route({ legs: [leg], boat: 'yacht' }, OWNER),
      await route({ legs: [{ from: { lat: 95, lng: 0 }, to: leg.to }] }, OWNER),
    ];
    expect(answers.map((res) => res.status)).toEqual([400, 400, 400, 400]);
  });

  it('PADROUTE-E2E-004: owner and member get the leg planned on the water, carried round the weir, on the contract', async () => {
    const answers = [
      await route({ legs: [leg], boat: 'canoe' }, OWNER),
      await route({ legs: [leg], boat: 'canoe' }, MEMBER),
    ];
    for (const res of answers) {
      expect(res.status).toBe(200);
      const answer = paddleRouteResponseSchema.parse(res.body);
      expect(answer.legs[0]).toMatchObject({ status: 'ok' });
      const planned = answer.legs[0];
      if (planned?.status !== 'ok') throw new Error('not planned');
      expect(planned.distance_m).toBeGreaterThan(4900);
      expect(planned.segments.find((segment) => segment.kind === 'portage')).toMatchObject({
        name: 'Lindenmühle',
        source: 'inferred',
      });
      expect(answer.graph_rev).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it('PADROUTE-E2E-005: answers every leg on its own: one off the water, one where no region has data', async () => {
    const res = await route(
      {
        legs: [
          { from: regen.at(0, 5000), to: regen.at(900, 3000) },
          { from: { lat: 53.4, lng: 12.7 }, to: { lat: 53.5, lng: 12.7 } },
        ],
      },
      OWNER,
    );
    expect(res.status).toBe(200);
    expect(res.body.legs).toEqual([
      { status: 'failed', code: 'not_on_water', at: regen.at(900, 3000) },
      { status: 'failed', code: 'no_region', at: { lat: 53.4, lng: 12.7 } },
    ]);
  });
});
