/**
 * Days + day-notes module e2e — exercises both migrated mounts through the real
 * JwtAuthGuard against a real migrated-and-seeded temp SQLite db
 * (createSnapshotTestDb(), Plan 3c Task 2 — this used to hand-roll a dozen
 * CREATE TABLEs, a second hand-maintained schema copy that omitted
 * `roadtrip_day_tracks` and the rest of the entity graph `DaysRepository
 * .listByTrip`'s ORM `find()` now needs to resolve at query time, the exact
 * "e2e suites build their schema from hand-written partial DDL" risk the
 * plan's inventory §15c flagged — `no such table: roadtrip_day_tracks` on
 * this suite's very first `GET /api/trips/:id/days` was the failure that
 * proved it). DaysService and DayNotesService now run through real
 * repositories over the same migrated connection; trip access resolves
 * through `TripsRepository.findAccessible` via the real request-scoped
 * `EntityManager` `createTestMikroOrmModule` wires in, not a hand-rolled
 * `canAccessTrip` mock (the legacy override this file used to export from
 * `db/database.ts` — deleted there since Plan 3c Task 0b; a stale mock here
 * would silently do nothing, not fail loudly, which is worse than removing
 * it). Only the permission check stays mocked.
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

import { db } from '../../src/db/database';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { DaysModule } from '../../src/nest/days/days.module';
// The note routes nest under the days prefix but live in their own domain now;
// this container has to assemble both or /days/:dayId/notes 404s here while
// working in production.
import { DayNotesModule } from '../../src/nest/day-notes/day-notes.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { countRows, deleteRows, findRow, findRows, insertRow, insertRows, updateRows } from '../helpers/factories/rows';
import { makeUser } from '../helpers/factories/users';
import { makeTour } from '../helpers/factories/tours';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { DayNotes } from '../../src/db/entities/DayNotes.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';

let orm: TestOrm;

/** The day's position and date, as the reorder and the date shift leave them. */
async function dayColumns(id: number) {
  const day = await findRow(orm, Days, { id });
  return { day_number: day?.day_number, date: day?.date };
}

describe('Days + day-notes e2e (real auth guard + temp SQLite, real day SQL)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, DaysModule, DayNotesModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // The user sessionCookie(1) is signed for, pinned to id 1 with
    // password_version 0, then the one trip and day every case starts from.
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test', role: 'user', password_version: 0 });
    await insertRow(orm, Trips, { id: 5, user: 1, title: 'Trip' });
    await insertRow(orm, Days, { id: 3, trip: 5, day_number: 1 });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, DayNotes);
    await deleteRows(orm, DayAssignments);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/days')).status).toBe(401);
  });

  it('200 list days (the { days } envelope, real rows with assignments + notes_items)', async () => {
    const res = await request(server).get('/api/trips/5/days').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(1);
    expect(res.body.days[0]).toMatchObject({ id: 3, trip_id: 5, day_number: 1, assignments: [], notes_items: [] });
  });

  it('200 list projects Tour facets once per assignment and leaves other tracks ordinary', async () => {
    const legacyGeometry = JSON.stringify([[48, 11, 600], [48.01, 11.02, 650]]);
    const tourGeometry = JSON.stringify([[48.02, 11.03, 700], [48.03, 11.04, 750]]);
    await insertRows(orm, Places, [
      { id: 2, trip: 5, name: 'Ordinary', route_geometry: null },
      { id: 3, trip: 5, name: 'Legacy track', route_geometry: legacyGeometry },
      { id: 4, trip: 5, name: 'Tour', route_geometry: tourGeometry },
    ]);
    await makeTour(orm, 4, { tourTypeRef: 'hike' });
    const assignmentIds: number[] = [];
    for (const [orderIndex, placeId] of [2, 3, 4, 4].entries()) {
      assignmentIds.push(await insertRow(orm, DayAssignments, { day: 3, place: placeId, order_index: orderIndex }));
    }

    const res = await request(server).get('/api/trips/5/days').set('Cookie', sessionCookie(1));

    expect(res.status).toBe(200);
    const assignments = res.body.days[0].assignments as Array<{
      id: number;
      order_index: number;
      tour_place_id: number | null;
      tour_route_geometry: string | null;
      place: { id: number };
    }>;
    expect(assignments).toHaveLength(4);
    expect(assignments.map(a => a.id)).toEqual(assignmentIds);
    expect(assignments.map(a => a.order_index)).toEqual([0, 1, 2, 3]);
    expect(assignments[0]).toMatchObject({ place: { id: 2 }, tour_place_id: null, tour_route_geometry: null });
    expect((await findRow(orm, Places, { id: 3 }))?.route_geometry).toBe(legacyGeometry);
    expect(await findRow(orm, Tours, { place: 3 })).toBeNull();
    expect((await findRow(orm, Tours, { place: 4 }))?.place_id).toBe(4);
    expect(assignments[1]).toMatchObject({ place: { id: 3 }, tour_place_id: null, tour_route_geometry: null });
    expect(assignments.slice(2).map(a => ({
      place_id: a.place.id,
      tour_place_id: a.tour_place_id,
      tour_route_geometry: a.tour_route_geometry,
    }))).toEqual([
      { place_id: 4, tour_place_id: 4, tour_route_geometry: tourGeometry },
      { place_id: 4, tour_place_id: 4, tour_route_geometry: tourGeometry },
    ]);
  });

  it('201 create day (real insert, auto day_number), 404 trip when not accessible', async () => {
    const ok = await request(server).post('/api/trips/5/days').set('Cookie', sessionCookie(1)).send({ date: '2026-07-01' });
    expect(ok.status).toBe(201);
    expect(ok.body.day).toMatchObject({ trip_id: 5, day_number: 2, date: '2026-07-01', assignments: [] });
    const row = await findRow(orm, Days, { id: ok.body.day.id });
    expect(row).toMatchObject({ trip_id: 5, day_number: 2, date: '2026-07-01' });
    await deleteRows(orm, Days, { id: ok.body.day.id });
    const miss = await request(server).get('/api/trips/77/days').set('Cookie', sessionCookie(1));
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Trip not found' });
  });

  it('201 create dated day extends the trip, and the days without a date move back', async () => {
    await insertRow(orm, Trips, { id: 10, user: 1, title: 'Grow', start_date: '2026-09-01', end_date: '2026-09-02' });
    await insertRow(orm, Days, { trip: 10, day_number: 1, date: '2026-09-01' });
    await insertRow(orm, Days, { trip: 10, day_number: 2, date: '2026-09-02' });
    const spare = await insertRow(orm, Days, { trip: 10, day_number: 3 });
    const res = await request(server).post('/api/trips/10/days').set('Cookie', sessionCookie(1)).send({ dated: true });
    expect(res.status).toBe(201);
    expect(res.body.day).toMatchObject({ trip_id: 10, day_number: 3, date: '2026-09-03', assignments: [], notes_items: [] });
    expect(res.body.trip).toMatchObject({ id: 10, end_date: '2026-09-03', day_count: 4, is_owner: 1 });
    expect((await findRow(orm, Trips, { id: 10 }))?.end_date).toBe('2026-09-03');
    expect(await dayColumns(spare)).toEqual({ day_number: 4, date: null });
  });

  it('400 dated with position, 400 dated on a trip without dates', async () => {
    await insertRow(orm, Trips, { id: 11, user: 1, title: 'Mixed', start_date: '2026-09-01', end_date: '2026-09-01' });
    await insertRow(orm, Days, { trip: 11, day_number: 1, date: '2026-09-01' });
    const mixed = await request(server).post('/api/trips/11/days').set('Cookie', sessionCookie(1)).send({ dated: true, position: 1 });
    expect(mixed.status).toBe(400);
    expect(await countRows(orm, Days, { trip: 11 })).toBe(1);
    const undated = await request(server).post('/api/trips/5/days').set('Cookie', sessionCookie(1)).send({ dated: true });
    expect(undated.status).toBe(400);
    expect(undated.body).toEqual({ error: 'This trip has no dates. Add a day without a date instead.' });
    expect(await countRows(orm, Days, { trip: 5 })).toBe(1);
  });

  it('200 update day notes/title, 404 Day not found, 403 without permission', async () => {
    const res = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1))
      .send({ notes: 'Walking day', title: 'Arrival' });
    expect(res.status).toBe(200);
    expect(res.body.day).toMatchObject({ id: 3, notes: 'Walking day', title: 'Arrival', assignments: [] });
    // The client updates title and notes in separate requests — an omitted
    // field must survive (post-port defect fix: the legacy update always wrote
    // both columns, so a title-only PUT wiped the notes).
    const titleOnly = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1))
      .send({ title: 'Renamed' });
    expect(titleOnly.status).toBe(200);
    expect(titleOnly.body.day).toMatchObject({ id: 3, notes: 'Walking day', title: 'Renamed' });
    const notesOnly = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1))
      .send({ notes: 'Museum day' });
    expect(notesOnly.status).toBe(200);
    expect(notesOnly.body.day).toMatchObject({ id: 3, notes: 'Museum day', title: 'Renamed' });
    const miss = await request(server).put('/api/trips/5/days/99').set('Cookie', sessionCookie(1)).send({ notes: 'x' });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Day not found' });
    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1)).send({ notes: 'x' });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body).toEqual({ error: 'No permission' });
  });

  it('200 transport setter changes only default_transport_mode', async () => {
    await updateRows(orm, Days, { id: 3 }, { notes: 'Keep', title: 'Kept' });
    const res = await request(server).put('/api/trips/5/days/3/transport').set('Cookie', sessionCookie(1))
      .send({ transport_mode: 'walk' });
    expect(res.status).toBe(200);
    expect(res.body.day).toMatchObject({ id: 3, default_transport_mode: 'walk', notes: 'Keep', title: 'Kept' });
  });

  it('200 reorder permutes day_number, 400 on a non-permutation', async () => {
    await insertRow(orm, Trips, { id: 6, user: 1, title: 'Reorder' });
    const a = await insertRow(orm, Days, { trip: 6, day_number: 1, date: '2026-03-01' });
    const b = await insertRow(orm, Days, { trip: 6, day_number: 2, date: '2026-03-02' });
    const ok = await request(server).put('/api/trips/6/days/reorder').set('Cookie', sessionCookie(1))
      .send({ orderedIds: [b, a] });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    const after = await findRows(orm, Days, { trip: 6 }, { day_number: 'asc' });
    // Dates stay pinned to slots; the rows swapped positions.
    expect(after.map(d => d.id)).toEqual([b, a]);
    expect(after.map(d => d.date)).toEqual(['2026-03-01', '2026-03-02']);
    const bad = await request(server).put('/api/trips/6/days/reorder').set('Cookie', sessionCookie(1))
      .send({ orderedIds: [b] });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'orderedIds must be a permutation of the trip day ids.' });
  });

  it('200 delete day removes the row, closes the gap and answers with the trip', async () => {
    await insertRow(orm, Trips, { id: 7, user: 1, title: 'Delete' });
    const id = await insertRow(orm, Days, { trip: 7, day_number: 1 });
    const kept = await insertRow(orm, Days, { trip: 7, day_number: 2 });
    const res = await request(server).delete(`/api/trips/7/days/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, trip: { id: 7, day_count: 1, is_owner: 1 } });
    expect(await findRow(orm, Days, { id })).toBeNull();
    expect((await findRow(orm, Days, { id: kept }))?.day_number).toBe(1);
  });

  it('200 delete a dated day with no spare day ends the trip a day earlier', async () => {
    await insertRow(orm, Trips, { id: 8, user: 1, title: 'Shrink', start_date: '2026-09-01', end_date: '2026-09-02' });
    const first = await insertRow(orm, Days, { trip: 8, day_number: 1, date: '2026-09-01' });
    const second = await insertRow(orm, Days, { trip: 8, day_number: 2, date: '2026-09-02' });
    const res = await request(server).delete(`/api/trips/8/days/${first}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.trip).toMatchObject({ id: 8, end_date: '2026-09-01', day_count: 1 });
    expect(await dayColumns(second)).toEqual({ day_number: 1, date: '2026-09-01' });
  });

  it('400 delete the last day of a trip, 403 without day_edit', async () => {
    await insertRow(orm, Trips, { id: 9, user: 1, title: 'Last' });
    const only = await insertRow(orm, Days, { trip: 9, day_number: 1 });
    const last = await request(server).delete(`/api/trips/9/days/${only}`).set('Cookie', sessionCookie(1));
    expect(last.status).toBe(400);
    expect(last.body).toEqual({ error: 'A trip needs at least one day.' });
    expect((await findRow(orm, Days, { id: only }))?.id).toBe(only);
    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).delete(`/api/trips/9/days/${only}`).set('Cookie', sessionCookie(1));
    expect(forbidden.status).toBe(403);
    expect(forbidden.body).toEqual({ error: 'No permission' });
  });

  it('201 create note (real insert: trim, empty-string coercions), 400 on over-long text (before access)', async () => {
    const ok = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1))
      .send({ text: '  Lunch  ', time: '', icon: '', sort_order: 0 });
    expect(ok.status).toBe(201);
    expect(ok.body.note).toMatchObject({ day_id: 3, trip_id: 5, text: 'Lunch', time: null, icon: '📝', sort_order: 0 });
    const row = await findRow(orm, DayNotes, { id: ok.body.note.id });
    expect(row).toMatchObject({ text: 'Lunch', time: null, icon: '📝', sort_order: 0 });
    const long = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: 'x'.repeat(501) });
    expect(long.status).toBe(400);
    expect(long.body.error).toContain('text');
  });

  it('201 create accepts null time/icon (moveDayNote re-sends the nullable entity fields)', async () => {
    const res = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1))
      .send({ text: 'Moved', time: null, icon: null, sort_order: 3 });
    expect(res.status).toBe(201);
    expect(res.body.note).toMatchObject({ text: 'Moved', time: null, icon: '📝', sort_order: 3 });
  });

  it('404 Day not found when the day is not on the trip', async () => {
    const res = await request(server).post('/api/trips/5/days/99/notes').set('Cookie', sessionCookie(1)).send({ text: 'Lunch' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Day not found' });
  });

  it('400 note without text', async () => {
    const res = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: '  ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Text required' });
  });

  it('200 update note merges omitted fields from the current row', async () => {
    const created = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1))
      .send({ text: 'Lunch', time: '12:00' });
    const id = created.body.note.id;
    const res = await request(server).put(`/api/trips/5/days/3/notes/${id}`).set('Cookie', sessionCookie(1))
      .send({ icon: '🍜' });
    expect(res.status).toBe(200);
    expect(res.body.note).toMatchObject({ id, text: 'Lunch', time: '12:00', icon: '🍜' });
    const miss = await request(server).put('/api/trips/5/days/3/notes/9999').set('Cookie', sessionCookie(1)).send({ text: 'x' });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Note not found' });
  });

  it('200 delete note removes the row', async () => {
    const created = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: 'Lunch' });
    const id = created.body.note.id;
    const res = await request(server).delete(`/api/trips/5/days/3/notes/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(await findRow(orm, DayNotes, { id })).toBeNull();
  });
});
