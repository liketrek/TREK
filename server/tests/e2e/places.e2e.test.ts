/**
 * Places module e2e — exercises the migrated /api/trips/:tripId/places endpoints
 * through the real JwtAuthGuard against a temp SQLite db. PlacesService runs its
 * real (DI-native) SQL — places/categories/tags/place_tags/place_ratings DDL
 * below; journeyService, the permission check, canAccessTrip and the WebSocket
 * broadcast are mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  // PlacesService runs its real SQL since the place fold — the full place column
  // set the INSERT/UPDATE/SELECT paths touch, plus the joined projections.
  tmp.exec(`CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, name TEXT,
    description TEXT, lat REAL, lng REAL, address TEXT, category_id INTEGER, price REAL, currency TEXT,
    place_time TEXT, end_time TEXT, duration_minutes INTEGER, notes TEXT, image_url TEXT,
    google_place_id TEXT, google_ftid TEXT, osm_id TEXT, website TEXT, phone TEXT, transport_mode TEXT,
    route_geometry TEXT, route_color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, color TEXT, icon TEXT);`);
  tmp.exec(`CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE place_tags (place_id INTEGER NOT NULL, tag_id INTEGER NOT NULL,
    PRIMARY KEY (place_id, tag_id));`);
  tmp.exec(`CREATE TABLE place_ratings (place_id INTEGER NOT NULL, user_id INTEGER NOT NULL, rating INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(place_id, user_id));`);
  // The assignment=unassigned/assigned filters join these.
  tmp.exec('CREATE TABLE days (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, day_number INTEGER, date TEXT);');
  tmp.exec(`CREATE TABLE day_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL, order_index INTEGER DEFAULT 0);`);
  // reclaimPlaceImage ref-counts an uploaded thumbnail across both tables.
  tmp.exec(`CREATE TABLE collection_places (id INTEGER PRIMARY KEY AUTOINCREMENT, image_url TEXT);`);
  // reclaimPhotoCache's removeIfUnreferenced sweeps the Google photo cache.
  tmp.exec(`CREATE TABLE google_place_photo_meta (place_id TEXT PRIMARY KEY, attribution TEXT, error_at DATETIME);`);
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
const { getPlaceWithTags } = vi.hoisted(() => ({
  // The one db/database helper PlacesService still calls through (post-write
  // re-selects). Real implementation over the temp db so the responses carry
  // the joined category/tags/ratings the client expects.
  getPlaceWithTags: vi.fn(),
}));
vi.mock('../../src/db/database', () => ({
  db, canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags, closeDb: () => {}, reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { PlacesModule } from '../../src/nest/places/places.module';
import { PlacesService } from '../../src/nest/places/places.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Places e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, PlacesModule] })
      .overrideProvider(JourneyDomainService)
      .useValue({ onPlaceCreated: vi.fn(), onPlaceUpdated: vi.fn(), onPlaceDeleted: vi.fn() })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    getPlaceWithTags.mockImplementation((placeId: number | string) => {
      const place = db.prepare(`SELECT p.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
        FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId) as Record<string, unknown> | undefined;
      if (!place) return null;
      const tags = db.prepare('SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?').all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name } : null, tags, ratings: [], rating_avg: null, rating_count: 0 };
    });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.exec('DELETE FROM places; DELETE FROM place_tags; DELETE FROM place_ratings; DELETE FROM day_assignments; DELETE FROM days;');
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/places')).status).toBe(401);
  });

  it('200 list', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (1, 5, 'Spot')").run();
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0]).toMatchObject({ id: 1, name: 'Spot', trip_id: 5, tags: [], ratings: [] });
  });

  it('200 list scoped to the trip', async () => {
    db.prepare("INSERT INTO places (trip_id, name) VALUES (5, 'Mine')").run();
    db.prepare("INSERT INTO places (trip_id, name) VALUES (6, 'Theirs')").run();
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.body.places.map((p: { name: string }) => p.name)).toEqual(['Mine']);
  });

  it('201 create, 403 without permission, 400 over-long name', async () => {
    const ok = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'Spot' });
    expect(ok.status).toBe(201);
    expect(ok.body.place).toMatchObject({ name: 'Spot', trip_id: 5, transport_mode: 'walking', duration_minutes: 60 });
    // The row really landed.
    expect(db.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = 5').get()).toEqual({ n: 1 });

    const long = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'x'.repeat(201) });
    expect(long.status).toBe(400);
    expect(long.body).toEqual({ error: 'name must be 200 characters or less' });

    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'Spot' });
    expect(forbidden.status).toBe(403);
  });

  it('200 (not 201) bulk-delete, 400 on bad ids', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (1, 5, 'A'), (2, 5, 'B'), (3, 6, 'Foreign')").run();
    const ok = await request(server).post('/api/trips/5/places/bulk-delete').set('Cookie', sessionCookie(1)).send({ ids: [1, 2, 3] });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ deleted: [1, 2], count: 2 });
    // The foreign trip's place is untouched.
    expect(db.prepare('SELECT id FROM places ORDER BY id').all()).toEqual([{ id: 3 }]);

    // The ZodValidationPipe owns this 400 since the DTO ratchet — the legacy
    // 'ids must be an array of numbers' string is gone.
    const bad = await request(server).post('/api/trips/5/places/bulk-delete').set('Cookie', sessionCookie(1)).send({ ids: ['a'] });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toMatch(/^ids\.0: /);
  });

  it('body DTOs: the pipe rejects a nameless create and a urlless list import', async () => {
    const nameless = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ lat: 1 });
    expect(nameless.status).toBe(400);
    expect(nameless.body.error).toMatch(/^name: /);

    const urlless = await request(server).post('/api/trips/5/places/import/google-list').set('Cookie', sessionCookie(1)).send({});
    expect(urlless.status).toBe(400);
    expect(urlless.body.error).toMatch(/^url: /);

    // And it fires ahead of the trip-access 404 it used to follow (documented
    // parity shift of the ratchet — the todo/trips precedent).
    canAccessTrip.mockReturnValue(undefined);
    const noTrip = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({});
    expect(noTrip.status).toBe(400);
  });

  it('bulk-update: an empty id list still short-circuits, a bare id list still 400s', async () => {
    const empty = await request(server).post('/api/trips/5/places/bulk-update').set('Cookie', sessionCookie(1)).send({ ids: [] });
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual({ updated: [], count: 0 });

    // category_id absent (not undefined-valued): Zod strips absent optionals, so
    // the handler's `'category_id' in body` check still discriminates.
    const noField = await request(server).post('/api/trips/5/places/bulk-update').set('Cookie', sessionCookie(1)).send({ ids: [1] });
    expect(noField.status).toBe(400);
    expect(noField.body).toEqual({ error: 'Provide at least one field to update' });
  });

  it('import/google-list forwards a boolean enrich flag as the client sends it', async () => {
    const spy = vi.spyOn(app.get(PlacesService), 'importGoogleList').mockResolvedValue({ places: [], listName: 'L', skipped: 0 });
    const res = await request(server)
      .post('/api/trips/5/places/import/google-list')
      .set('Cookie', sessionCookie(1))
      .send({ url: 'https://maps.app.goo.gl/x', enrich: true });
    expect(res.status).toBe(201);
    expect(spy).toHaveBeenCalledWith('5', 'https://maps.app.goo.gl/x', { enrich: true, userId: 1 });
    spy.mockRestore();
  });

  it('PUT route_color: hex through, null through, garbage rejected (#776)', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (9, 5, 'Walk')").run();

    const ok = await request(server).put('/api/trips/5/places/9').set('Cookie', sessionCookie(1)).send({ route_color: '#e11d48' });
    expect(ok.status).toBe(200);
    expect(ok.body.place.route_color).toBe('#e11d48');

    // null is the reset back to the inherited category colour.
    const cleared = await request(server).put('/api/trips/5/places/9').set('Cookie', sessionCookie(1)).send({ route_color: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.place.route_color).toBeNull();

    const bad = await request(server).put('/api/trips/5/places/9').set('Cookie', sessionCookie(1)).send({ route_color: 'red' });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'route_color must be a hex colour like #4f46e5' });
  });

  it('409 on a stale If-Match token (#1135)', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name, updated_at) VALUES (9, 5, 'Walk', '2026-01-01 00:00:00')").run();
    const res = await request(server)
      .put('/api/trips/5/places/9')
      .set('Cookie', sessionCookie(1))
      .set('X-Base-Updated-At', '1999-01-01 00:00:00')
      .send({ name: 'Mine' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
    expect(db.prepare('SELECT name FROM places WHERE id = 9').get()).toEqual({ name: 'Walk' });
  });

  it('PUT/DELETE :id/rating stores and clears the caller\'s vote', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (9, 5, 'Rated')").run();

    const rated = await request(server).put('/api/trips/5/places/9/rating').set('Cookie', sessionCookie(1)).send({ rating: 4 });
    expect(rated.status).toBe(200);
    expect(db.prepare('SELECT user_id, rating FROM place_ratings WHERE place_id = 9').all()).toEqual([{ user_id: 1, rating: 4 }]);

    const cleared = await request(server).delete('/api/trips/5/places/9/rating').set('Cookie', sessionCookie(1));
    expect(cleared.status).toBe(200);
    expect(db.prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = 9').get()).toEqual({ n: 0 });
  });

  it('DELETE :id removes the row, 404 for a foreign place', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (9, 5, 'Gone'), (10, 6, 'Foreign')").run();

    const ok = await request(server).delete('/api/trips/5/places/9').set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM places WHERE id = 9').get()).toBeUndefined();

    const foreign = await request(server).delete('/api/trips/5/places/10').set('Cookie', sessionCookie(1));
    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual({ error: 'Place not found' });
  });

  it('404 trip when not accessible', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  // The first attempt at guarding places lost the delete permission check and
  // answered 200 where 403 belonged. This asserts the argument list, not just
  // the status, so a check that happens to return the right code for the wrong
  // reason still fails.
  it('DELETE :id demands place_edit, by name', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (11, 5, 'Guarded')").run();
    checkPermission.mockReturnValue(false);

    const res = await request(server).delete('/api/trips/5/places/11').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
    expect(checkPermission).toHaveBeenCalledWith('place_edit', 'user', 1, 1, false);
    expect(db.prepare('SELECT id FROM places WHERE id = 11').get()).toBeDefined();
  });

  it('the guarded read routes 404 an inaccessible trip without touching the place', async () => {
    canAccessTrip.mockReturnValue(undefined);
    for (const path of ['/api/trips/5/places/9', '/api/trips/5/places/9/image']) {
      const res = await request(server).get(path).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    }
    const del = await request(server).delete('/api/trips/5/places/9').set('Cookie', sessionCookie(1));
    expect(del.status).toBe(404);
    expect(del.body).toEqual({ error: 'Trip not found' });
  });

  // The reason places keeps its inline checks on the write routes: a guard runs
  // before the pipe, so guarding create would answer 404 where the suite above
  // pins a 400. This is the non-regression pin for that decision.
  it('a bad create body still 400s ahead of the trip 404', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
  });
});
