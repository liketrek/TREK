import { RoadtripSearchService } from '../../src/nest/roadtrip/roadtrip-search.service';
import { GoogleRouteService } from '../../src/nest/roadtrip/google-route.service';
import { ChargingService } from '../../src/nest/roadtrip/charging.service';
/**
 * Road trip module e2e — the real guard chain against a real migrated-and-
 * seeded temp SQLite db (`createSnapshotTestDb()`, Plan 3d Task 1 — this used
 * to hand-roll ten CREATE TABLEs, a second hand-maintained schema copy that
 * omitted `day_assignments`/`day_accommodations`/most `users`/`trips`/
 * `places` columns and even LEFT JOINed the inverse 1:1 `roadtrip_day_tracks`
 * relation `Days` carries — the exact "e2e suites build their schema from
 * hand-written partial DDL" risk the plan's inventory §15c flagged, and the
 * same class of failure `days.e2e.test.ts`'s own conversion, Plan 3c Task 2,
 * fixed for that file). Every service in this module now runs its real SQL
 * through repositories (DI-injected, no service mock) against the real
 * request-scoped `EntityManager` `createTestMikroOrmModule` wires in; only
 * the permission check and the WebSocket broadcast stay mocked.
 *
 * The unit test next door pins the handler bodies. What only a booted container
 * can show is the thing the controller's own comment calls load-bearing: that
 * `@RequireAddon` does nothing on its own, so an instance with the addon
 * switched off has to answer 404 here, and has to do it before asking who is
 * calling. Delete AddonGuard from the chain and every case in the first block
 * below turns red.
 *
 * The addon ships disabled, so "off" is the state an existing install upgrades
 * into. That is what makes it worth a test rather than a comment.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RoadtripModule } from '../../src/nest/roadtrip/roadtrip.module';
import { RoadtripHazardsService } from '../../src/nest/roadtrip/roadtrip-hazards.service';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule } from '../helpers/test-orm';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

import { db } from '../../src/db/database';

const ADDON_ID = 'roadtrip';

function setAddon(enabled: boolean): void {
  // The seeder (`AddonSeeder`, run once as part of `createSnapshotTestDb()`'s
  // migration pass) already inserted this row, disabled — a plain UPDATE,
  // not an upsert, matching every other addon-toggling e2e in this file set.
  db.prepare('UPDATE addons SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, ADDON_ID);
}

describe('Roadtrip e2e (real guard chain + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let checkPermission: MockInstance;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, RoadtripModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // harness.ts's seedUser() omits password_hash, which the real migrated
    // schema requires NOT NULL (days.e2e.test.ts/assignments.e2e.test.ts's
    // own precedent) — raw inserts here instead, matching the SeededUser
    // shape id/role/password_version=0 that sessionCookie() needs.
    db.prepare("INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)").run();
    db.prepare("INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (2, 'other', 'other@example.test', 'x', 'user', 0)").run();
    db.prepare('INSERT INTO trips (id, user_id, title) VALUES (5, 1, ?)').run('Norway');
    db.prepare('INSERT INTO trips (id, user_id, title) VALUES (6, 2, ?)').run('Somebody else');
    db.prepare('INSERT INTO days (id, trip_id, day_number) VALUES (3, 5, 1)').run();
    db.prepare('INSERT INTO days (id, trip_id, day_number) VALUES (4, 6, 1)').run();
    // A track (a place carrying a route geometry) on each trip.
    db.prepare("INSERT INTO places (id, trip_id, name, route_geometry) VALUES (10, 5, 'Scenic', '[[1,2]]')").run();
    db.prepare("INSERT INTO places (id, trip_id, name, route_geometry) VALUES (11, 6, 'Theirs', '[[1,2]]')").run();
    // An ordinary place, which is not a track.
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (12, 5, 'Just a stop')").run();
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM roadtrip_vias').run();
    db.prepare('DELETE FROM roadtrip_day_tracks').run();
    checkPermission.mockReturnValue(true);
    setAddon(true);
  });

  afterAll(async () => {
    await app?.close();
  });

  const cookie = () => sessionCookie(1);
  it('gates charging data by addon and trip membership', async () => {
    const read = vi.spyOn(app.get(ChargingService), 'read').mockResolvedValue({} as never);
    try {
      await request(server).get('/api/trips/5/roadtrip/charging/10').expect(401);
      await request(server).get('/api/trips/6/roadtrip/charging/10').set('Cookie', cookie()).expect(404);
      await request(server).get('/api/trips/5/roadtrip/charging/10').set('Cookie', cookie()).expect(200);
      expect(read).toHaveBeenCalledWith(5, 10);
      setAddon(false);
      await request(server).get('/api/trips/5/roadtrip/charging/10').set('Cookie', cookie()).expect(404);
      expect(read).toHaveBeenCalledTimes(1);
    } finally { read.mockRestore(); }
  });
  // L3 (Plan 3d Task 7 review): unlike every other case in this file,
  // `ChargingService.read` is NOT mocked here — this is the one place CH1
  // (`PlacesRepository.findChargingProbe`) runs for real, through the whole
  // guard chain. Place 11 is a real row, just on trip 6, not trip 5 — the
  // gate answers "Place not found", the same shape a place that never
  // existed gets, never a leak of trip 6's row.
  it('CH1 — a place id that belongs to a DIFFERENT trip is "Place not found", not trip 6\'s row (real findChargingProbe, no service mock)', async () => {
    const res = await request(server).get('/api/trips/5/roadtrip/charging/11').set('Cookie', cookie());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Place not found' });
  });
  it('gates the coordinate lookup like the saved stop and validates before fetching', async () => {
    const lookup = vi.spyOn(app.get(ChargingService), 'lookup').mockResolvedValue({} as never);
    const body = { lat: 48.137, lng: 11.575, name: 'Ladepark Nord' };
    const post = () => request(server).post('/api/trips/5/roadtrip/charging-lookup').set('Cookie', cookie());
    try {
      await request(server).post('/api/trips/5/roadtrip/charging-lookup').send(body).expect(401);
      await request(server).post('/api/trips/6/roadtrip/charging-lookup').set('Cookie', cookie()).send(body).expect(404);
      await post().send({ ...body, lat: 91 }).expect(400);
      // A list is the shape a caller would reach for to fan a whole corridor out in one
      // request. There is no rate limiter here and each miss costs the upstream registry
      // several requests, so the contract refuses it before anything leaves the server.
      await post().send([body]).expect(400);
      expect(lookup).not.toHaveBeenCalled();
      await post().send(body).expect(200);
      expect(lookup).toHaveBeenCalledWith(48.137, 11.575, 'Ladepark Nord');
      setAddon(false);
      await post().send(body).expect(404);
      expect(lookup).toHaveBeenCalledTimes(1);
    } finally { lookup.mockRestore(); }
  });
  it('validates Google route preview and import before executing either service', async () => {
    const routes = app.get(GoogleRouteService);
    const preview = vi.spyOn(routes, 'preview').mockResolvedValue({ stops: [] });
    const save = vi.spyOn(routes, 'import').mockResolvedValue({ imported: 2 });
    const input = { dayId: 3, stops: [{ name: 'A', lat: 48, lng: 11 }, { name: 'B', lat: 41, lng: 12 }] };
    try {
      await request(server).post('/api/roadtrip/google-maps-preview').send({ url: 'https://google.com/maps/dir/A/B' }).expect(401);
      await request(server).post('/api/roadtrip/google-maps-preview').set('Cookie', cookie()).send({ url: 'bad' }).expect(400);
      await request(server).post('/api/roadtrip/google-maps-preview').set('Cookie', cookie()).send({ url: 'https://google.com/maps/dir/A/B' }).expect(200);
      await request(server).post('/api/trips/6/roadtrip/google-maps-import').set('Cookie', cookie()).send(input).expect(404);
      await request(server).post('/api/trips/5/roadtrip/google-maps-import').set('Cookie', cookie()).send({ ...input, stops: [{ name: 'A', lat: 999, lng: 0 }] }).expect(400);
      await request(server).post('/api/trips/5/roadtrip/google-maps-import').set('Cookie', cookie()).send(input).expect(200);
      expect(save).toHaveBeenCalledWith(5, 1, input, undefined);
      setAddon(false);
      await request(server).post('/api/trips/5/roadtrip/google-maps-import').set('Cookie', cookie()).send(input).expect(404);
      await request(server).post('/api/roadtrip/google-maps-preview').set('Cookie', cookie()).send({ url: 'https://google.com/maps/dir/A/B' }).expect(404);
      expect(save).toHaveBeenCalledTimes(1);
      expect(preview).toHaveBeenCalledTimes(1);
    } finally { preview.mockRestore(); save.mockRestore(); }
  });
  it('validates and gates area search before calling plugins', async () => {
    const search = vi.spyOn(app.get(RoadtripSearchService), 'search').mockResolvedValue({ pois: [], sources: [], failedSources: [], truncated: false, clamped: false });
    const input = { categories: ['fuel'], bbox: { south: 48, north: 49, west: 10, east: 11 } };
    try {
      await request(server).post('/api/roadtrip/search-area').send(input).expect(401);
      await request(server).post('/api/roadtrip/search-area').set('Cookie', cookie()).send({ ...input, categories: ['invalid'] }).expect(400);
      await request(server).post('/api/roadtrip/search-area').set('Cookie', cookie()).send(input).expect(200);
      expect(search).toHaveBeenCalledWith(input, 1);
      setAddon(false);
      await request(server).post('/api/roadtrip/search-area').set('Cookie', cookie()).send(input).expect(404);
      expect(search).toHaveBeenCalledTimes(1);
    } finally { search.mockRestore(); }
  });
  it('gates live hazards by addon, authentication and trip access', async () => {
    const read = vi.spyOn(app.get(RoadtripHazardsService), 'read').mockResolvedValue({ fetchedAt: new Date().toISOString(), hazards: [], sources: [] });
    try {
      await request(server).get('/api/trips/5/roadtrip/hazards').expect(401);
      await request(server).get('/api/trips/6/roadtrip/hazards').set('Cookie', cookie()).expect(404);
      await request(server).get('/api/trips/5/roadtrip/hazards').set('Cookie', cookie()).expect(200);
      setAddon(false);
      await request(server).get('/api/trips/5/roadtrip/hazards').set('Cookie', cookie()).expect(404);
      expect(read).toHaveBeenCalledTimes(1);
    } finally { read.mockRestore(); }
  });

  describe('shared trip driving preferences', () => {
    it('shares values with members and isolates other trips', async () => {
      db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (5, 2)').run();
      try {
        await request(server)
          .put('/api/trips/5/roadtrip/preferences')
          .set('Cookie', cookie())
          .send({ roadtrip_range_km: 120, roadtrip_day_start: '08:00', roadtrip_day_end: '18:00' })
          .expect(200);
        const member = await request(server)
          .get('/api/trips/5/roadtrip/preferences')
          .set('Cookie', sessionCookie(2))
          .expect(200);
        expect(member.body.preferences.roadtrip_range_km).toBe(120);
        await request(server)
          .put('/api/trips/5/roadtrip/preferences')
          .set('Cookie', sessionCookie(2))
          .send({ roadtrip_range_km: 160 })
          .expect(200);
        const owner = await request(server)
          .get('/api/trips/5/roadtrip/preferences')
          .set('Cookie', cookie())
          .expect(200);
        expect(owner.body.preferences.roadtrip_range_km).toBe(160);
        const other = await request(server)
          .get('/api/trips/6/roadtrip/preferences')
          .set('Cookie', sessionCookie(2))
          .expect(200);
        expect(other.body.preferences).toEqual({});
        checkPermission.mockReturnValue(false);
        await request(server)
          .put('/api/trips/5/roadtrip/preferences')
          .set('Cookie', sessionCookie(2))
          .send({ roadtrip_range_km: 999 })
          .expect(403);
        expect(
          db.prepare("SELECT value FROM roadtrip_preferences WHERE trip_id = 5 AND key = 'roadtrip_range_km'").get(),
        ).toEqual({ value: '160' });
      } finally {
        db.prepare('DELETE FROM trip_members WHERE trip_id = 5 AND user_id = 2').run();
      }
    });
    it('ROADTRIP-E2E-013: the stay switch is off until it is set, and round-trips as a boolean', async () => {
      db.prepare("DELETE FROM roadtrip_preferences WHERE trip_id = 5 AND key = 'roadtrip_hotel_bookends'").run();
      const before = await request(server).get('/api/trips/5/roadtrip/preferences').set('Cookie', cookie()).expect(200);
      expect(before.body.preferences).not.toHaveProperty('roadtrip_hotel_bookends');

      const saved = await request(server)
        .put('/api/trips/5/roadtrip/preferences')
        .set('Cookie', cookie())
        .send({ roadtrip_hotel_bookends: true })
        .expect(200);
      expect(saved.body.preferences.roadtrip_hotel_bookends).toBe(true);
      const after = await request(server).get('/api/trips/5/roadtrip/preferences').set('Cookie', cookie()).expect(200);
      expect(after.body.preferences.roadtrip_hotel_bookends).toBe(true);

      await request(server)
        .put('/api/trips/5/roadtrip/preferences')
        .set('Cookie', cookie())
        .send({ roadtrip_hotel_bookends: false })
        .expect(200);
      expect(
        db.prepare("SELECT value FROM roadtrip_preferences WHERE trip_id = 5 AND key = 'roadtrip_hotel_bookends'").get(),
      ).toEqual({ value: 'false' });
    });
    it('ROADTRIP-E2E-014: a stay switch that is not a boolean is a 400, not a stored row', async () => {
      db.prepare("DELETE FROM roadtrip_preferences WHERE trip_id = 5 AND key = 'roadtrip_hotel_bookends'").run();
      for (const value of ['true', 1, null]) {
        await request(server)
          .put('/api/trips/5/roadtrip/preferences')
          .set('Cookie', cookie())
          .send({ roadtrip_hotel_bookends: value })
          .expect(400);
      }
      expect(
        db.prepare("SELECT value FROM roadtrip_preferences WHERE trip_id = 5 AND key = 'roadtrip_hotel_bookends'").get(),
      ).toBeUndefined();
    });
    it('refuses strangers and invalid daily windows', async () => {
      await request(server).get('/api/trips/5/roadtrip/preferences').set('Cookie', sessionCookie(2)).expect(404);
      await request(server)
        .put('/api/trips/5/roadtrip/preferences')
        .set('Cookie', cookie())
        .send({ roadtrip_day_start: '18:00', roadtrip_day_end: '08:00' })
        .expect(400);
    });
  });

  describe('the addon gate', () => {
    // Six routes, all of them. `@RequireAddon` is metadata and inert without the
    // guard, and the guard is not global — so this block is the only thing that
    // fails if somebody drops AddonGuard from the chain again.
    const routes: [string, string, unknown?][] = [
      ['get', '/api/trips/5/roadtrip/preferences'],
      ['put', '/api/trips/5/roadtrip/preferences', { roadtrip_range_km: 120 }],
      ['get', '/api/trips/5/roadtrip/vias'],
      ['get', '/api/trips/5/roadtrip/days/3/vias'],
      ['post', '/api/trips/5/roadtrip/days/3/vias', { after_order_index: 0, lat: 53, lng: 10 }],
      ['post', '/api/trips/5/roadtrip/days/3/vias/batch', { vias: [{ after_order_index: 0, lat: 53, lng: 10 }] }],
      ['put', '/api/trips/5/roadtrip/days/3/vias', { vias: [] }],
      ['delete', '/api/trips/5/roadtrip/days/3/vias/1'],
    ];

    it('ROADTRIP-E2E-001: answers 404 on every route while the addon is off', async () => {
      setAddon(false);
      for (const [method, url, body] of routes) {
        const req = (request(server) as never as Record<string, (u: string) => request.Test>)
          [method](url)
          .set('Cookie', cookie());
        const res = await (body ? req.send(body as object) : req);
        expect(res.status, `${method.toUpperCase()} ${url}`).toBe(404);
      }
    });

    it('ROADTRIP-E2E-002: a disabled addon owes an anonymous caller a 404, not a 401', async () => {
      // The gate leads the chain for this reason: a 401 tells a stranger the
      // route exists. Both answers refuse; only one of them says nothing.
      setAddon(false);
      const res = await request(server).get('/api/trips/5/roadtrip/vias');
      expect(res.status).toBe(404);
    });

    it('ROADTRIP-E2E-003: with the addon on, an anonymous caller gets 401', async () => {
      const res = await request(server).get('/api/trips/5/roadtrip/vias');
      expect(res.status).toBe(401);
    });
  });

  describe('trip scoping', () => {
    it('ROADTRIP-E2E-004: a trip the caller cannot reach is 404', async () => {
      const res = await request(server).get('/api/trips/6/roadtrip/vias').set('Cookie', cookie());
      expect(res.status).toBe(404);
    });

    it('ROADTRIP-E2E-005: a day from another trip is not reachable through one the caller has', async () => {
      // Day 4 exists and is real; it just belongs to trip 6. The guard proves
      // the trip, `requireDay` proves the day is part of it.
      const res = await request(server).get('/api/trips/5/roadtrip/days/4/vias').set('Cookie', cookie());
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Day not found' });
    });

    it('ROADTRIP-E2E-006: a track from another trip cannot label this day', async () => {
      const res = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias/batch')
        .set('Cookie', cookie())
        .send({ vias: [{ after_order_index: 0, lat: 53, lng: 10 }], track: { place_id: 11 } });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Track not found' });
    });

    it('ROADTRIP-E2E-007: a place without a route geometry is not a track', async () => {
      const res = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias/batch')
        .set('Cookie', cookie())
        .send({ vias: [{ after_order_index: 0, lat: 53, lng: 10 }], track: { place_id: 12 } });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Track not found' });
    });
  });

  describe('permission', () => {
    it('ROADTRIP-E2E-008: reading needs no day_edit, writing does', async () => {
      checkPermission.mockReturnValue(false);
      expect((await request(server).get('/api/trips/5/roadtrip/vias').set('Cookie', cookie())).status).toBe(200);
      const write = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias')
        .set('Cookie', cookie())
        .send({ after_order_index: 0, lat: 53, lng: 10 });
      expect(write.status).toBe(403);
    });
  });

  describe('the wire contract', () => {
    it('ROADTRIP-E2E-009: a via round-trips through create, list, move and delete', async () => {
      const created = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias')
        .set('Cookie', cookie())
        .send({ after_order_index: 0, lat: 53, lng: 10 });
      expect(created.status).toBe(201);
      const id = created.body.via.id;
      expect(created.body.via).toMatchObject({ day_id: 3, after_order_index: 0, sequence: 0, lat: 53, lng: 10 });

      const listed = await request(server).get('/api/trips/5/roadtrip/days/3/vias').set('Cookie', cookie());
      expect(listed.body.vias.map((v: { id: number }) => v.id)).toEqual([id]);

      const moved = await request(server)
        .put(`/api/trips/5/roadtrip/days/3/vias/${id}`)
        .set('Cookie', cookie())
        .send({ lat: 54, lng: 11 });
      // 200, not the 201 Nest defaults a body-carrying write to.
      expect(moved.status).toBe(200);
      expect(moved.body.via).toMatchObject({ lat: 54, lng: 11 });

      expect(
        (await request(server).delete(`/api/trips/5/roadtrip/days/3/vias/${id}`).set('Cookie', cookie())).status,
      ).toBe(200);
      const after = await request(server).get('/api/trips/5/roadtrip/days/3/vias').set('Cookie', cookie());
      expect(after.body.vias).toEqual([]);
    });

    // L1 (Plan 3d Task 7 whole-plan review): `listForDay`/`listForTrip`/
    // `tracksForTrip` used to bind `Number(tripId)`, which a hex-spelled id
    // coerces to a real trip — `TripAccessGuard` had already authorised the
    // SAME id through its own `Number()` (not a leak), but the legacy
    // raw-bind statement's affinity never converts a hex string, so it
    // always answered empty. Every one of these three now answers the
    // legacy empty shape for the same hex id, not the real trip's rows.
    it('L1 — vias/tracks by a hex-spelled trip id answer the legacy empty shape, not trip 5\'s real rows', async () => {
      const created = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias')
        .set('Cookie', cookie())
        .send({ after_order_index: 0, lat: 53, lng: 10 });
      expect(created.status).toBe(201);

      const hexTripId = '0x' + (5).toString(16);
      const res = await request(server).get(`/api/trips/${hexTripId}/roadtrip/vias`).set('Cookie', cookie());
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ vias: [], tracks: [] });

      const hexDayId = '0x' + (3).toString(16);
      const dayRes = await request(server).get(`/api/trips/5/roadtrip/days/${hexDayId}/vias`).set('Cookie', cookie());
      // `requireDay` (`toRowId`, unrelated to this fix) already 404s a
      // hex-spelled day id — asserted here only to document that this route
      // never reaches `listForDay` with one, so `listForDay`'s own fix is
      // pinned at the service level instead (see roadtrip.service.test.ts).
      expect(dayRes.status).toBe(404);
    });

    it('ROADTRIP-E2E-010: the batch route answers 200 and records the track it was fitted to', async () => {
      const res = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias/batch')
        .set('Cookie', cookie())
        .send({
          vias: [
            { after_order_index: 0, lat: 53, lng: 10 },
            { after_order_index: 0, lat: 53.5, lng: 10.5 },
          ],
          track: { place_id: 10, stray_km: 1.5 },
        });
      expect(res.status).toBe(200);
      expect(res.body.vias).toHaveLength(2);

      const all = await request(server).get('/api/trips/5/roadtrip/vias').set('Cookie', cookie());
      expect(all.body.tracks).toEqual([{ day_id: 3, place_id: 10, stray_km: 1.5 }]);
    });

    it('ROADTRIP-E2E-011: the re-anchor route is declared before the id route', async () => {
      // `PUT days/:dayId/vias` and `PUT days/:dayId/vias/:id` differ by one
      // segment. Declared the other way round, the batch would be swallowed by
      // the id route and every re-anchoring would 404 on a via named "vias".
      const created = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias')
        .set('Cookie', cookie())
        .send({ after_order_index: 2, lat: 53, lng: 10 });
      const res = await request(server)
        .put('/api/trips/5/roadtrip/days/3/vias')
        .set('Cookie', cookie())
        .send({ vias: [{ id: created.body.via.id, after_order_index: 1 }] });
      expect(res.status).toBe(200);
      expect(res.body.vias[0]).toMatchObject({ after_order_index: 1 });
    });

    it('ROADTRIP-E2E-012: a body the contract refuses is a 400, not a stored row', async () => {
      const res = await request(server)
        .post('/api/trips/5/roadtrip/days/3/vias')
        .set('Cookie', cookie())
        .send({ after_order_index: 0, lat: 999, lng: 10 });
      expect(res.status).toBe(400);
      expect(db.prepare('SELECT COUNT(*) c FROM roadtrip_vias').get()).toEqual({ c: 0 });
    });
  });
});
