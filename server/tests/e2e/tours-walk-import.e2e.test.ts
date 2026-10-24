/**
 * Tours e2e for the Google Maps walk import (CW-06, CW-07): POST
 * /api/trips/:tripId/tours/import/google-maps/preview through the real
 * AddonGuard, JwtAuthGuard and TripAccessGuard, the Zod pipe and the response
 * contract, against a migrated and seeded temp SQLite db. The short link
 * resolver is the real one; only the name lookup and the global fetch are
 * stubbed, so no request leaves the test and every one it would make is seen.
 *
 * Fixtures: user 1 owns trip 5, user 2 is a member whom the permission spy
 * denies 'place_edit', user 3 has no access to the trip.
 */
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { MapsService } from '../../src/nest/maps/maps.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { PORTO_RIBEIRA } from '../fixtures/google-maps-walks';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows, insertRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';
import { WALK_IMPORT_URL_MAX } from '@trek/shared';

import cookieParser from 'cookie-parser';
import dns from 'dns/promises';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type MockInstance } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
vi.mock('dns/promises', () => ({ default: { lookup: vi.fn() }, lookup: vi.fn() }));

const { journeyHooks } = vi.hoisted(() => ({
  journeyHooks: {
    reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined),
    onPlaceCreated: vi.fn().mockResolvedValue(undefined),
    onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
    onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
  },
}));

const db = createSnapshotTestDb();
// The map search is never asked: a stop without a position is not looked up.
const maps = { geocodeQuery: vi.fn(), reverseGeocode: vi.fn(), searchPlaces: vi.fn(), poisAlong: vi.fn() };
const realtime = new FakeRealtimeService();
const lookup = vi.mocked(dns.lookup);

let orm: TestOrm;
let checkPermission: MockInstance;

const OWNER = 1;
const VIEWER = 2;
const OUTSIDER = 3;
const SHORT = 'https://maps.app.goo.gl/gwKHfs8TNxShEBBk7';
const ROUTE = 'https://www.google.com/maps/dir/Cathedral/Market/@48.1,11.5,15z/data=';
/** The requests one after another: supertest opens a listener of its own for each. */
function inTurn<T, R>(items: readonly T[], run: (item: T) => Promise<R>): Promise<R[]> {
  return items.reduce<Promise<R[]>>(
    (previous, item) => previous.then(async (done) => [...done, await run(item)]),
    Promise.resolve([]),
  );
}
const BLOCKS = '!1m5!1m1!1s0x0:0x0!2m2!1d11.5!2d48.1!1m5!1m1!1s0x0:0x0!2m2!1d11.51!2d48.11';

describe('Tours walk import e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        ToursModule,
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(JourneyDomainService)
      .useValue(journeyHooks)
      .overrideProvider(MapsService)
      .useValue(maps)
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  const preview = (userId: number | null, body: unknown, tripId = 5) => {
    const req = request(server).post(`/api/trips/${tripId}/tours/import/google-maps/preview`);
    return (userId === null ? req : req.set('Cookie', sessionCookie(userId))).send(body as object);
  };

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: the session cookies sign for exactly these users.
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, {
      id: 3,
      username: 'outsider',
      email: 'outsider@example.test',
      role: 'user',
      password_version: 0,
    });
    await insertRows(orm, Trips, [{ id: 5, user: 1, title: 'Porto' }]);
    await addTripMember(orm, 5, 2);
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    checkPermission.mockImplementation(
      (action: string, _role: string, _owner: number, userId: number) =>
        !(action === 'place_edit' && userId === VIEWER),
    );
    await setAddonEnabled(orm, 'tours', true);
    lookup.mockResolvedValue([{ address: '142.250.185.14', family: 4 }] as never);
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    for (const fn of Object.values(maps)) fn.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    lookup.mockReset();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session, 404 outside the trip or while the addon is off, 403 without place_edit', async () => {
    const body = { url: PORTO_RIBEIRA };
    expect((await preview(null, body)).status).toBe(401);
    expect((await preview(OUTSIDER, body)).status).toBe(404);
    expect((await preview(VIEWER, body)).status).toBe(403);
    await setAddonEnabled(orm, 'tours', false);
    const off = await preview(OWNER, body);
    expect([off.status, off.body]).toEqual([404, { error: 'Tours addon is not enabled' }]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('400 from the contract for an empty link, one longer than a link may be, or a field it does not know', async () => {
    const bodies = [{ url: '   ' }, { url: 'x'.repeat(WALK_IMPORT_URL_MAX + 1) }, { url: SHORT, mode: 'walk' }, {}];
    const answers = await inTurn(bodies, async (body) => await preview(OWNER, body));
    expect(answers.map((res) => res.status)).toEqual([400, 400, 400, 400]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('200 for a long walking link: its stops in order, with nothing asked of the network and nothing stored', async () => {
    const res = await preview(OWNER, { url: PORTO_RIBEIRA });
    expect(res.status).toBe(200);
    expect(res.body.resolved_url).toBe(PORTO_RIBEIRA);
    expect(res.body.stations).toHaveLength(5);
    expect(res.body.stations[0]).toEqual({
      name: 'Igreja de Santa Clara, Largo Primeiro de Dezembro, 4000-404 Porto, Portugal',
      lat: 41.1425899,
      lng: -8.6092477,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
    expect(await countRows(orm, Places, {})).toBe(0);
    expect(await countRows(orm, Tours, {})).toBe(0);
    expect(realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('400 with its reason for a car route, a link that does not say, no route and no Google Maps link', async () => {
    const cases: Array<[string, string]> = [
      [`${ROUTE}!4m14!4m13${BLOCKS}!3e0`, 'not_walking'],
      [`${ROUTE}!4m13!4m12${BLOCKS}`, 'mode_unknown'],
      ['https://www.google.com/maps/place/Cathedral/@48.1,11.5,17z', 'not_a_route'],
      ['https://example.com/maps/dir/Cathedral/Market/data=!3e2', 'not_google_maps'],
    ];
    const answers = await inTurn(cases, async ([url]) => await preview(OWNER, { url }));
    expect(answers.map((res) => [res.status, res.body.reason])).toEqual(cases.map(([, reason]) => [400, reason]));
    for (const res of answers) expect(typeof res.body.error).toBe('string');
    expect(fetchSpy).not.toHaveBeenCalled();
    for (const fn of Object.values(maps)) expect(fn).not.toHaveBeenCalled();
  });

  it('follows a short link one hop to Google Maps, and refuses one that leads elsewhere after that one request', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: PORTO_RIBEIRA } }));
    const res = await preview(OWNER, { url: SHORT });
    expect(res.status).toBe(200);
    expect(res.body.resolved_url).toBe(PORTO_RIBEIRA);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockReset();
    fetchSpy.mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: 'https://example.com/maps/dir/A/B/data=!3e2' } }),
    );
    const elsewhere = await preview(OWNER, { url: SHORT });
    expect([elsewhere.status, elsewhere.body.reason]).toEqual([400, 'short_link_refused']);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('502 when the short link cannot be followed, and nothing stored', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('fetch failed'));
    const res = await preview(OWNER, { url: SHORT });
    expect(res.status).toBe(502);
    expect(res.body).toEqual({
      error: 'The short link could not be followed just now. Try again, or paste the long link.',
      reason: 'short_link_failed',
    });
    expect(await countRows(orm, Tours, {})).toBe(0);
  });

  it('502 when the short link name does not resolve just now, and 400 when Google does not know the link', async () => {
    lookup.mockRejectedValue(Object.assign(new Error('getaddrinfo EAI_AGAIN maps.app.goo.gl'), { code: 'EAI_AGAIN' }));
    const offline = await preview(OWNER, { url: SHORT });
    expect([offline.status, offline.body.reason]).toEqual([502, 'short_link_failed']);
    expect(fetchSpy).not.toHaveBeenCalled();

    lookup.mockResolvedValue([{ address: '142.250.185.14', family: 4 }] as never);
    fetchSpy.mockResolvedValueOnce(new Response('not found', { status: 404 }));
    const unknown = await preview(OWNER, { url: SHORT });
    expect(unknown.status).toBe(400);
    expect(unknown.body).toEqual({
      error: 'Google Maps does not know that short link. Share the route in Google Maps again.',
      reason: 'short_link_unknown',
    });
    expect(await countRows(orm, Tours, {})).toBe(0);
  });
});
