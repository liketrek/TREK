/**
 * Paddle obstacles e2e (PAD-05A): `GET /api/paddle/obstacles` and the admin
 * routes `/api/admin/paddle-regions*` through the real AddonGuard,
 * JwtAuthGuard and AdminGuard, the Zod pipe and the response contracts, over
 * the real services and repositories on a migrated temp SQLite db.
 *
 * Replaced: `GeofabrikClient`, so no test reaches Geofabrik; its download
 * writes an extract the test builds (tests/helpers/osm-pbf-fixture.ts), which
 * the real reader then reads.
 */
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { AppConfigModule } from '../../src/nest/app-config/app-config.module';
import { DataPathsService } from '../../src/nest/app-config/data-paths.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { GeofabrikClient, type GeofabrikRegion } from '../../src/nest/paddle-obstacles/geofabrik.client';
import { PaddleObstaclesModule } from '../../src/nest/paddle-obstacles/paddle-obstacles.module';
import { PADDLE_BOX_INVALID_MESSAGE } from '../../src/nest/paddle-obstacles/paddle-obstacles.service';
import {
  CATALOG_UNAVAILABLE_MESSAGE,
  PaddleRegionsService,
  REGION_NOT_FOUND_MESSAGE,
  REGION_UNKNOWN_MESSAGE,
} from '../../src/nest/paddle-obstacles/paddle-regions.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { deleteRows, findRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { pbfFile } from '../helpers/osm-pbf-fixture';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

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

/** A migrated temp database handed to the code under test, rather than a mocked database module. */
const db = createSnapshotTestDb();

const USER = 1;
const ADMIN = 2;
const REGION: GeofabrikRegion = {
  id: 'oberpfalz',
  name: 'Oberpfalz',
  parent: 'bayern',
  pbfUrl: 'https://download.geofabrik.de/europe/germany/bayern/oberpfalz-latest.osm.pbf',
  boundary: {
    type: 'Polygon',
    coordinates: [
      [
        [11.5, 48.9],
        [13, 48.9],
        [13, 50],
        [11.5, 50],
        [11.5, 48.9],
      ],
    ],
  },
};
const BAYERN: GeofabrikRegion = { ...REGION, id: 'bayern', name: 'Bayern', parent: null, boundary: null };
/** The weir at Lindenmühle, Regenstauf, as a line across the Regen. */
const EXTRACT = pbfFile(
  [
    {
      dense: [
        { id: 1, lat: 49.1231, lon: 12.1301 },
        { id: 2, lat: 49.124, lon: 12.1315 },
      ],
    },
    { ways: [{ id: 29256405, refs: [1, 2], tags: { waterway: 'weir', name: 'Wehr Lindenmühle' } }] },
  ],
  { timestamp: Date.UTC(2026, 9, 1) / 1000 },
);
const BOX = '49.1,12.1,49.2,12.2';

const geofabrik = {
  regions: vi.fn<() => Promise<Map<string, GeofabrikRegion>>>(),
  download: vi.fn<(url: string, target: string) => Promise<void>>(),
};

let orm: TestOrm;
let server: Server;
let dir: string;
let app: Awaited<ReturnType<typeof build>>;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      await TestUnitOfWorkModule.forRoot(db),
      await createTestMikroOrmModule(db),
      AppConfigModule,
      PaddleObstaclesModule,
    ],
  })
    .overrideProvider(GeofabrikClient)
    .useValue(geofabrik)
    .overrideProvider(DataPathsService)
    .useValue({ tmpDir: dir })
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalPipes(new ZodValidationPipe());
  nest.useGlobalFilters(new TrekExceptionFilter());
  await nest.init();
  return nest;
}

const as = (userId: number) => ({ Cookie: sessionCookie(userId) });
const obstacles = (bbox: string, userId?: number) => {
  const req = request(server).get('/api/paddle/obstacles').query({ bbox });
  return userId === undefined ? req : req.set(as(userId));
};
const admin = {
  list: (userId = ADMIN) => request(server).get('/api/admin/paddle-regions').set(as(userId)),
  catalog: (q: string, userId = ADMIN) =>
    request(server).get('/api/admin/paddle-regions/catalog').query({ q }).set(as(userId)),
  add: (id: string, userId = ADMIN) => request(server).post('/api/admin/paddle-regions').set(as(userId)).send({ id }),
  refresh: (id: string, userId = ADMIN) =>
    request(server).post('/api/admin/paddle-regions/refresh').set(as(userId)).send({ id }),
  remove: (id: string, userId = ADMIN) =>
    request(server).post('/api/admin/paddle-regions/remove').set(as(userId)).send({ id }),
};
const settle = () => app.get(PaddleRegionsService).idle();

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'trek-paddle-e2e-'));
  orm = await createTestOrm(db);
  await makeUser(orm, { id: USER, email: 'paddler@example.test' });
  await makeAdmin(orm, { id: ADMIN, email: 'admin@example.test' });
  app = await build();
  server = app.getHttpServer();
});

beforeEach(async () => {
  vi.clearAllMocks();
  geofabrik.regions.mockResolvedValue(
    new Map([
      [REGION.id, REGION],
      [BAYERN.id, BAYERN],
    ]),
  );
  geofabrik.download.mockImplementation((_url, target) => writeFile(target, EXTRACT));
  await setAddonEnabled(orm, 'tours', true);
  await deleteRows(orm, AuditLog);
  await admin.remove(REGION.id);
  await admin.remove(BAYERN.id);
  await settle();
});

afterAll(async () => {
  await app.close();
  await orm.close();
  db.close();
  await rm(dir, { recursive: true, force: true });
});

describe('GET /api/paddle/obstacles', () => {
  it('PADE2E-001: 404 while Tours is off, ahead of the session check; 401 without a cookie once on', async () => {
    await setAddonEnabled(orm, 'tours', false);
    for (const res of [await obstacles(BOX), await obstacles(BOX, USER)]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Tours addon is not enabled' });
    }
    await setAddonEnabled(orm, 'tours', true);
    const anonymous = await obstacles(BOX);
    expect(anonymous.status).toBe(401);
    expect(anonymous.body).toEqual({ error: 'Access token required', code: 'AUTH_REQUIRED' });
  });

  it('PADE2E-002: 400 for a box that is not one, and for one wider than a degree', async () => {
    expect((await obstacles('1,2,3', USER)).status).toBe(400);
    expect((await request(server).get('/api/paddle/obstacles').set(as(USER))).status).toBe(400);
    const wide = await obstacles('48,11,50,13', USER);
    expect(wide.status).toBe(400);
    expect(wide.body).toEqual({ error: PADDLE_BOX_INVALID_MESSAGE });
  });

  it('PADE2E-003: an area without data answers none, never an empty all-clear', async () => {
    const res = await obstacles(BOX, USER);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ features: [], coverage: { state: 'none', regions: [] }, truncated: false });
  });
});

describe('/api/admin/paddle-regions', () => {
  it('PADE2E-004: 401 without a cookie and 403 for a user who is no admin, on every route', async () => {
    expect((await request(server).get('/api/admin/paddle-regions')).status).toBe(401);
    for (const res of [
      await admin.list(USER),
      await admin.catalog('ober', USER),
      await admin.add(REGION.id, USER),
      await admin.refresh(REGION.id, USER),
      await admin.remove(REGION.id, USER),
    ]) {
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
    }
    expect(geofabrik.regions).not.toHaveBeenCalled();
  });

  it('PADE2E-005: an admin adds a region, its read lands, and the map reads the weir as a line with the date of the data', async () => {
    const added = await admin.add(REGION.id);
    expect(added.status).toBe(201);
    expect(await findRows(orm, AuditLog, { action: 'admin.paddle_region_add' })).toMatchObject([
      { details: JSON.stringify({ region: 'oberpfalz' }) },
    ]);
    expect(added.body).toMatchObject({ id: 'oberpfalz', name: 'Oberpfalz', feature_count: 0 });
    await settle();

    const list = await admin.list();
    expect(list.status).toBe(200);
    expect(list.body.regions).toEqual([
      expect.objectContaining({
        id: 'oberpfalz',
        status: 'ready',
        feature_count: 1,
        source_timestamp: '2026-10-01T00:00:00.000Z',
        error: null,
        progress: null,
      }),
    ]);

    const res = await obstacles(BOX, USER);
    expect(res.status).toBe(200);
    expect(res.body.coverage).toMatchObject({ state: 'covered', regions: [{ id: 'oberpfalz', name: 'Oberpfalz' }] });
    expect(res.body.features).toEqual([
      expect.objectContaining({
        ref: 'way/29256405',
        kind: 'weir',
        name: 'Wehr Lindenmühle',
        geometry: { type: 'LineString', coordinates: expect.any(Array) },
      }),
    ]);
  });

  it('PADE2E-006: refresh answers 200 with the region queued, remove 200 with success; both 404 for a region not held', async () => {
    await admin.add(REGION.id);
    await settle();

    const refreshed = await admin.refresh(REGION.id);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body).toMatchObject({ id: 'oberpfalz', status: 'queued' });
    await settle();

    const removed = await admin.remove(REGION.id);
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ success: true });
    expect((await obstacles(BOX, USER)).body.coverage.state).toBe('none');

    for (const res of [await admin.refresh(REGION.id), await admin.remove(REGION.id)]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: REGION_NOT_FOUND_MESSAGE });
    }
  });

  it('PADE2E-007: an id Geofabrik does not list is 400 with the reason, a malformed one 400 from the pipe', async () => {
    const unknown = await admin.add('atlantis');
    expect(unknown.status).toBe(400);
    expect(unknown.body).toEqual({ error: REGION_UNKNOWN_MESSAGE, code: 'unknown_region' });
    expect((await admin.add('Not An Id!')).status).toBe(400);
    expect((await admin.add('')).status).toBe(400);
  });

  it('PADE2E-008: the catalogue finds regions with their path; a short query is 400, an unreachable Geofabrik 502', async () => {
    const found = await admin.catalog('ober');
    expect(found.status).toBe(200);
    expect(found.body).toEqual({ regions: [{ id: 'oberpfalz', name: 'Oberpfalz', path: ['Bayern'] }] });

    expect((await admin.catalog('o')).status).toBe(400);

    geofabrik.regions.mockRejectedValue(new Error('Geofabrik index 503'));
    const down = await admin.catalog('ober');
    expect(down.status).toBe(502);
    expect(down.body).toEqual({ error: CATALOG_UNAVAILABLE_MESSAGE, code: 'catalog_unavailable' });
  });

  it('PADE2E-009: the admin keeps the regions while Tours is off, so data can be prepared before it is switched on', async () => {
    await setAddonEnabled(orm, 'tours', false);
    expect((await admin.list()).status).toBe(200);
    expect((await admin.add(REGION.id)).status).toBe(201);
    await settle();
  });
});
