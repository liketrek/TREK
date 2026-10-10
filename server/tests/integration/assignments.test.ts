/**
 * Day Assignments integration tests.
 * Covers ASSIGN-001 to ASSIGN-009.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, addTripMember, createTag } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { MikroORM } from '@mikro-orm/core';
import { countRows, findRows, updateRows } from '../helpers/factories/rows';
import { tagPlace } from '../helpers/factories/places';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Places } from '../../src/db/entities/Places.entity';

let nestApp: INestApplication;
let app: Application;
let orm: MikroORM;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// Helper: create a trip with a day and a place, return all three
function setupAssignmentFixtures(userId: number) {
  const trip = createTrip(testDb, userId);
  const day = createDay(testDb, trip.id, { date: '2025-06-01' });
  const place = createPlace(testDb, trip.id, { name: 'Test Place' });
  return { trip, day, place };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create assignment
// ─────────────────────────────────────────────────────────────────────────────

describe('Create assignment', () => {
  it('sets a day end for one visit, preserves its times, and clears it again', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);
    const created = await request(app).post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id)).send({ place_id: place.id });
    const id = created.body.assignment.id;
    const url = `/api/trips/${trip.id}/assignments/${id}/end-day`;
    await updateRows(orm, DayAssignments, { id }, { assignment_time: '07:00' });
    const changed = await request(app).put(url).set('Cookie', authCookie(user.id)).send({ end_day: true }).expect(200);
    expect(changed.body.assignment).toMatchObject({ end_day: true, assignment_time: '07:00' });
    const listed = await request(app).get(`/api/trips/${trip.id}/days`).set('Cookie', authCookie(user.id)).expect(200);
    expect(listed.body.days[0].assignments[0].end_day).toBe(true);
    const repeatedDay = createDay(testDb, trip.id, { day_number: 2 });
    const repeated = await request(app).post(`/api/trips/${trip.id}/days/${repeatedDay.id}/assignments`)
      .set('Cookie', authCookie(user.id)).send({ place_id: place.id }).expect(201);
    expect(repeated.body.assignment.end_day).toBe(false);
    await request(app).put(url).set('Cookie', authCookie(user.id)).send({ end_day: 'true' }).expect(400);
    const foreign = createTrip(testDb, user.id);
    await request(app).put(`/api/trips/${foreign.id}/assignments/${id}/end-day`).set('Cookie', authCookie(user.id))
      .send({ end_day: true }).expect(404);
    const cleared = await request(app).put(url).set('Cookie', authCookie(user.id)).send({ end_day: false }).expect(200);
    expect(cleared.body.assignment).toMatchObject({ end_day: false, assignment_time: '07:00' });
    await request(app).put(url).send({ end_day: true }).expect(401);
  });

  it('ASSIGN-001 — POST creates assignment linking place to day', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    expect(res.status).toBe(201);
    // The assignment has an embedded place object, not a top-level place_id
    expect(res.body.assignment.place.id).toBe(place.id);
    expect(res.body.assignment.day_id).toBe(day.id);
  });

  it('ASSIGN-001 — POST with notes stores notes on assignment', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id, notes: 'Book table in advance' });
    expect(res.status).toBe(201);
    expect(res.body.assignment.notes).toBe('Book table in advance');
  });

  it('ASSIGN-001 — POST with non-existent place returns 404', async () => {
    const { user } = createUser(testDb);
    const { trip, day } = setupAssignmentFixtures(user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: 99999 });
    expect(res.status).toBe(404);
  });

  it('ASSIGN-001 — POST with non-existent day returns 404', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = setupAssignmentFixtures(user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/days/99999/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    expect(res.status).toBe(404);
  });

  it('ASSIGN-006 — non-member cannot create assignment', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(owner.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(other.id))
      .send({ place_id: place.id });
    expect(res.status).toBe(404);
  });

  it('ASSIGN-006 — trip member can create assignment', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(owner.id);
    addTripMember(testDb, trip.id, member.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(member.id))
      .send({ place_id: place.id });
    expect(res.status).toBe(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// List assignments
// ─────────────────────────────────────────────────────────────────────────────

describe('List assignments', () => {
  it('ASSIGN-002 — GET /api/trips/:tripId/days/:dayId/assignments returns assignments for the day', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);

    await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.assignments).toHaveLength(1);
    // Assignments have an embedded place object
    expect(res.body.assignments[0].place.id).toBe(place.id);
  });

  it('ASSIGN-002 — returns empty array when no assignments exist', async () => {
    const { user } = createUser(testDb);
    const { trip, day } = setupAssignmentFixtures(user.id);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.assignments).toHaveLength(0);
  });

  it('ASSIGN-003 — the embedded place carries osm_id so the day-plan thumbnail can auto-fetch (#1136)', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);
    await updateRows(orm, Places, { id: place.id }, { osm_id: 'node:42' });

    await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.assignments[0].place.osm_id).toBe('node:42');

    // Also surfaced through the full trip-days bundle (the actual day-plan source).
    const daysRes = await request(app)
      .get(`/api/trips/${trip.id}/days`)
      .set('Cookie', authCookie(user.id));
    const embedded = daysRes.body.days.find((d: { id: number }) => d.id === day.id).assignments[0].place;
    expect(embedded.osm_id).toBe('node:42');
  });

  it('ASSIGN-006 — non-member cannot list assignments', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const { trip, day } = setupAssignmentFixtures(owner.id);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(other.id));
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete assignment
// ─────────────────────────────────────────────────────────────────────────────

describe('Delete assignment', () => {
  it('ASSIGN-004 — DELETE removes assignment', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);

    const create = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    const assignmentId = create.body.assignment.id;

    const del = await request(app)
      .delete(`/api/trips/${trip.id}/days/${day.id}/assignments/${assignmentId}`)
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    // Verify it's gone
    const list = await request(app)
      .get(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id));
    expect(list.body.assignments).toHaveLength(0);
  });

  it('ASSIGN-004 — DELETE returns 404 for non-existent assignment', async () => {
    const { user } = createUser(testDb);
    const { trip, day } = setupAssignmentFixtures(user.id);

    const res = await request(app)
      .delete(`/api/trips/${trip.id}/days/${day.id}/assignments/99999`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reorder assignments
// ─────────────────────────────────────────────────────────────────────────────

describe('Reorder assignments', () => {
  it('ASSIGN-007 — PUT /reorder reorders assignments within a day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2025-06-01' });
    const place1 = createPlace(testDb, trip.id, { name: 'Place A' });
    const place2 = createPlace(testDb, trip.id, { name: 'Place B' });

    const a1 = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place1.id });
    const a2 = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place2.id });

    const reorder = await request(app)
      .put(`/api/trips/${trip.id}/days/${day.id}/assignments/reorder`)
      .set('Cookie', authCookie(user.id))
      .send({ orderedIds: [a2.body.assignment.id, a1.body.assignment.id] });
    expect(reorder.status).toBe(200);
    expect(reorder.body.success).toBe(true);

    const rows = await findRows(orm, DayAssignments, { day: day.id }, { order_index: 'asc' });
    expect(rows[0].id).toBe(a2.body.assignment.id);
    expect(rows[1].id).toBe(a1.body.assignment.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Move assignment
// ─────────────────────────────────────────────────────────────────────────────

describe('Move assignment', () => {
  it('ASSIGN-008 — PUT /move transfers assignment to a different day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { date: '2025-06-01' });
    const day2 = createDay(testDb, trip.id, { date: '2025-06-02' });
    const place = createPlace(testDb, trip.id);

    const create = await request(app)
      .post(`/api/trips/${trip.id}/days/${day1.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    const assignmentId = create.body.assignment.id;

    const move = await request(app)
      .put(`/api/trips/${trip.id}/assignments/${assignmentId}/move`)
      .set('Cookie', authCookie(user.id))
      .send({ new_day_id: day2.id, order_index: 0 });
    expect(move.status).toBe(200);
    expect(move.body.assignment.day_id).toBe(day2.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Participants
// ─────────────────────────────────────────────────────────────────────────────

describe('Assignment participants', () => {
  it('ASSIGN-005 — PUT /participants updates participant list', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);
    addTripMember(testDb, trip.id, member.id);

    const create = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    const assignmentId = create.body.assignment.id;

    const update = await request(app)
      .put(`/api/trips/${trip.id}/assignments/${assignmentId}/participants`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id, member.id] });
    expect(update.status).toBe(200);

    const getParticipants = await request(app)
      .get(`/api/trips/${trip.id}/assignments/${assignmentId}/participants`)
      .set('Cookie', authCookie(user.id));
    expect(getParticipants.status).toBe(200);
    expect(getParticipants.body.participants).toHaveLength(2);
  });

  it('ASSIGN-010 — GET /assignments includes tags and participants when present', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);
    addTripMember(testDb, trip.id, member.id);

    // Attach a tag to the place
    const tag = createTag(testDb, user.id, { name: 'Must See' });
    await tagPlace(orm, place.id, [tag.id]);

    // Create the assignment via API
    const create = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    expect(create.status).toBe(201);
    const assignmentId = create.body.assignment.id;

    // Add participants to the assignment
    await request(app)
      .put(`/api/trips/${trip.id}/assignments/${assignmentId}/participants`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id, member.id] });

    // List assignments — should include tags (compact) and participants
    const res = await request(app)
      .get(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    const found = (res.body.assignments as any[]).find((a: any) => a.id === assignmentId);
    expect(found).toBeDefined();
    expect(found.place.tags).toHaveLength(1);
    expect(found.participants).toHaveLength(2);
  });

  it('ASSIGN-009 — PUT /time updates assignment time fields', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);

    const create = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    const assignmentId = create.body.assignment.id;

    const update = await request(app)
      .put(`/api/trips/${trip.id}/assignments/${assignmentId}/time`)
      .set('Cookie', authCookie(user.id))
      .send({ place_time: '14:00', end_time: '16:00' });
    expect(update.status).toBe(200);
    // Time is embedded under assignment.place.place_time (COALESCEd from assignment_time)
    expect(update.body.assignment.place.place_time).toBe('14:00');
    expect(update.body.assignment.place.end_time).toBe('16:00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// H1 (task-4-review.md, the trip-id half fixed here) — `dayExists`/
// `placeExists` gate on `toRowId(tripId)` now, not `Number(tripId)`: a
// hex-spelled trip id whose `Number()` value is a real, accessible trip must
// answer the legacy "Day not found", not reach that trip's real day/place
// (rule 21).
// ─────────────────────────────────────────────────────────────────────────────

describe('H1 — trip id parsed once at the gate (rule 21)', () => {
  it('POST create-assignment by the hex-spelled trip id 404s "Day not found" (legacy: 404, not 201)', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = setupAssignmentFixtures(user.id);
    const hexTripId = '0x' + trip.id.toString(16);

    const res = await request(app)
      .post(`/api/trips/${hexTripId}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Day not found' });
    expect(await countRows(orm, DayAssignments, { day: day.id })).toBe(0);
  });
});
