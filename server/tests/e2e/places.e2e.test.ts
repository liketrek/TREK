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
 * journeyService and the permission check stay mocked, and the broadcast
 * goes to a FakeRealtimeService. Every `it(...)` body below is unchanged from before this
 * conversion — only the DB bootstrap changed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

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
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { makeUser } from '../helpers/factories/users';
import { makeTour } from '../helpers/factories/tours';
import { countRows, deleteRows, findRow, findRows, insertRow, insertRows, upsertRow } from '../helpers/factories/rows';
import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { PlaceRatings } from '../../src/db/entities/PlaceRatings.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { FakeRealtimeService } from '../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;

let orm: TestOrm;

describe('Places e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, PlacesModule] })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
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
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test' });
    await makeUser(orm, { id: 2, username: 'peer', email: 'peer@example.test' });
    await insertRow(orm, Trips, { id: 6, title: 'Theirs', user: 2 });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    // Trip 5 (owned by user 1) is the suite's main trip, re-seeded fresh
    // every test — deleting it (`ON DELETE CASCADE`) also clears every place/
    // day/assignment/rating/tag-link/budget-item this suite seeded under it,
    // the real-FK equivalent of the old blanket `DELETE FROM places; …`.
    // Trip 6 (the "foreign" trip, owned by user 2) is seeded once in
    // beforeAll and left alone.
    await deleteRows(orm, Trips, { id: 5 });
    await insertRow(orm, Trips, { id: 5, title: 'Trip', user: 1 });
    await deleteRows(orm, Places, { trip: 6 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/places')).status).toBe(401);
  });

  it('200 list', async () => {
    await insertRow(orm, Places, { id: 1, trip: 5, name: 'Spot' });
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0]).toMatchObject({ id: 1, name: 'Spot', trip_id: 5, tags: [], ratings: [] });
  });

  it('marks Tour-backed Places without changing ordinary Place rows', async () => {
    await insertRows(orm, Places, [{ id: 1, trip: 5, name: 'Plain' }, { id: 2, trip: 5, name: 'Tour' }]);
    await makeTour(orm, 2, { tourTypeRef: 'hike' });

    const all = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(all.status).toBe(200);
    expect(all.body.places).toHaveLength(2);
    const tourPlaceIdById = new Map(all.body.places.map((place: { id: number; tour_place_id: number | null }) => [place.id, place.tour_place_id]));
    expect(tourPlaceIdById.get(1)).toBeNull();
    expect(tourPlaceIdById.get(2)).toBe(2);
  });

  it('200 list scoped to the trip', async () => {
    await insertRow(orm, Places, { trip: 5, name: 'Mine' });
    await insertRow(orm, Places, { trip: 6, name: 'Theirs' });
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.body.places.map((p: { name: string }) => p.name)).toEqual(['Mine']);
  });

  it('201 create, 403 without permission, 400 over-long name', async () => {
    const ok = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'Spot' });
    expect(ok.status).toBe(201);
    expect(ok.body.place).toMatchObject({ name: 'Spot', trip_id: 5, transport_mode: 'walking', duration_minutes: 60 });
    // The row really landed.
    expect(await countRows(orm, Places, { trip: 5 })).toBe(1);

    const long = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'x'.repeat(201) });
    expect(long.status).toBe(400);
    expect(long.body).toEqual({ error: 'name must be 200 characters or less' });

    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({ name: 'Spot' });
    expect(forbidden.status).toBe(403);
  });

  it('200 (not 201) bulk-delete, 400 on bad ids', async () => {
    await insertRows(orm, Places, [{ id: 1, trip: 5, name: 'A' }, { id: 2, trip: 5, name: 'B' }]);
    await insertRow(orm, Places, { id: 3, trip: 6, name: 'Foreign' });
    const ok = await request(server).post('/api/trips/5/places/bulk-delete').set('Cookie', sessionCookie(1)).send({ ids: [1, 2, 3] });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ deleted: [1, 2], count: 2, tourPlaceIds: [] });
    // The foreign trip's place is untouched.
    expect((await findRows(orm, Places, {}, { id: 'asc' })).map(p => ({ id: p.id }))).toEqual([{ id: 3 }]);

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
    await deleteRows(orm, Trips, { id: 5 });
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
    await insertRow(orm, Places, { id: 9, trip: 5, name: 'Walk' });

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
    expect((await findRow(orm, Places, { id }))!.website).toBe('https://www.example.fr/patrimoine');

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
    expect(await countRows(orm, Places, { trip: 5 })).toBe(0);
  });

  it('409 on a stale If-Match token (#1135)', async () => {
    await insertRow(orm, Places, { id: 9, trip: 5, name: 'Walk', updated_at: '2026-01-01 00:00:00' });
    const res = await request(server)
      .put('/api/trips/5/places/9')
      .set('Cookie', sessionCookie(1))
      .set('X-Base-Updated-At', '1999-01-01 00:00:00')
      .send({ name: 'Mine' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
    expect((await findRow(orm, Places, { id: 9 }))!.name).toBe('Walk');
  });

  it('PUT/DELETE :id/rating stores and clears the caller\'s vote', async () => {
    await insertRow(orm, Places, { id: 9, trip: 5, name: 'Rated' });

    const rated = await request(server).put('/api/trips/5/places/9/rating').set('Cookie', sessionCookie(1)).send({ rating: 4 });
    expect(rated.status).toBe(200);
    expect((await findRows(orm, PlaceRatings, { place: 9 }, { id: 'asc' })).map(r => ({ user_id: r.user_id, rating: r.rating }))).toEqual([{ user_id: 1, rating: 4 }]);

    const cleared = await request(server).delete('/api/trips/5/places/9/rating').set('Cookie', sessionCookie(1));
    expect(cleared.status).toBe(200);
    expect(await countRows(orm, PlaceRatings, { place: 9 })).toBe(0);
  });

  it('DELETE :id removes the row, 404 for a foreign place', async () => {
    await insertRow(orm, Places, { id: 9, trip: 5, name: 'Gone' });
    await insertRow(orm, Places, { id: 10, trip: 6, name: 'Foreign' });

    const ok = await request(server).delete('/api/trips/5/places/9').set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true, tourPlaceIds: [] });
    expect(await findRow(orm, Places, { id: 9 })).toBeNull();

    const foreign = await request(server).delete('/api/trips/5/places/10').set('Cookie', sessionCookie(1));
    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual({ error: 'Place not found' });
  });

  it('DELETE :id and bulk-delete report the Tour place ids they removed', async () => {
    await insertRows(orm, Places, [
      { id: 20, trip: 5, name: 'Tour A' },
      { id: 21, trip: 5, name: 'Tour B' },
      { id: 22, trip: 5, name: 'Plain' },
    ]);
    await makeTour(orm, 20, { tourTypeRef: 'hike' });
    await makeTour(orm, 21, { tourTypeRef: 'hike' });

    const single = await request(server).delete('/api/trips/5/places/20').set('Cookie', sessionCookie(1));
    expect(single.status).toBe(200);
    expect(single.body).toEqual({ success: true, tourPlaceIds: [20] });
    expect(await findRow(orm, Tours, { place: 20 })).toBeNull();

    const bulk = await request(server).post('/api/trips/5/places/bulk-delete').set('Cookie', sessionCookie(1)).send({ ids: [21, 22] });
    expect(bulk.status).toBe(200);
    expect(bulk.body).toEqual({ deleted: [21, 22], count: 2, tourPlaceIds: [21] });
  });

  it('DELETE :id takes the expense linked to the place with it (#1298)', async () => {
    await insertRow(orm, Places, { id: 12, trip: 5, name: 'Louvre' });
    await insertRow(orm, BudgetItems, { id: 44, trip: 5, name: 'Tickets', total_price: 34, place: 12 });
    await insertRow(orm, BudgetItems, { id: 45, trip: 5, name: 'Coffee', total_price: 3 });

    const res = await request(server).delete('/api/trips/5/places/12').set('Cookie', sessionCookie(1));

    expect(res.status).toBe(200);
    expect((await findRows(orm, BudgetItems, {}, { id: 'asc' })).map(b => ({ id: b.id }))).toEqual([{ id: 45 }]);
  });

  it('DELETE :id tells the deleting tab about the expense that went with the place', async () => {
    // X-Socket-Id keeps a tab from hearing back what it did itself. The tab
    // removed the place; the expense went on the server alone, so that event
    // goes out without the filter or the tab keeps the expense until a reload.
    await insertRow(orm, Places, { id: 13, trip: 5, name: 'Louvre' });
    await insertRow(orm, BudgetItems, { id: 46, trip: 5, name: 'Tickets', total_price: 34, place: 13 });
    vi.mocked(broadcast).mockClear();

    const res = await request(server).delete('/api/trips/5/places/13')
      .set('Cookie', sessionCookie(1)).set('X-Socket-Id', 'tab-1');

    expect(res.status).toBe(200);
    expect(broadcast).toHaveBeenCalledWith('5', 'place:deleted', { placeId: 13 }, 'tab-1');
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:deleted', { itemId: 46 }, undefined);
  });

  it('404 trip when not accessible', async () => {
    await deleteRows(orm, Trips, { id: 5 });
    const res = await request(server).get('/api/trips/5/places').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  // The first attempt at guarding places lost the delete permission check and
  // answered 200 where 403 belonged. This asserts the argument list, not just
  // the status, so a check that happens to return the right code for the wrong
  // reason still fails.
  it('DELETE :id demands place_edit, by name', async () => {
    await insertRow(orm, Places, { id: 11, trip: 5, name: 'Guarded' });
    checkPermission.mockReturnValue(false);

    const res = await request(server).delete('/api/trips/5/places/11').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
    expect(checkPermission).toHaveBeenCalledWith('place_edit', 'user', 1, 1, false);
    expect(await findRow(orm, Places, { id: 11 })).not.toBeNull();
  });

  it('the guarded read routes 404 an inaccessible trip without touching the place', async () => {
    await deleteRows(orm, Trips, { id: 5 });
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
    const seedTrip = async () => {
      await upsertRow(orm, Trips, { id: 5, title: 'Alpine week', user: 1 });
      await insertRow(orm, Places, { id: 1, trip: 5, name: 'Trailhead', lat: 47.1, lng: 11.2 });
      await insertRow(orm, Places, { id: 2, trip: 5, name: 'Ridge', lat: 47.2, lng: 11.3, route_geometry: '[[47.2,11.3],[47.25,11.35]]' });
      await insertRow(orm, Days, { id: 1, trip: 5, day_number: 1, date: '2026-05-01', title: 'Warm up' });
      await insertRows(orm, DayAssignments, [
        { day: 1, place: 1, order_index: 0 },
        { day: 1, place: 2, order_index: 1 },
      ]);
    };

    it('serves the trip as an attachment named after it', async () => {
      await seedTrip();
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
      await upsertRow(orm, Trips, { id: 5, title: '沖縄 4泊5日', user: 1 });
      await insertRow(orm, Places, { id: 1, trip: 5, name: '首里城', lat: 26.217, lng: 127.719 });

      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toBe(
        'attachment; filename="__-4_5_.gpx"; filename*=UTF-8\'\'%E6%B2%96%E7%B8%84-4%E6%B3%8A5%E6%97%A5.gpx',
      );
      expect(res.text).toContain('<name>首里城</name>');
    });

    it('narrows the document to the requested parts', async () => {
      await seedTrip();
      const res = await request(server)
        .get('/api/trips/5/places/export.gpx?waypoints=false&dayRoutes=false')
        .set('Cookie', sessionCookie(1));

      expect(res.status).toBe(200);
      expect(res.text).toContain('<trk>');
      expect(res.text).not.toContain('<wpt');
      expect(res.text).not.toContain('<rte>');
    });

    it('400s when every part was switched off', async () => {
      await seedTrip();
      const res = await request(server)
        .get('/api/trips/5/places/export.gpx?waypoints=false&tracks=false&dayRoutes=false')
        .set('Cookie', sessionCookie(1));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'No export types selected' });
    });

    it('404s an empty trip rather than handing over a file that imports as nothing', async () => {
      await upsertRow(orm, Trips, { id: 5, title: 'Nothing here', user: 1 });
      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Nothing to export' });
    });

    it('404s a trip the caller cannot reach, and 401s without a cookie', async () => {
      await seedTrip();
      await deleteRows(orm, Trips, { id: 5 });
      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });

      expect((await request(server).get('/api/trips/5/places/export.gpx')).status).toBe(401);
    });

    it('is a read: no place_edit permission required', async () => {
      await seedTrip();
      checkPermission.mockReturnValue(false);
      const res = await request(server).get('/api/trips/5/places/export.gpx').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
    });
  });

  // The reason places keeps its inline checks on the write routes: a guard runs
  // before the pipe, so guarding create would answer 404 where the suite above
  // pins a 400. This is the non-regression pin for that decision.
  it('a bad create body still 400s ahead of the trip 404', async () => {
    await deleteRows(orm, Trips, { id: 5 });
    const res = await request(server).post('/api/trips/5/places').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
  });
});
