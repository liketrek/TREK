import { RoadtripSearchService } from '../../src/nest/roadtrip/roadtrip-search.service';
import { GoogleRouteService } from '../../src/nest/roadtrip/google-route.service';
import { ChargingService } from '../../src/nest/roadtrip/charging.service';
/**
 * Road trip module e2e — the real guard chain against a temp SQLite db.
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
import { DatabaseModule } from '../../src/nest/database/database.module';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RoadtripModule } from '../../src/nest/roadtrip/roadtrip.module';
import { RoadtripHazardsService } from '../../src/nest/roadtrip/roadtrip-hazards.service';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, end_date TEXT);');
  tmp.exec(
    'CREATE TABLE roadtrip_preferences (trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY(trip_id, key));',
  );
  tmp.exec('CREATE TABLE trip_members (trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL);');
  tmp.exec(`CREATE TABLE days (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    day_number INTEGER, date TEXT, title TEXT, notes TEXT);`);
  tmp.exec(`CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, name TEXT,
    lat REAL, lng REAL, route_geometry TEXT, stop_type TEXT, fill_percent INTEGER);`);
  tmp.exec(`CREATE TABLE roadtrip_vias (id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    after_order_index INTEGER NOT NULL, sequence INTEGER NOT NULL DEFAULT 0,
    lat REAL NOT NULL, lng REAL NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE roadtrip_day_tracks (
    day_id INTEGER PRIMARY KEY REFERENCES days(id) ON DELETE CASCADE,
    place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE, stray_km REAL);`);
  // AddonsService reads this; StorageRegistryService reads app_settings at init.
  tmp.exec(`CREATE TABLE addons (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0,
    name TEXT, description TEXT, category TEXT, sort_order INTEGER DEFAULT 0);`);
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  canAccessTrip: (tripId: number | string, userId: number) =>
    db
      .prepare(
        `
      SELECT t.id, t.user_id FROM trips t
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
      WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
    `,
      )
      .get(userId, tripId, userId),
  isOwner: () => false,
  getPlaceWithTags: () => null,
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const ADDON_ID = 'roadtrip';

function setAddon(enabled: boolean): void {
  db.prepare(
    'INSERT INTO addons (id, enabled) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET enabled = excluded.enabled',
  ).run(ADDON_ID, enabled ? 1 : 0);
}

describe('Roadtrip e2e (real guard chain + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let checkPermission: MockInstance;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, RoadtripModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    seedUser(db as never, { id: 2, email: 'other@example.test' });
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
  it('validates Google route preview and import before executing either service', async () => {
    const routes = app.get(GoogleRouteService);
    const preview = vi.spyOn(routes, 'preview').mockResolvedValue({ stops: [] });
    const save = vi.spyOn(routes, 'import').mockReturnValue({ imported: 2 });
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
