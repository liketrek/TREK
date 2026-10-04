/**
 * Places module e2e — exercises the migrated /api/trips/:tripId/places endpoints
 * through the real JwtAuthGuard against a real migrated-and-seeded temp SQLite db
 * (createSnapshotTestDb(), Plan 3c Task 4 — this used to hand-roll a dozen
 * CREATE TABLEs, a second hand-maintained schema copy that omitted several
 * `places` columns `PlacesRepository.insertPlace`'s own `em.insert()`
 * RETURNING read-back names (`reservation_status`, `reservation_notes`,
 * `reservation_datetime`) and stubbed `getPlaceWithTags`/`canAccessTrip`
 * directly rather than routing through the real repositories this domain now
 * uses — the same class of failure `days.e2e.test.ts` (Task 2) and
 * `assignments.e2e.test.ts` (Task 3) already fixed for their own files.
 * PlacesService runs its real SQL (DI-injected, no service mock);
 * journeyService, the permission check and the WebSocket broadcast stay
 * mocked. Every `it(...)` body below is unchanged from before this
 * conversion — only the DB bootstrap changed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../src/websocket', () => ({ broadcast }));

import { db } from '../../src/db/database';

const { onPlaceCreated, onPlaceUpdated, onPlaceDeleted } = vi.hoisted(() => ({
  onPlaceCreated: vi.fn().mockResolvedValue(undefined),
  onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
  onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
}));
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { PlacesModule } from '../../src/nest/places/places.module';
import { PlacesService } from '../../src/nest/places/places.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule } from '../helpers/test-orm';

describe('Places e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, PlacesModule] })
      .overrideProvider(JourneyDomainService)
      .useValue({ onPlaceCreated, onPlaceUpdated, onPlaceDeleted })
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
    // harness.ts's seedUser() omits password_hash, which the real migrated
    // schema requires NOT NULL (days.e2e.test.ts's/assignments.e2e.test.ts's
    // own precedent) — raw inserts here instead. `username: 'e2e-user'`
    // (user 1) matches the harness default so assertion bodies that spell
    // out the owner's username stay unchanged. User 2 owns the "foreign"
    // trip (id 6) several tests below reference — `trips.user_id` and
    // `places.trip_id` both carry a real FK now (`ON DELETE CASCADE`), so a
    // dangling trip_id the old hand-rolled DDL tolerated would fail here.
    db.prepare("INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)").run();
    db.prepare("INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (2, 'peer', 'peer@example.test', 'x', 'user', 0)").run();
    db.prepare("INSERT INTO trips (id, title, user_id) VALUES (6, 'Theirs', 2)").run();
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    // Trip 5 (owned by user 1) is the suite's main trip, re-seeded fresh
    // every test — deleting it (`ON DELETE CASCADE`) also clears every place/
    // day/assignment/rating/tag-link/budget-item this suite seeded under it,
    // the real-FK equivalent of the old blanket `DELETE FROM places; …`.
    // Trip 6 (the "foreign" trip, owned by user 2) is seeded once in
    // beforeAll and left alone.
    db.exec('DELETE FROM trips WHERE id = 5;');
    db.prepare("INSERT INTO trips (id, title, user_id) VALUES (5, 'Trip', 1)").run();
    db.exec('DELETE FROM places WHERE trip_id = 6;');
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
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (1, 5, 'A'), (2, 5, 'B')").run();
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (3, 6, 'Foreign')").run();
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
    db.prepare('DELETE FROM trips WHERE id = 5').run();
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

  // #2483: a place from the TREK index can carry its website without a scheme.
  it('PLACES-E2E-2483-01: create and update take a website without a scheme and store it as https', async () => {
    const created = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1))
      .send({ name: 'Chapelle Sainte-Barbe', website: 'fr.wikipedia.org/wiki/Chapelle_Sainte-Barbe_du_Faouët' });
    expect(created.status).toBe(201);
    expect(created.body.place.website).toBe('https://fr.wikipedia.org/wiki/Chapelle_Sainte-Barbe_du_Faouët');

    const id = created.body.place.id;
    const updated = await request(server).put(`/api/trips/5/places/${id}`).set('Cookie', sessionCookie(1))
      .send({ website: '//www.example.fr/patrimoine' });
    expect(updated.status).toBe(200);
    expect(db.prepare('SELECT website FROM places WHERE id = ?').get(id)).toEqual({ website: 'https://www.example.fr/patrimoine' });

    // An explicit scheme is stored exactly as sent, and '' still clears the field.
    const kept = await request(server).put(`/api/trips/5/places/${id}`).set('Cookie', sessionCookie(1))
      .send({ website: 'http://Example.fr/Pfad?q=1' });
    expect(kept.body.place.website).toBe('http://Example.fr/Pfad?q=1');
    const cleared = await request(server).put(`/api/trips/5/places/${id}`).set('Cookie', sessionCookie(1)).send({ website: '' });
    expect(cleared.status).toBe(200);
  });

  it('PLACES-E2E-2483-02: a script link, another scheme or a bare word is still a 400 with the same message', async () => {
    for (const website of ['javascript:alert(1)', 'mailto:mairie@example.fr', 'Chapelle', 42]) {
      const res = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'Chapelle', website });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'website must be an http or https URL' });
    }
    expect(db.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = 5').get()).toEqual({ n: 0 });
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
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (9, 5, 'Gone')").run();
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (10, 6, 'Foreign')").run();

    const ok = await request(server).delete('/api/trips/5/places/9').set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM places WHERE id = 9').get()).toBeUndefined();

    const foreign = await request(server).delete('/api/trips/5/places/10').set('Cookie', sessionCookie(1));
    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual({ error: 'Place not found' });
  });

  it('DELETE :id takes the expense linked to the place with it (#1298)', async () => {
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (12, 5, 'Louvre')").run();
    db.prepare("INSERT INTO budget_items (id, trip_id, name, total_price, place_id) VALUES (44, 5, 'Tickets', 34, 12)").run();
    db.prepare("INSERT INTO budget_items (id, trip_id, name, total_price) VALUES (45, 5, 'Coffee', 3)").run();

    const res = await request(server).delete('/api/trips/5/places/12').set('Cookie', sessionCookie(1));

    expect(res.status).toBe(200);
    expect(db.prepare('SELECT id FROM budget_items ORDER BY id').all()).toEqual([{ id: 45 }]);
  });

  it('DELETE :id tells the deleting tab about the expense that went with the place', async () => {
    // X-Socket-Id keeps a tab from hearing back what it did itself. The tab
    // removed the place; the expense went on the server alone, so that event
    // goes out without the filter or the tab keeps the expense until a reload.
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (13, 5, 'Louvre')").run();
    db.prepare("INSERT INTO budget_items (id, trip_id, name, total_price, place_id) VALUES (46, 5, 'Tickets', 34, 13)").run();
    vi.mocked(broadcast).mockClear();

    const res = await request(server).delete('/api/trips/5/places/13')
      .set('Cookie', sessionCookie(1)).set('X-Socket-Id', 'tab-1');

    expect(res.status).toBe(200);
    expect(broadcast).toHaveBeenCalledWith('5', 'place:deleted', { placeId: 13 }, 'tab-1');
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:deleted', { itemId: 46 }, undefined);
  });

  it('404 trip when not accessible', async () => {
    db.prepare('DELETE FROM trips WHERE id = 5').run();
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
    db.prepare('DELETE FROM trips WHERE id = 5').run();
    for (const path of ['/api/trips/5/places/9', '/api/trips/5/places/9/image']) {
      const res = await request(server).get(path).set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    }
    const del = await request(server).delete('/api/trips/5/places/9').set('Cookie', sessionCookie(1));
    expect(del.status).toBe(404);
    expect(del.body).toEqual({ error: 'Trip not found' });
  });

  // ── GPX export ────────────────────────────────────────────────────────────
  describe('GET export.gpx (#1442)', () => {
    const seedTrip = () => {
      db.prepare("INSERT OR REPLACE INTO trips (id, title, user_id) VALUES (5, 'Alpine week', 1)").run();
      db.prepare("INSERT INTO places (id, trip_id, name, lat, lng) VALUES (1, 5, 'Trailhead', 47.1, 11.2)").run();
      db.prepare("INSERT INTO places (id, trip_id, name, lat, lng, route_geometry) VALUES (2, 5, 'Ridge', 47.2, 11.3, '[[47.2,11.3],[47.25,11.35]]')").run();
      db.prepare("INSERT INTO days (id, trip_id, day_number, date, title) VALUES (1, 5, 1, '2026-05-01', 'Warm up')").run();
      db.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (1, 1, 0), (1, 2, 1)').run();
    };

    it('serves the trip as an attachment named after it', async () => {
      seedTrip();
      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/gpx+xml');
      expect(res.headers['content-disposition']).toBe('attachment; filename="Alpine-week.gpx"');
      expect(res.text).toContain('<name>Trailhead</name>');
      // Self-closing here: these points carry no elevation.
      expect(res.text).toContain('<trkpt lat="47.2" lon="11.3"');
      expect(res.text).toContain('<name>1. Warm up</name>');
    });

    // The reported repro (#2165): a Japanese trip title crashed setHeader with
    // ERR_INVALID_CHAR before the first body byte. Now the header folds to
    // ASCII and carries the real name RFC 5987-encoded.
    it('a non-ASCII trip title exports 200 with a filename* header instead of a 500 (#2165)', async () => {
      db.prepare('INSERT OR REPLACE INTO trips (id, title, user_id) VALUES (5, ?, 1)').run('沖縄 4泊5日');
      db.prepare('INSERT INTO places (id, trip_id, name, lat, lng) VALUES (1, 5, ?, 26.217, 127.719)').run('首里城');

      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toBe(
        'attachment; filename="__-4_5_.gpx"; filename*=UTF-8\'\'%E6%B2%96%E7%B8%84-4%E6%B3%8A5%E6%97%A5.gpx',
      );
      expect(res.text).toContain('<name>首里城</name>');
    });

    it('narrows the document to the requested parts', async () => {
      seedTrip();
      const res = await request(server)
        .get('/api/trips/5/places/export.gpx?waypoints=false&dayRoutes=false')
        .set('Cookie', sessionCookie(1));

      expect(res.status).toBe(200);
      expect(res.text).toContain('<trk>');
      expect(res.text).not.toContain('<wpt');
      expect(res.text).not.toContain('<rte>');
    });

    it('400s when every part was switched off', async () => {
      seedTrip();
      const res = await request(server)
        .get('/api/trips/5/places/export.gpx?waypoints=false&tracks=false&dayRoutes=false')
        .set('Cookie', sessionCookie(1));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No export types selected' });
    });

    it('404s an empty trip rather than handing over a file that imports as nothing', async () => {
      db.prepare("INSERT OR REPLACE INTO trips (id, title, user_id) VALUES (5, 'Nothing here', 1)").run();
      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Nothing to export' });
    });

    it('404s a trip the caller cannot reach, and 401s without a cookie', async () => {
      seedTrip();
      db.prepare('DELETE FROM trips WHERE id = 5').run();
      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });

      expect((await request(server).get('/api/trips/5/places/export.gpx')).status).toBe(401);
    });

    it('is a read: no place_edit permission required', async () => {
      seedTrip();
      checkPermission.mockReturnValue(false);
      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
    });
  });

  // The reason places keeps its inline checks on the write routes: a guard runs
  // before the pipe, so guarding create would answer 404 where the suite above
  // pins a 400. This is the non-regression pin for that decision.
  it('a bad create body still 400s ahead of the trip 404', async () => {
    db.prepare('DELETE FROM trips WHERE id = 5').run();
    const res = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
  });
});
