/**
 * Recorded days a journey keeps (JRN-01), through the real AddonGuard and
 * JwtAuthGuard against a migrated and seeded temp SQLite db, every answer
 * checked against its response contract. The Dawarich client is the one
 * thing replaced: a test never opens a socket to a location archive. The
 * broadcasts go to a FakeRealtimeService.
 *
 * Fixtures: user 1 owns journey 7 and has a Dawarich connection, user 2 is an
 * editor of it with no connection, user 3 a viewer, user 4 has no access.
 *
 * The walk: preview, keep, read the day back once the connection is gone,
 * take the same day over again without a second copy, replace it on purpose,
 * keep the version when Dawarich fails, and drop it. Then the preparation of
 * the journey's days (JRN-03) as each caller sees it.
 */
import { DawarichConnections } from '../../src/db/entities/DawarichConnections.entity';
import { JourneyRecordedDays } from '../../src/db/entities/JourneyRecordedDays.entity';
import { Journeys } from '../../src/db/entities/Journeys.entity';
import { encrypt_api_key } from '../../src/nest/common/crypto/apiKeyCrypto';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { withRequestContext } from '../../src/nest/database/request-context';
import { DawarichSyncService } from '../../src/nest/integrations/dawarich-sync.service';
import { DawarichClient, DawarichError } from '../../src/nest/integrations/dawarich.client';
import { JourneyRecordingsModule } from '../../src/nest/journey-recordings/journey-recordings.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { addJourneyContributor, linkTripToJourney, makeJourney } from '../helpers/factories/journeys';
import { countRows, deleteRows, insertRow, updateRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
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
const realtime = new FakeRealtimeService();
const client = {
  probe: vi.fn(),
  listVisits: vi.fn(),
  listTracks: vi.fn(),
  listPoints: vi.fn(),
  listVisitedCities: vi.fn(),
  findVisitsNear: vi.fn(),
};

let orm: TestOrm;
let journeyId: number;

const OWNER = 1;
const EDITOR = 2;
const VIEWER = 3;
const OUTSIDER = 4;
const DAY = '2026-05-14';

/** A walk across Venice on the 14th, in the zone Dawarich records in. */
function walk(endLng = 12.3218) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [12.3388, 45.434],
        [endLng, 45.4364],
      ],
    },
    properties: {
      start_at: `${DAY}T09:00:00+02:00`,
      end_at: `${DAY}T09:40:00+02:00`,
      dominant_mode: 'walking',
      distance: 1500,
    },
  };
}

describe('Journey recordings e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        JourneyRecordingsModule,
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(DawarichClient)
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
  const base = () => `/api/journeys/${journeyId}/recordings`;

  const preview = (userId = OWNER) =>
    request(server)
      .post(`${base()}/preview`)
      .set(as(userId))
      .send({ date: DAY, utcOffsetMinutes: 0, useSourceOffset: true });

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: the session cookies sign for exactly these users.
    const user = (id: number, username: string) =>
      makeUser(orm, { id, username, email: `${username}@example.test`, role: 'user', password_version: 0 });
    await user(OWNER, 'marta');
    await user(EDITOR, 'jonas');
    await user(VIEWER, 'viewer');
    await user(OUTSIDER, 'outsider');
    const journey = await makeJourney(orm, OWNER, { title: 'Venice' });
    journeyId = journey.id;
    await addJourneyContributor(orm, journeyId, EDITOR, 'editor');
    await addJourneyContributor(orm, journeyId, VIEWER, 'viewer');
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await setAddonEnabled(orm, 'journey', true);
    await setAddonEnabled(orm, 'dawarich', true);
    await deleteRows(orm, JourneyRecordedDays);
    await deleteRows(orm, DawarichConnections);
    await insertRow(orm, DawarichConnections, {
      user: OWNER,
      url: 'https://dawarich.example',
      api_key: encrypt_api_key('secret-key'),
    });
    for (const fn of Object.values(client)) fn.mockReset();
    client.listTracks.mockResolvedValue({ features: [walk()], truncated: false });
    client.listPoints.mockResolvedValue({ points: [], truncated: false });
    realtime.broadcastToUserMock.mockClear();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('answers 404 with the Journey addon off before asking who the caller is, and 401 without a session', async () => {
    await setAddonEnabled(orm, 'journey', false);
    expect((await request(server).get(base())).status).toBe(404);
    await setAddonEnabled(orm, 'journey', true);
    expect((await request(server).get(base())).status).toBe(401);
  });

  it('previews the day for the journey without keeping it, then keeps it on the word of the traveller', async () => {
    const shown = await preview();
    expect(shown.status).toBe(200);
    expect(shown.body).toMatchObject({
      journey: { id: journeyId, title: 'Venice' },
      date: DAY,
      utcOffsetMinutes: 120,
      offsetSource: 'source',
      window: { from: '2026-05-13T22:00:00.000Z', to: '2026-05-14T22:00:00.000Z' },
      sourceKind: 'tracks',
      stats: { distanceMeters: 1500, segmentCount: 1, gapCount: 0, modes: ['walking'] },
      stored: null,
      audience: 2,
    });
    expect(await countRows(orm, JourneyRecordedDays)).toBe(0);

    const kept = await request(server)
      .put(`${base()}/${DAY}`)
      .set(as(OWNER))
      .set('X-Socket-Id', '11')
      .send({ utcOffsetMinutes: 120, expectedHash: shown.body.contentHash });
    expect(kept.status).toBe(200);
    expect(kept.body).toMatchObject({ outcome: 'created', day: { date: DAY, importedBy: { username: 'marta' } } });
    expect(realtime.broadcastToUserMock).toHaveBeenCalledWith(
      VIEWER,
      { type: 'journey:recording:updated', journeyId, date: DAY },
      '11',
    );
  });

  it('keeps the day readable for every member once the connection is gone, and never copies it twice', async () => {
    const shown = await preview();
    const body = { utcOffsetMinutes: 120, expectedHash: shown.body.contentHash };
    await request(server).put(`${base()}/${DAY}`).set(as(OWNER)).send(body);

    const again = await request(server).put(`${base()}/${DAY}`).set(as(OWNER)).send(body);
    expect(again.status).toBe(200);
    expect(again.body.outcome).toBe('unchanged');
    expect(await countRows(orm, JourneyRecordedDays)).toBe(1);

    await deleteRows(orm, DawarichConnections);
    await setAddonEnabled(orm, 'dawarich', false);
    client.listTracks.mockReset();
    const listed = await request(server).get(base()).set(as(VIEWER));
    expect(listed.status).toBe(200);
    expect(listed.body.days).toHaveLength(1);
    expect(listed.body.days[0]).toMatchObject({ date: DAY, segments: [{ mode: 'walking' }] });
    expect(client.listTracks).not.toHaveBeenCalled();
    expect((await request(server).get(base()).set(as(OUTSIDER))).status).toBe(404);
  });

  it('replaces a kept day only when asked, and a failing Dawarich leaves the kept version as it was', async () => {
    const first = await preview();
    await request(server)
      .put(`${base()}/${DAY}`)
      .set(as(OWNER))
      .send({ utcOffsetMinutes: 120, expectedHash: first.body.contentHash });

    client.listTracks.mockResolvedValue({ features: [walk(12.3), walk(12.31)], truncated: false });
    const grown = await preview();
    expect(grown.body).toMatchObject({ sameAsStored: false, stored: { stats: { segmentCount: 1 } } });
    const body = { utcOffsetMinutes: 120, expectedHash: grown.body.contentHash };

    const refused = await request(server).put(`${base()}/${DAY}`).set(as(OWNER)).send(body);
    expect(refused.status).toBe(409);
    expect(refused.body).toEqual({
      error: 'The journey already keeps another recording of that day',
      code: 'recording_exists',
    });

    client.listTracks.mockRejectedValue(new DawarichError('server_error', 'Dawarich answered HTTP 500', 500));
    client.listPoints.mockRejectedValue(new DawarichError('server_error', 'Dawarich answered HTTP 500', 500));
    const failed = await request(server)
      .put(`${base()}/${DAY}`)
      .set(as(OWNER))
      .send({ ...body, replace: true });
    expect(failed.status).toBe(502);
    expect(failed.body).toMatchObject({ code: 'server_error' });
    const unchanged = await request(server).get(base()).set(as(OWNER));
    expect(unchanged.body.days[0].contentHash).toBe(first.body.contentHash);

    client.listTracks.mockResolvedValue({ features: [walk(12.3), walk(12.31)], truncated: false });
    const replaced = await request(server)
      .put(`${base()}/${DAY}`)
      .set(as(OWNER))
      .send({ ...body, replace: true });
    expect(replaced.status).toBe(200);
    expect(replaced.body.outcome).toBe('replaced');
    expect(await countRows(orm, JourneyRecordedDays)).toBe(1);
  });

  it('an editor without a connection is told so, a viewer may not preview, and a bad body or day is a 400', async () => {
    const unconnected = await preview(EDITOR);
    expect(unconnected.status).toBe(409);
    expect(unconnected.body).toEqual({ error: 'Dawarich is not connected', code: 'not_connected' });

    expect((await preview(VIEWER)).status).toBe(403);
    expect((await preview(OUTSIDER)).status).toBe(404);

    const badBody = await request(server)
      .post(`${base()}/preview`)
      .set(as(OWNER))
      .send({ date: DAY, utcOffsetMinutes: 2000 });
    expect(badBody.status).toBe(400);
    const badDay = await request(server)
      .put(`${base()}/2026-13-01`)
      .set(as(OWNER))
      .send({ utcOffsetMinutes: 0, expectedHash: 'a'.repeat(64) });
    expect(badDay.status).toBe(400);
    expect(badDay.body).toEqual({ error: 'Invalid date' });
  });

  it('drops a kept day for an editor, with Dawarich off, and a second drop is a 404', async () => {
    const shown = await preview();
    await request(server)
      .put(`${base()}/${DAY}`)
      .set(as(OWNER))
      .send({ utcOffsetMinutes: 120, expectedHash: shown.body.contentHash });
    await setAddonEnabled(orm, 'dawarich', false);

    expect((await request(server).delete(`${base()}/${DAY}`).set(as(VIEWER))).status).toBe(403);
    const dropped = await request(server).delete(`${base()}/${DAY}`).set(as(EDITOR));
    expect(dropped.status).toBe(200);
    expect(dropped.body).toEqual({ success: true });
    expect(await countRows(orm, JourneyRecordedDays)).toBe(0);
    expect((await request(server).delete(`${base()}/${DAY}`).set(as(EDITOR))).status).toBe(404);
  });

  it('reports how the journey prepares its days for each caller, off at first and after a sync run once on', async () => {
    const off = await request(server).get(`${base()}/prep`).set(as(OWNER));
    expect(off.status).toBe(200);
    expect(off.body).toEqual({
      enabled: false,
      connection: 'ready',
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
    });

    const today = new Date().toISOString().slice(0, 10);
    const trip = await makeTrip(orm, OWNER, { start_date: today, end_date: today });
    await linkTripToJourney(orm, journeyId, trip.id);
    await updateRows(orm, Journeys, { id: journeyId }, { auto_prepare_recordings: 1 });
    client.listVisits.mockResolvedValue({ visits: [], truncated: false, version: null });
    // The cron runs the sync in a request context of its own; called here, the test gives it one.
    await withRequestContext(app.get(MikroORM), () => app.get(DawarichSyncService).syncUser(OWNER));

    const on = await request(server).get(`${base()}/prep`).set(as(OWNER));
    expect(on.body).toMatchObject({ enabled: true, connection: 'ready', lastError: null });
    expect(on.body.lastSuccessAt).toEqual(expect.any(String));
    expect((await request(server).get(`${base()}/prep`).set(as(EDITOR))).body).toMatchObject({
      enabled: true,
      connection: 'not_connected',
      lastSuccessAt: null,
    });
    expect((await request(server).get(`${base()}/prep`).set(as(VIEWER))).status).toBe(403);
    expect((await request(server).get(`${base()}/prep`).set(as(OUTSIDER))).status).toBe(404);
  });
});
