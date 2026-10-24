/**
 * Tours e2e for the assistant's edits of a saved tour (P8, P9): a hike saved
 * over REST, its words and breaks, its colour and a copy changed over MCP and
 * read back over REST; a city walk's station edited through a confirmed
 * change without the router; the writes refused without 'place_edit'. Through
 * the real JwtAuthGuard, AddonGuard and TripAccessGuard against a migrated and
 * seeded temp SQLite db; the MCP tools run in a request context as the
 * transport runs them, and the broadcast goes to a FakeRealtimeService.
 *
 * Fixtures: user 1 owns trip 5, user 2 is a member of it whom the permission
 * spy denies 'place_edit'.
 */
import { Places } from '../../src/db/entities/Places.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../src/mcp/nest-mcp-policy';
import { createTestRegistry, type McpContext } from '../../src/nest-mcp';
import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { withRequestContext } from '../../src/nest/database/request-context';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { PlacesModule } from '../../src/nest/places/places.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { RoadtripRouterService } from '../../src/nest/roadtrip/roadtrip-router.service';
import { proposalIdOf } from '../../src/nest/tours/tour-change-proposal';
import { TourChangeMcp } from '../../src/nest/tours/tour-change.mcp';
import { TourEditMcp } from '../../src/nest/tours/tour-edit.mcp';
import { TourSportWritesMcp } from '../../src/nest/tours/tour-sport-writes.mcp';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { deleteRows, insertRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';
import type { TourChange } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const { journeyHooks } = vi.hoisted(() => ({
  journeyHooks: {
    reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined),
    onPlaceCreated: vi.fn().mockResolvedValue(undefined),
    onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
    onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
  },
}));

const db = createSnapshotTestDb();
const realtime = new FakeRealtimeService();

let orm: TestOrm;
let checkPermission: MockInstance;
let routeOnFoot: MockInstance;

const OWNER = 1;
const VIEWER = 2;

const LINE = [
  [47, 11, 600],
  [47.01, 11.01, 700],
  [47.02, 11.02, 650],
];

const hikeBody = () => ({
  name: 'Ridge',
  route_geometry: LINE,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 2,
  duration_seconds: 3600,
});

const walkBody = () => ({
  name: 'Old town',
  tour_type: 'walk',
  route_geometry: [
    [48.1, 11.5, 520],
    [48.108, 11.5, 525],
  ],
  waypoints: [
    { lat: 48.1, lng: 11.5, role: 'start', sequence: 0, key: 'walk-gate', name: 'Gate' },
    { lat: 48.108, lng: 11.5, role: 'end', sequence: 1, key: 'walk-park', name: 'Park' },
  ],
  duration_seconds: 900,
});

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

describe('Tours e2e: the assistant edits a saved tour (P8, P9)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        ToursModule,
        PlacesModule,
        AssignmentsModule,
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(JourneyDomainService)
      .useValue(journeyHooks)
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await insertRows(orm, Trips, [{ id: 5, user: 1, title: 'Alps' }]);
    await addTripMember(orm, 5, 2);
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    routeOnFoot = vi.spyOn(app.get(RoadtripRouterService), 'route');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    checkPermission.mockImplementation(
      (action: string, _role: string, _owner: number, userId: number) =>
        !(action === 'place_edit' && userId === VIEWER),
    );
    routeOnFoot.mockReset().mockRejectedValue(new Error('no routing host in this test'));
    await setAddonEnabled(orm, 'tours', true);
    realtime.broadcastMock.mockClear();
    await deleteRows(orm, Places);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  const cookie = (userId = OWNER) => sessionCookie(userId);

  /** A tool run as the transport runs it: in a request context of its own. */
  const run = (call: () => Promise<ToolResult>) =>
    withRequestContext(app.get(MikroORM), async () => {
      const result = await call();
      const text = result.content[0]?.text ?? '';
      return result.isError ? { error: text } : JSON.parse(text);
    });
  const as = (userId: number) => ({ userId }) as McpContext;

  const saveTour = async (body: Record<string, unknown>) => {
    const res = await request(server).post('/api/trips/5/tours').set('Cookie', cookie()).send(body);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };
  const tourOf = async (placeId: number) => {
    const res = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie());
    expect(res.status).toBe(200);
    return res.body;
  };

  it('registers both controllers under the trip access policy', () => {
    expect(() =>
      createTestRegistry([app.get(TourEditMcp), app.get(TourSportWritesMcp)], {
        accessPolicy: trekMcpAccessPolicy,
        validateAccess: trekMcpValidateAccess,
      }),
    ).not.toThrow();
  });

  it('the words and breaks changed over MCP are what the planner reads, and its stale save is refused', async () => {
    const placeId = await saveTour(hikeBody());
    const changed = await run(() =>
      app.get(TourEditMcp).updateTourDetails(
        {
          tripId: 5,
          placeId,
          expected_revision: 1,
          website: 'https://ridge.example/',
          break_additional_minutes: 40,
        },
        as(OWNER),
      ),
    );
    expect(changed.tour).toMatchObject({ revision: 2, website: 'https://ridge.example/' });
    const detail = await tourOf(placeId);
    expect(detail.tour).toMatchObject({ website: 'https://ridge.example/', break_additional_minutes: 40, revision: 2 });
    expect(detail.waypoints).toHaveLength(2);
    const stale = await request(server)
      .put(`/api/trips/5/tours/${placeId}`)
      .set('Cookie', cookie())
      .send({ ...hikeBody(), expected_revision: 1 });
    expect(stale.status).toBe(409);
  });

  it('a colour set and a copy made over MCP show over REST', async () => {
    const placeId = await saveTour(hikeBody());
    await run(() => app.get(TourEditMcp).setTourRouteColor({ tripId: 5, placeId, route_color: '#e11d48' }, as(OWNER)));
    const place = await request(server).get(`/api/trips/5/places/${placeId}`).set('Cookie', cookie());
    expect(place.body.place.route_color).toBe('#e11d48');
    const copy = await run(() =>
      app.get(TourEditMcp).copyTour({ tripId: 5, placeId, name: 'Ridge (short)' }, as(OWNER)),
    );
    const list = await request(server).get('/api/trips/5/tours').set('Cookie', cookie());
    expect(list.body.tours.map((tour: { name: string }) => tour.name).sort()).toEqual(['Ridge', 'Ridge (short)']);
    expect(copy.tour.derived_from_place_id).toBe(placeId);
  });

  it("a station's stay edited through a confirmed change keeps the walk's way without the router", async () => {
    const placeId = await saveTour(walkBody());
    const changes: TourChange[] = [{ op: 'edit', key: 'walk-park', stay_minutes: 30, importance: 'must' }];
    const saved = await run(() =>
      app.get(TourChangeMcp).saveTourChange(
        {
          tripId: 5,
          placeId,
          changes,
          expected_revision: 1,
          proposal_id: proposalIdOf({ tripId: 5, placeId, revision: 1, changes }),
          confirmed: true,
        },
        as(OWNER),
      ),
    );
    expect(saved).toMatchObject({ saved: true, tour: { route_pending: false, walking_minutes: 15 } });
    expect(routeOnFoot).not.toHaveBeenCalled();
    const detail = await tourOf(placeId);
    expect(detail.waypoints[1]).toMatchObject({ key: 'walk-park', stay_minutes: 30, importance: 'must' });
  });

  it('a member without place_edit changes nothing, over MCP as over REST', async () => {
    const placeId = await saveTour(hikeBody());
    const refused = await run(() =>
      app.get(TourEditMcp).updateTourDetails({ tripId: 5, placeId, expected_revision: 1, name: 'Mine' }, as(VIEWER)),
    );
    expect(refused).toHaveProperty('error');
    const ski = await run(() =>
      app.get(TourSportWritesMcp).classifySkiTrack({ tripId: 5, placeId, ski_discipline: 'snowshoe' }, as(VIEWER)),
    );
    expect(ski).toHaveProperty('error');
    const rest = await request(server)
      .put(`/api/trips/5/tours/${placeId}/ski`)
      .set('Cookie', cookie(VIEWER))
      .send({ ski_discipline: 'snowshoe' });
    expect(rest.status).toBe(403);
    expect((await tourOf(placeId)).tour).toMatchObject({ name: 'Ridge', revision: 1 });
  });
});
