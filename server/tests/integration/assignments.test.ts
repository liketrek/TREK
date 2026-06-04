/**
 * Day Assignments integration tests.
 * Covers ASSIGN-001 to ASSIGN-009.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: number) => {
      const place: any = db.prepare(`SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, addTripMember, createTag } from '../helpers/factories';
import { authCookie } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
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

    const rows = testDb
      .prepare('SELECT id, order_index FROM day_assignments WHERE day_id = ? ORDER BY order_index')
      .all(day.id) as Array<{ id: number; order_index: number }>;
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
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tag.id);

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
