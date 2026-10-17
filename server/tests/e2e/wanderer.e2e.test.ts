/**
 * wanderer e2e: the personal connection (/api/integrations/wanderer) and the
 * trip-side search, preview and import (/api/trips/:tripId/tours/wanderer)
 * through the real JwtAuthGuard, AddonGuard, WandererEnabledGuard and
 * TripAccessGuard, over the real services and repositories on a migrated temp
 * SQLite db handed to them.
 *
 * Replaced: `WandererClient`, so no test ever opens a socket to an instance
 * (each method is a spy answering from the fixtures below), `checkSsrf`, whose
 * DNS lookup is not what this file is about, the permission check (a spy) and
 * the journey hooks. Broadcasts go to a FakeRealtimeService.
 */
import { Places } from '../../src/db/entities/Places.entity';
import { TourSources } from '../../src/db/entities/TourSources.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { WandererConnections } from '../../src/db/entities/WandererConnections.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { WandererClient, WandererError, type WandererSearchHit } from '../../src/nest/wanderer/wanderer.client';
import { WandererModule } from '../../src/nest/wanderer/wanderer.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows, deleteRows, findRow, insertRows } from '../helpers/factories/rows';
import { setAddonEnabled, setAppSetting } from '../helpers/factories/settings';
import { addTripMember } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
const { checkSsrf } = vi.hoisted(() => ({ checkSsrf: vi.fn() }));
vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  checkSsrf,
}));

const { journeyHooks } = vi.hoisted(() => ({
  journeyHooks: {
    reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined),
    onPlaceCreated: vi.fn().mockResolvedValue(undefined),
    onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
    onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
  },
}));

/** A migrated temp database handed to the code under test, rather than a mocked database module. */
const db = createSnapshotTestDb();

const OWNER = 1;
const VIEWER = 2;
const OUTSIDER = 3;
const TOKEN = 'wanderer_key_abcdef';

const HIT: WandererSearchHit = {
  id: 'ukzj2hazx6dgzam',
  name: 'Partnachklamm',
  description: 'Through the gorge',
  location: 'Garmisch',
  distance: 2000,
  duration: 3600,
  elevation_gain: 150,
  elevation_loss: 150,
  difficulty: 1,
  public: false,
  author_name: 'maurice',
  domain: 'wanderer.example.org',
  polyline: '_p~iF~ps|U_ulLnnqC',
};
const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="wanderer"><trk><name>Partnachklamm</name><trkseg>
  <trkpt lat="47.45" lon="11.1"><ele>700</ele></trkpt>
  <trkpt lat="47.46" lon="11.11"><ele>800</ele></trkpt>
  <trkpt lat="47.47" lon="11.12"><ele>850</ele></trkpt>
</trkseg></trk></gpx>`;
const RECORD = {
  id: HIT.id,
  name: HIT.name,
  description: HIT.description,
  gpx: 'track.gpx',
  updated: '2026-10-01',
  public: false,
  author: 'actor1',
};

const realtime = new FakeRealtimeService();
const client = {
  check: vi.fn(),
  ownActors: vi.fn(),
  search: vi.fn(),
  searchById: vi.fn(),
  trail: vi.fn(),
  gpx: vi.fn(),
};

let orm: TestOrm;
let server: Server;
let app: Awaited<ReturnType<typeof build>>;
let checkPermission: MockInstance;

async function build() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      await TestUnitOfWorkModule.forRoot(db),
      await createTestMikroOrmModule(db),
      RealtimeModule,
      WandererModule,
      ToursModule,
    ],
  })
    .overrideProvider(RealtimeService)
    .useValue(realtime)
    .overrideProvider(JourneyDomainService)
    .useValue(journeyHooks)
    .overrideProvider(WandererClient)
    .useValue(client)
    .compile();
  const nest = moduleRef.createNestApplication();
  nest.use(cookieParser());
  nest.useGlobalPipes(new ZodValidationPipe());
  nest.useGlobalFilters(new TrekExceptionFilter());
  await nest.init();
  return nest;
}

const as = (userId: number) => ({ Cookie: sessionCookie(userId) });
const connect = (userId = OWNER) =>
  request(server)
    .put('/api/integrations/wanderer/settings')
    .set(as(userId))
    .send({ url: 'https://wanderer.example.org/', token: TOKEN });
const search = (body: Record<string, unknown> = {}, userId = OWNER, tripId = 5) =>
  request(server).post(`/api/trips/${tripId}/tours/wanderer/search`).set(as(userId)).send(body);
const preview = (trailId = HIT.id, userId = OWNER) =>
  request(server).get(`/api/trips/5/tours/wanderer/trails/${trailId}`).set(as(userId));
const importTrail = (contentHash: string, userId = OWNER) =>
  request(server).post('/api/trips/5/tours/wanderer/import').set(as(userId)).send({ trailId: HIT.id, contentHash });

beforeAll(async () => {
  orm = await createTestOrm(db);
  await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
  await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
  await makeUser(orm, {
    id: 3,
    username: 'outsider',
    email: 'outsider@example.test',
    role: 'user',
    password_version: 0,
  });
  await insertRows(orm, Trips, [{ id: 5, user: 1, title: 'Alps' }]);
  await addTripMember(orm, 5, 2);
  app = await build();
  checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
  server = app.getHttpServer();
});

beforeEach(async () => {
  vi.clearAllMocks();
  checkPermission.mockImplementation(
    (action: string, _role: string, _owner: number, userId: number) => !(action === 'place_edit' && userId === VIEWER),
  );
  checkSsrf.mockResolvedValue({ allowed: true, isPrivate: false });
  client.check.mockResolvedValue({ trailCount: 3 });
  client.ownActors.mockResolvedValue(['actor1']);
  client.search.mockResolvedValue({ hits: [HIT], total: 1 });
  client.searchById.mockResolvedValue(HIT);
  client.trail.mockResolvedValue(RECORD);
  client.gpx.mockResolvedValue(GPX);
  await setAddonEnabled(orm, 'tours', true);
  await setAppSetting(orm, 'tours_wanderer_enabled', 'true');
  await deleteRows(orm, TourSources);
  await deleteRows(orm, Places);
  await deleteRows(orm, WandererConnections);
});

afterAll(async () => {
  await app.close();
  await orm.close();
});

describe('wanderer e2e', () => {
  describe('the connection', () => {
    it('RS-03: saves a connection, keeps the token encrypted and never hands it back', async () => {
      expect((await connect()).body).toEqual({ success: true });
      const row = await findRow(orm, WandererConnections, { user: OWNER });
      expect(row?.token).toBeTruthy();
      expect(row?.token).not.toContain(TOKEN);

      const res = await request(server).get('/api/integrations/wanderer/settings').set(as(OWNER));
      expect(res.body).toMatchObject({ url: 'https://wanderer.example.org', tokenMasked: '••••••••', connected: true });
      expect(JSON.stringify(res.body)).not.toContain(TOKEN);
    });

    it('RS-03: a private address is saved with a warning, an invalid one refused', async () => {
      checkSsrf.mockResolvedValueOnce({ allowed: false, isPrivate: true, resolvedIp: '10.0.0.5' });
      expect((await connect()).body).toEqual({ success: true, warning: 'private_ip' });

      checkSsrf.mockResolvedValueOnce({ allowed: false, isPrivate: false, error: 'Invalid URL' });
      const refused = await connect();
      expect(refused.status).toBe(400);
      expect(refused.body).toMatchObject({ code: 'invalid_url' });
    });

    it('RS-03: a new host without a new token drops the stored one', async () => {
      await connect();
      await request(server)
        .put('/api/integrations/wanderer/settings')
        .set(as(OWNER))
        .send({ url: 'https://other.example.org' });
      expect((await findRow(orm, WandererConnections, { user: OWNER }))?.token).toBeNull();
    });

    it('RS-03: the test answers with the reason in the body and notes it on the saved connection', async () => {
      await connect();
      expect((await request(server).post('/api/integrations/wanderer/test').set(as(OWNER)).send({})).body).toEqual({
        ok: true,
        trailCount: 3,
      });

      client.check.mockRejectedValueOnce(new WandererError('unauthorized', 'no'));
      expect((await request(server).post('/api/integrations/wanderer/test').set(as(OWNER)).send({})).body).toEqual({
        ok: false,
        code: 'unauthorized',
      });
      expect((await request(server).get('/api/integrations/wanderer/settings').set(as(OWNER))).body).toMatchObject({
        lastCheckOk: false,
        lastCheckError: 'unauthorized',
      });
    });

    it('RS-03: disconnecting forgets only the caller connection', async () => {
      await connect(OWNER);
      await connect(VIEWER);
      expect((await request(server).delete('/api/integrations/wanderer/settings').set(as(OWNER))).status).toBe(200);
      expect(await countRows(orm, WandererConnections, { user: OWNER })).toBe(0);
      expect(await countRows(orm, WandererConnections, { user: VIEWER })).toBe(1);
    });

    it('404 for every wanderer route while the admin has not allowed it under Tours, or Tours is off', async () => {
      await connect();
      await setAppSetting(orm, 'tours_wanderer_enabled', 'false');
      const settings = await request(server).get('/api/integrations/wanderer/settings').set(as(OWNER));
      expect(settings.status).toBe(404);
      expect(settings.body).toMatchObject({ code: 'disabled' });
      expect((await search()).status).toBe(404);

      await setAppSetting(orm, 'tours_wanderer_enabled', 'true');
      await setAddonEnabled(orm, 'tours', false);
      expect((await search()).status).toBe(404);
      expect(client.search).not.toHaveBeenCalled();
    });
  });

  describe('search, preview and import', () => {
    it('RS-04: 409 not_connected before a connection exists', async () => {
      const res = await search();
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ code: 'not_connected' });
    });

    it('RS-04/MF-02: searches the caller own trails, in the map box when asked, and marks what is in the trip', async () => {
      await connect();
      const box = { south: 47, west: 11, north: 48, east: 12 };
      const res = await search({ q: 'klamm', bbox: box });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        total: 1,
        trails: [{ id: HIT.id, name: 'Partnachklamm', difficulty: 'moderate', importedAs: [] }],
      });
      expect(client.search).toHaveBeenCalledWith(
        expect.objectContaining({ token: TOKEN }),
        { q: 'klamm', page: 1, bbox: box },
        ['actor1'],
      );
    });

    it('RS-04: only who may add places to the trip looks; an outsider learns nothing of it', async () => {
      await connect(VIEWER);
      expect((await search({}, VIEWER)).status).toBe(403);
      expect((await search({}, OUTSIDER)).status).toBe(404);
    });

    it('RS-05: previews, then imports what was previewed as a snapshot with its provenance', async () => {
      await connect();
      const shown = await preview();
      expect(shown.status).toBe(200);
      expect(shown.body).toMatchObject({ state: 'new', hasElevation: true, points: 3 });

      const res = await importTrail(shown.body.contentHash);
      expect(res.status).toBe(201);
      expect(res.body.tour).toMatchObject({
        name: 'Partnachklamm',
        has_waypoints: false,
        difficulty: 'moderate',
        max_hiking_difficulty: 2,
      });
      const placeId = res.body.tour.place_id as number;
      expect(await findRow(orm, TourSources, { place: placeId })).toMatchObject({
        provider: 'wanderer',
        external_id: HIT.id,
      });

      // Imported once, the same content is not imported again.
      const again = await importTrail(shown.body.contentHash);
      expect(again.status).toBe(409);
      expect(again.body).toMatchObject({ code: 'already_imported' });
      expect((await search()).body.trails[0].importedAs).toEqual([placeId]);
    });

    it('RS-05: a fingerprint that no longer matches the trail imports nothing', async () => {
      await connect();
      const res = await importTrail('0'.repeat(64));
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ code: 'preview_stale' });
      expect(await countRows(orm, Places)).toBe(0);
    });

    it('RS-06: a changed trail previews as changed and comes in as a new snapshot beside the old one', async () => {
      await connect();
      const first = await importTrail((await preview()).body.contentHash);
      client.trail.mockResolvedValue({ ...RECORD, name: 'Partnachklamm (new route)' });
      const changed = await preview();
      expect(changed.body).toMatchObject({ state: 'changed', snapshot: { placeId: first.body.tour.place_id } });
      expect(changed.body.changes).toContain('name');

      const second = await importTrail(changed.body.contentHash);
      expect(second.status).toBe(201);
      expect(second.body.tour.place_id).not.toBe(first.body.tour.place_id);
      expect(await countRows(orm, Places)).toBe(2);
    });

    it('RS-05: a trail without a track or route is refused before anything is written', async () => {
      await connect();
      client.gpx.mockResolvedValue('<?xml version="1.0"?><gpx version="1.1"><wpt lat="47" lon="11"/></gpx>');
      const res = await preview();
      expect(res.status).toBe(422);
      expect(res.body).toMatchObject({ code: 'no_track' });
      expect(await countRows(orm, Places)).toBe(0);
    });

    it('RS-05: a trail without heights comes in marked to use with caution', async () => {
      await connect();
      client.gpx.mockResolvedValue(GPX.replace(/<ele>\d+<\/ele>/g, ''));
      client.trail.mockResolvedValue({ ...RECORD, description: '   ' });
      const shown = await preview();
      expect(shown.body).toMatchObject({ hasElevation: false, elevationGainM: null });
      const res = await importTrail(shown.body.contentHash);
      expect(res.body.tour).toMatchObject({ caution: true, description: null });
    });

    it('RS-06: says whether a snapshot was edited here since its import, and when nothing changed there', async () => {
      await connect();
      const imported = await importTrail((await preview()).body.contentHash);
      expect((await preview()).body).toMatchObject({
        state: 'unchanged',
        changes: [],
        snapshot: { editedLocally: false },
      });

      await request(server)
        .put(`/api/trips/5/places/${imported.body.tour.place_id}`)
        .set(as(OWNER))
        .send({ name: 'Renamed here' });
      expect((await preview()).body).toMatchObject({ state: 'unchanged', snapshot: { editedLocally: true } });
    });

    it('RS-05: an import that is written stays written when the realtime notification fails', async () => {
      await connect();
      const shown = await preview();
      realtime.broadcastMock.mockImplementationOnce(() => {
        throw new Error('socket closed');
      });
      const res = await importTrail(shown.body.contentHash);
      expect(res.status).toBe(201);
      expect(await countRows(orm, Places)).toBe(1);
    });

    it("someone else's trail is neither previewed nor imported", async () => {
      await connect();
      client.searchById.mockResolvedValue(null);
      expect((await preview()).status).toBe(404);
      expect((await importTrail('0'.repeat(64))).status).toBe(404);
      expect(client.gpx).not.toHaveBeenCalled();
    });
  });

  describe('checking the source of a snapshot (MF-03)', () => {
    const check = (placeId: number, userId = OWNER) =>
      request(server).post(`/api/trips/5/tours/wanderer/sources/${placeId}/check`).set(as(userId));
    const imported = async () => {
      await connect();
      const res = await importTrail((await preview()).body.contentHash);
      expect(res.status).toBe(201);
      return res.body.tour.place_id as number;
    };

    it('an unchanged trail says so and offers nothing to take in; the check writes nothing', async () => {
      const placeId = await imported();
      const before = await countRows(orm, Places);
      const res = await check(placeId);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        state: 'unchanged',
        changes: [],
        externalUpdated: RECORD.updated,
        importedUpdated: RECORD.updated,
        editedLocally: false,
        reimport: null,
      });
      expect(await countRows(orm, Places)).toBe(before);
    });

    it('a changed trail names what changed, and its hash takes it in as a new snapshot beside the old one', async () => {
      const placeId = await imported();
      client.trail.mockResolvedValue({ ...RECORD, name: 'Partnachklamm (new route)', updated: '2026-10-14' });
      const res = await check(placeId);
      expect(res.body).toMatchObject({
        state: 'changed',
        changes: ['name'],
        externalUpdated: '2026-10-14',
        importedUpdated: '2026-10-01',
        reimport: { trailId: HIT.id },
      });
      const again = await importTrail(res.body.reimport.contentHash);
      expect(again.status).toBe(201);
      expect(again.body.tour.place_id).not.toBe(placeId);
      expect(await countRows(orm, Places)).toBe(2);
    });

    it('a trail that is gone or no longer the caller own leaves the snapshot alone', async () => {
      const placeId = await imported();
      client.searchById.mockResolvedValue(null);
      expect((await check(placeId)).body).toMatchObject({ state: 'unavailable', reimport: null });
      client.searchById.mockResolvedValue(HIT);
      client.trail.mockResolvedValue({ ...RECORD, author: 'someone-else' });
      expect((await check(placeId)).body).toMatchObject({ state: 'unavailable', reimport: null });
      expect(await countRows(orm, Places)).toBe(1);
    });

    it('a trail that lost its track cannot be compared, and the check says why', async () => {
      const placeId = await imported();
      client.gpx.mockResolvedValue('<?xml version="1.0"?><gpx version="1.1"><wpt lat="47" lon="11"/></gpx>');
      const res = await check(placeId);
      expect(res.status).toBe(422);
      expect(res.body).toMatchObject({ code: 'no_track' });
      expect(await countRows(orm, Places)).toBe(1);
    });

    it('a trail without a change date still compares, and names no date', async () => {
      const placeId = await imported();
      client.trail.mockResolvedValue({ ...RECORD, updated: undefined });
      expect((await check(placeId)).body).toMatchObject({ state: 'unchanged', externalUpdated: null });
    });

    it('without a connection, or one to another instance, there is nothing to ask', async () => {
      const placeId = await imported();
      await request(server)
        .put('/api/integrations/wanderer/settings')
        .set(as(OWNER))
        .send({ url: 'https://other.example.org/', token: TOKEN });
      expect((await check(placeId)).body).toMatchObject({ state: 'other_instance' });
      await request(server).delete('/api/integrations/wanderer/settings').set(as(OWNER));
      expect((await check(placeId)).body).toMatchObject({ state: 'not_connected' });
    });

    it('a snapshot without its import record cannot be compared, the current trail can still come in', async () => {
      const placeId = await imported();
      await deleteRows(orm, TourSources, { place: placeId });
      expect((await check(placeId)).body).toMatchObject({
        state: 'unknown',
        editedLocally: null,
        reimport: { trailId: HIT.id },
      });
    });

    it('only a wanderer snapshot of the trip is checked, and only by who may add places', async () => {
      const placeId = await imported();
      expect((await check(placeId, VIEWER)).status).toBe(403);
      expect((await check(999_999)).status).toBe(404);
      expect((await request(server).post('/api/trips/5/tours/wanderer/sources/abc/check').set(as(OWNER))).status).toBe(
        404,
      );
      const planned = await request(server)
        .post('/api/trips/5/tours')
        .set(as(OWNER))
        .send({
          name: 'Drawn',
          tour_type: 'hike',
          route_geometry: [
            [47.45, 11.1, 700],
            [47.46, 11.11, 800],
          ],
          waypoints: [
            { lat: 47.45, lng: 11.1, role: 'start', sequence: 0 },
            { lat: 47.46, lng: 11.11, role: 'end', sequence: 1 },
          ],
        });
      const res = await check(planned.body.tour.place_id as number);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code: 'no_source' });
    });

    it('a wanderer import says where it came from in its detail (P2C-02)', async () => {
      const placeId = await imported();
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set(as(OWNER));
      expect(detail.body.provenance).toMatchObject({
        origin: 'wanderer',
        source: {
          kind: 'wanderer',
          instance: 'https://wanderer.example.org',
          externalId: HIT.id,
          externalUpdated: RECORD.updated,
        },
        editedLocally: false,
      });
      expect(detail.body.provenance.source.importedAt).toEqual(expect.any(String));
    });
  });
});
