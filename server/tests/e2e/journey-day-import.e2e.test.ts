/**
 * A recorded day taken into a journey with its stays (JRN-02), through the
 * real AddonGuard, JwtAuthGuard and Zod pipe against a migrated and seeded
 * temp SQLite db, every answer checked against its response contract. The
 * Dawarich client is the one thing replaced: a test never opens a socket to a
 * location archive. The broadcasts go to a FakeRealtimeService.
 *
 * Fixtures: user 1 owns journey 7 and has a Dawarich connection, user 2 is an
 * editor of it with a connection of their own, user 3 a viewer.
 *
 * The walk: review the day, take two stays over as one entry and leave the
 * parking out, send the same take-over again without a second copy, and be
 * refused for a stay that is not the caller's or a group the contract refuses.
 * The drafts written stay off the journey's public share.
 */
import { DawarichConnections } from '../../src/db/entities/DawarichConnections.entity';
import { DawarichVisitSuggestions } from '../../src/db/entities/DawarichVisitSuggestions.entity';
import { JourneyEntries } from '../../src/db/entities/JourneyEntries.entity';
import { JourneyEntryStays } from '../../src/db/entities/JourneyEntryStays.entity';
import { encrypt_api_key } from '../../src/nest/common/crypto/apiKeyCrypto';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { withRequestContext } from '../../src/nest/database/request-context';
import { DawarichClient } from '../../src/nest/integrations/dawarich.client';
import { JourneyRecordingsModule } from '../../src/nest/journey-recordings/journey-recordings.module';
import { JourneyShareService } from '../../src/nest/journey/journey-share.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { addJourneyContributor, makeJourney, makeJourneyEntry } from '../helpers/factories/journeys';
import { countRows, deleteRows, findRows, insertRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
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
const DAY = '2026-05-14';

function visit(id: number, name: string, from: string, to: string) {
  return {
    id,
    area_id: null,
    started_at: `${DAY}T${from}:00+02:00`,
    ended_at: `${DAY}T${to}:00+02:00`,
    duration: null,
    name,
    status: 'suggested',
    confidence: 70,
    confidence_band: 'high',
    place: { latitude: 45.434, longitude: 12.3388, id: null },
  };
}

describe('Journey day take-over e2e (real guards + temp SQLite)', () => {
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
  const base = () => `/api/journeys/${journeyId}/recordings/${DAY}/stays`;
  const review = (userId = OWNER) => request(server).post(`${base()}/review`).set(as(userId)).send({});
  const takeOver = (body: object, userId = OWNER) =>
    request(server).post(`${base()}/import`).set(as(userId)).set('X-Socket-Id', '11').send(body);

  async function connect(userId: number) {
    await insertRow(orm, DawarichConnections, {
      user: userId,
      url: 'https://dawarich.example',
      api_key: encrypt_api_key('secret-key'),
    });
  }

  /** The suggestion ids of the caller's stays, in the order the review lists them. */
  async function reviewedIds(userId = OWNER): Promise<number[]> {
    const res = await review(userId);
    expect(res.status).toBe(200);
    return (res.body.stays as Array<{ suggestionId: number }>).map((stay) => stay.suggestionId);
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    const user = (id: number, username: string) =>
      makeUser(orm, { id, username, email: `${username}@example.test`, role: 'user', password_version: 0 });
    await user(OWNER, 'marta');
    await user(EDITOR, 'jonas');
    await user(VIEWER, 'viewer');
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
    await deleteRows(orm, JourneyEntries);
    await deleteRows(orm, DawarichVisitSuggestions);
    await deleteRows(orm, DawarichConnections);
    await connect(OWNER);
    await connect(EDITOR);
    for (const fn of Object.values(client)) fn.mockReset();
    client.listVisits.mockResolvedValue({
      visits: [
        visit(101, 'Parcheggio', '08:30', '08:40'),
        visit(102, 'Piazza San Marco', '09:10', '10:05'),
        visit(103, 'Piazza San Marco', '10:20', '11:40'),
      ],
      truncated: false,
      version: null,
    });
    realtime.broadcastToUserMock.mockClear();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('answers 404 with the Journey addon off before asking who the caller is, and 401 without a session', async () => {
    await setAddonEnabled(orm, 'journey', false);
    expect((await request(server).post(`${base()}/review`)).status).toBe(404);
    await setAddonEnabled(orm, 'journey', true);
    expect((await request(server).post(`${base()}/review`)).status).toBe(401);
  });

  it('reviews the day, then takes the square over as one draft and leaves the parking out, announced to the journey', async () => {
    const [parking, first, second] = await reviewedIds();
    const shown = await review();
    expect(shown.body).toMatchObject({
      journey: { id: journeyId, title: 'Venice' },
      date: DAY,
      fresh: true,
      audience: 2,
    });

    const res = await takeOver({
      groups: [
        {
          kind: 'merged',
          stays: [{ suggestionId: first }, { suggestionId: second }],
          title: 'Morning on San Marco',
          anchorSuggestionId: second,
        },
      ],
      skipSuggestionIds: [parking],
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      entries: [{ id: expect.any(Number), title: 'Morning on San Marco', stayCount: 2 }],
      alreadyTaken: [],
      skipped: [parking],
    });
    expect(await findRows(orm, JourneyEntries, { journey: journeyId })).toEqual([
      expect.objectContaining({ title: 'Morning on San Marco', is_draft: 1, entry_time: '09:10' }),
    ]);
    expect(await countRows(orm, JourneyEntryStays)).toBe(2);
    expect(realtime.broadcastToUserMock).toHaveBeenCalledWith(
      VIEWER,
      expect.objectContaining({ type: 'journey:entry:created', journeyId }),
      '11',
    );

    const after = await review();
    expect((after.body.stays as Array<{ status: string }>).map((stay) => stay.status)).toEqual([
      'skipped',
      'here',
      'here',
    ]);
  });

  it('sending the same take-over again writes nothing twice', async () => {
    const [, first] = await reviewedIds();
    const body = { groups: [{ kind: 'single', stays: [{ suggestionId: first }] }] };
    expect((await takeOver(body)).status).toBe(200);

    const again = await takeOver(body);

    expect(again.status).toBe(200);
    expect(again.body).toEqual({ entries: [], alreadyTaken: [first], skipped: [] });
    expect(await countRows(orm, JourneyEntries, { journey: journeyId })).toBe(1);
  });

  it("refuses a viewer, a stay that is not the caller's and a group the contract refuses, writing nothing", async () => {
    const [, first] = await reviewedIds();
    const [, theirs] = await reviewedIds(EDITOR);

    expect((await review(VIEWER)).status).toBe(403);
    const foreign = await takeOver({ groups: [{ kind: 'single', stays: [{ suggestionId: theirs }] }] });
    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual({ error: 'A stay is not one of yours on that day', code: 'stay_not_on_day' });
    const twice = await takeOver({
      groups: [
        { kind: 'single', stays: [{ suggestionId: first }] },
        { kind: 'single', stays: [{ suggestionId: first }] },
      ],
    });
    expect(twice.status).toBe(400);
    expect(
      (await request(server).post(`/api/journeys/${journeyId}/recordings/2026-02-30/stays/review`).set(as(OWNER)))
        .status,
    ).toBe(400);
    expect(await countRows(orm, JourneyEntries)).toBe(0);
  });

  it('the drafts of a take-over stay off the public share while what the journal published is on it', async () => {
    const [, first] = await reviewedIds();
    await makeJourneyEntry(orm, journeyId, OWNER, { title: 'Arrival', entry_date: DAY });
    expect((await takeOver({ groups: [{ kind: 'single', stays: [{ suggestionId: first }] }] })).status).toBe(200);
    const share = app.get(JourneyShareService, { strict: false });
    // Called beside a request, so the services get the request context a route would give them.
    const published = await withRequestContext(app.get(MikroORM), async () => {
      const link = await share.createOrUpdateJourneyShareLink(journeyId, OWNER, {
        share_timeline: true,
        share_map: true,
      });
      if (!link) throw new Error('no share link');
      return share.getPublicJourney(link.token);
    });

    expect(published?.entries.map((entry) => entry.title)).toEqual(['Arrival']);
    expect(published?.stats.entries).toBe(1);
  });
});
