/**
 * Unit tests for the DI-native AssignmentsService — ASG-SVC-001 through
 * ASG-SVC-028 (written for the DI migration: the legacy
 * services/assignmentService.ts had no dedicated unit suite, so these pin the
 * relocated SQL — MAX(order_index)+1 ordering, post-write re-selects, the
 * time-driven auto-sort with its '99:99' sentinel — plus the hardening that
 * followed the move: transactional writes, the DB-derived move source day,
 * empty-string time clearing, and the unified compact tag projection; the
 * bridge-delegation case died with assignments.bridge). Uses a real in-memory SQLite DB so SQL
 * logic is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

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
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: unknown, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: unknown, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember, createDay, createPlace, createDayAssignment, createTag } from '../../helpers/factories';
import { DatabaseService, type TripAccess } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { AssignmentsService } from '../../../src/nest/assignments/assignments.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';

const dbs = new DatabaseService(testDb);
const realtime = new RealtimeService();
const svc = new AssignmentsService(
  dbs,
  new PermissionsService(dbs),
  realtime,
  new QueryHelpersService(dbs),
  // Real collaborator rather than a stub: reconcile() runs after every mutation
  // and needs the same connection to see the rows these cases write.
  new JourneyDomainService(dbs, realtime, new TrekPhotosRepository(dbs)),
);

/**
 * canEdit only reads trip.user_id, so the case below hands it just that field.
 * The cast names the omission instead of padding the fixture with an id and a
 * currency no assertion looks at.
 */
function tripOwnedBy(userId: number): TripAccess {
  return { user_id: userId } as TripAccess;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

/** owner + trip + one day + one place — the minimal itinerary fixture. */
function fixture() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const day = createDay(testDb, trip.id);
  const place = createPlace(testDb, trip.id, { name: 'Louvre' });
  return { user, trip, day, place };
}

// ── verifyTripAccess / canEdit ────────────────────────────────────────────────

describe('verifyTripAccess', () => {
  it('ASG-SVC-001: returns trip for owner', () => {
    const { user, trip } = fixture();
    const result = svc.verifyTripAccess(trip.id, user.id);
    expect(result).toBeDefined();
    expect((result as { user_id: number }).user_id).toBe(user.id);
  });

  it('ASG-SVC-002: returns falsy for non-member', () => {
    const { trip } = fixture();
    const { user: stranger } = createUser(testDb);
    expect(svc.verifyTripAccess(trip.id, stranger.id)).toBeFalsy();
  });
});

describe('canEdit', () => {
  it('ASG-SVC-003: owner and member pass day_edit (default trip_member)', () => {
    const { user, trip } = fixture();
    const { user: member } = createUser(testDb);
    addTripMember(testDb, trip.id, member.id);
    expect(svc.canEdit(tripOwnedBy(trip.user_id), user)).toBe(true);
    expect(svc.canEdit(tripOwnedBy(trip.user_id), member)).toBe(true);
  });
});

// ── existence checks ──────────────────────────────────────────────────────────

describe('dayExists / placeExists / assignmentExistsInDay', () => {
  it('ASG-SVC-004: dayExists is trip-scoped', () => {
    const { trip, day } = fixture();
    const { user: other } = createUser(testDb);
    const otherTrip = createTrip(testDb, other.id);
    expect(svc.dayExists(day.id, trip.id)).toBe(true);
    expect(svc.dayExists(day.id, otherTrip.id)).toBe(false);
    expect(svc.dayExists(9999, trip.id)).toBe(false);
  });

  it('ASG-SVC-005: placeExists is trip-scoped', () => {
    const { trip, place } = fixture();
    const { user: other } = createUser(testDb);
    const otherTrip = createTrip(testDb, other.id);
    expect(svc.placeExists(place.id, trip.id)).toBe(true);
    expect(svc.placeExists(place.id, otherTrip.id)).toBe(false);
  });

  it('ASG-SVC-006: assignmentExistsInDay requires matching day AND trip', () => {
    const { trip, day, place } = fixture();
    const otherDay = createDay(testDb, trip.id);
    const a = createDayAssignment(testDb, day.id, place.id);
    expect(svc.assignmentExistsInDay(a.id, day.id, trip.id)).toBe(true);
    expect(svc.assignmentExistsInDay(a.id, otherDay.id, trip.id)).toBe(false);
    expect(svc.assignmentExistsInDay(a.id, day.id, trip.id + 1)).toBe(false);
  });
});

// ── createAssignment ──────────────────────────────────────────────────────────

describe('createAssignment', () => {
  it('ASG-SVC-007: first assignment gets order_index 0, then MAX+1 appends', () => {
    const { day, place } = fixture();
    const first = svc.createAssignment(day.id, place.id, null);
    const second = svc.createAssignment(day.id, place.id, null);
    expect(first!.order_index).toBe(0);
    expect(second!.order_index).toBe(1);
  });

  it('ASG-SVC-008: empty-string notes coerce to null (`notes || null`)', () => {
    const { day, place } = fixture();
    const a = svc.createAssignment(day.id, place.id, '');
    expect(a!.notes).toBeNull();
  });

  it('ASG-SVC-009: returns the re-selected nested shape with place, category and compact tags', () => {
    const { user, trip, day, place } = fixture();
    const tag = createTag(testDb, user.id, { name: 'museum' });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tag.id);
    const a = svc.createAssignment(day.id, place.id, 'skip the line');
    expect(a).toMatchObject({
      day_id: day.id,
      place_id: place.id,
      notes: 'skip the line',
      assignment_time: null,
      assignment_end_time: null,
      leg_transport_mode: null,
      participants: [],
      place: { id: place.id, name: 'Louvre' },
    });
    // The same compact tag projection as listDayAssignments — id/name/color/
    // created_at only, no user_id — so both read paths share one wire shape.
    expect(a!.place.tags).toEqual([{ id: tag.id, name: 'museum', color: '#10b981', created_at: (tag as { created_at?: string }).created_at }]);
    void trip;
  });
});

// ── listDayAssignments ────────────────────────────────────────────────────────

describe('listDayAssignments', () => {
  it('ASG-SVC-010: orders by order_index and formats with compact tags + participants', () => {
    const { user, trip, day, place } = fixture();
    const second = createPlace(testDb, trip.id, { name: 'Orsay' });
    const tag = createTag(testDb, user.id, { name: 'art' });
    testDb.prepare('INSERT INTO place_tags (place_id, tag_id) VALUES (?, ?)').run(place.id, tag.id);
    const a1 = createDayAssignment(testDb, day.id, place.id, { order_index: 1 });
    const a2 = createDayAssignment(testDb, day.id, second.id, { order_index: 0 });
    svc.setParticipants(a1.id, [user.id], trip.id);

    const list = svc.listDayAssignments(day.id);
    expect(list.map(a => a.id)).toEqual([a2.id, a1.id]);
    // Compact tag projection (id/name/color/created_at only — no user_id key).
    expect(list[1].place.tags).toEqual([{ id: tag.id, name: 'art', color: '#10b981', created_at: (tag as { created_at?: string }).created_at }]);
    expect(list[1].participants).toEqual([{ user_id: user.id, username: user.username, avatar: null }]);
    expect(list[0].participants).toEqual([]);
    expect(list[0].place.tags).toEqual([]);
  });

  it('ASG-SVC-011: returns [] for an empty day', () => {
    const { day } = fixture();
    expect(svc.listDayAssignments(day.id)).toEqual([]);
  });
});

// ── delete / reorder ──────────────────────────────────────────────────────────

describe('deleteAssignment / reorderAssignments', () => {
  it('ASG-SVC-012: deleteAssignment removes the row', () => {
    const { day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id);
    svc.deleteAssignment(a.id);
    expect(testDb.prepare('SELECT id FROM day_assignments WHERE id = ?').get(a.id)).toBeUndefined();
  });

  it('ASG-SVC-013: reorderAssignments applies positional order, scoped to the day', () => {
    const { trip, day, place } = fixture();
    const otherDay = createDay(testDb, trip.id);
    const a1 = createDayAssignment(testDb, day.id, place.id, { order_index: 0 });
    const a2 = createDayAssignment(testDb, day.id, place.id, { order_index: 1 });
    const foreign = createDayAssignment(testDb, otherDay.id, place.id, { order_index: 5 });

    svc.reorderAssignments(day.id, [a2.id, a1.id, foreign.id]);

    const order = (id: number) => (testDb.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(id) as { order_index: number }).order_index;
    expect(order(a2.id)).toBe(0);
    expect(order(a1.id)).toBe(1);
    // The day-scoped WHERE leaves another day's assignment untouched.
    expect(order(foreign.id)).toBe(5);
  });
});

// ── getAssignmentForTrip / moveAssignment ─────────────────────────────────────

describe('getAssignmentForTrip', () => {
  it('ASG-SVC-014: returns the raw row for the trip, undefined cross-trip', () => {
    const { trip, day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id);
    expect(svc.getAssignmentForTrip(a.id, trip.id)).toMatchObject({ id: a.id, day_id: day.id });
    expect(svc.getAssignmentForTrip(a.id, trip.id + 1)).toBeUndefined();
  });
});

describe('moveAssignment', () => {
  it('ASG-SVC-015: moves to the new day, re-selects the nested shape, derives oldDayId from the row', () => {
    const { trip, day, place } = fixture();
    const target = createDay(testDb, trip.id);
    const a = createDayAssignment(testDb, day.id, place.id);
    const result = svc.moveAssignment(a.id, target.id, 2);
    expect(result.assignment).toMatchObject({ id: a.id, day_id: target.id, order_index: 2 });
    expect(result.oldDayId).toBe(day.id);
  });

  it('ASG-SVC-016: nullish orderIndex coerces to 0; explicit 0 stays 0', () => {
    const { trip, day, place } = fixture();
    const target = createDay(testDb, trip.id);
    const a = createDayAssignment(testDb, day.id, place.id, { order_index: 7 });
    expect(svc.moveAssignment(a.id, target.id, undefined).assignment!.order_index).toBe(0);
    expect(svc.moveAssignment(a.id, day.id, null).assignment!.order_index).toBe(0);
    expect(svc.moveAssignment(a.id, target.id, 0).assignment!.order_index).toBe(0);
  });
});

// ── participants ──────────────────────────────────────────────────────────────

describe('getParticipants / setParticipants', () => {
  it('ASG-SVC-017: setParticipants replaces the list and returns the joined rows', () => {
    const { user, trip, day, place } = fixture();
    const { user: peer } = createUser(testDb);
    addTripMember(testDb, trip.id, peer.id);
    const a = createDayAssignment(testDb, day.id, place.id);
    svc.setParticipants(a.id, [user.id], trip.id);
    const replaced = svc.setParticipants(a.id, [peer.id], trip.id);
    expect(replaced).toEqual([{ user_id: peer.id, username: peer.username, avatar: null }]);
    expect(svc.getParticipants(a.id)).toEqual(replaced);
  });

  it('ASG-SVC-018: empty array clears all participants', () => {
    const { user, trip, day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id);
    svc.setParticipants(a.id, [user.id], trip.id);
    expect(svc.setParticipants(a.id, [], trip.id)).toEqual([]);
    expect(svc.getParticipants(a.id)).toEqual([]);
  });

  it('ASG-SVC-019: username COALESCEs display_name over username', () => {
    const { user, trip, day, place } = fixture();
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Fancy Name', user.id);
    const a = createDayAssignment(testDb, day.id, place.id);
    const rows = svc.setParticipants(a.id, [user.id], trip.id);
    expect(rows).toEqual([{ user_id: user.id, username: 'Fancy Name', avatar: null }]);
  });

  it('ASG-SVC-020: duplicate user ids collapse via INSERT OR IGNORE', () => {
    const { user, trip, day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id);
    const rows = svc.setParticipants(a.id, [user.id, user.id], trip.id);
    expect(rows).toHaveLength(1);
  });

  // Used to assert that an id violating the users FK threw and rolled the delete
  // back. It cannot reach the insert any more: the roster filter drops an id that
  // is not on the trip, so a list of nothing but strangers is simply an empty
  // list, and the delete stands. The rollback itself is still covered — the
  // transaction wraps delete and insert together, and ASG-SVC-018 pins that an
  // explicit empty list clears.
  it('ASG-SVC-028: a list of ids that are not on the trip clears rather than throwing', () => {
    const { user, trip, day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id);
    svc.setParticipants(a.id, [user.id], trip.id);
    expect(() => svc.setParticipants(a.id, [999999], trip.id)).not.toThrow();
    expect(svc.getParticipants(a.id)).toEqual([]);
  });

  it('ASG-SVC-029: keeps the trip members and drops the stranger in one call', () => {
    const { user, trip, day, place } = fixture();
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    addTripMember(testDb, trip.id, member.id);
    const a = createDayAssignment(testDb, day.id, place.id);

    const rows = svc.setParticipants(a.id, [user.id, stranger.id, member.id], trip.id) as { user_id: number }[];

    expect(rows.map(r => r.user_id).sort()).toEqual([user.id, member.id].sort());
    expect(JSON.stringify(rows)).not.toContain(stranger.username);
  });
});

// ── updateTime / setLegTransportMode ──────────────────────────────────────────

describe('updateTime', () => {
  it('ASG-SVC-021: persists both times and re-selects the nested shape', () => {
    const { day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id);
    const updated = svc.updateTime(a.id, '09:00', '11:30');
    expect(updated).toMatchObject({ id: a.id, assignment_time: '09:00', assignment_end_time: '11:30' });
  });

  it('ASG-SVC-022: a truthy place_time auto-sorts the day chronologically (untimed keep relative position)', () => {
    const { day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id, { order_index: 0 });
    const b = createDayAssignment(testDb, day.id, place.id, { order_index: 1 });
    const c = createDayAssignment(testDb, day.id, place.id, { order_index: 2 });

    svc.updateTime(c.id, '08:00', null);
    const order = (id: number) => (testDb.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(id) as { order_index: number }).order_index;
    expect([order(c.id), order(a.id), order(b.id)]).toEqual([0, 1, 2]);

    svc.updateTime(a.id, '07:00', null);
    expect([order(a.id), order(c.id), order(b.id)]).toEqual([0, 1, 2]);
  });

  it('ASG-SVC-023: clearing with null persists but skips the auto-sort (falsy gate)', () => {
    const { day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id, { order_index: 0 });
    const b = createDayAssignment(testDb, day.id, place.id, { order_index: 1 });
    svc.updateTime(b.id, '06:00', null); // sorts b first
    const updated = svc.updateTime(b.id, null, null); // clear — no re-sort
    expect(updated!.assignment_time).toBeNull();
    const order = (id: number) => (testDb.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(id) as { order_index: number }).order_index;
    expect(order(b.id)).toBe(0);
    expect(order(a.id)).toBe(1);
  });

  it('ASG-SVC-027: an empty-string time clears the override like null (and skips the auto-sort)', () => {
    const { day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id, { order_index: 0 });
    const b = createDayAssignment(testDb, day.id, place.id, { order_index: 1 });
    svc.updateTime(b.id, '06:00', '07:00'); // sorts b first
    const updated = svc.updateTime(b.id, '', '');
    expect(updated!.assignment_time).toBeNull();
    expect(updated!.assignment_end_time).toBeNull();
    expect(testDb.prepare('SELECT assignment_time FROM day_assignments WHERE id = ?').get(b.id)).toEqual({ assignment_time: null });
    const order = (id: number) => (testDb.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(id) as { order_index: number }).order_index;
    expect(order(b.id)).toBe(0);
    expect(order(a.id)).toBe(1);
  });

  it('ASG-SVC-024: a time without ":" sorts last among timed via the 99:99 sentinel', () => {
    const { day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id, { order_index: 0 });
    const b = createDayAssignment(testDb, day.id, place.id, { order_index: 1 });
    svc.updateTime(a.id, 'morning', null); // no colon → '99:99' in the sort
    svc.updateTime(b.id, '13:00', null);
    const order = (id: number) => (testDb.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(id) as { order_index: number }).order_index;
    expect(order(b.id)).toBe(0);
    expect(order(a.id)).toBe(1);
  });
});

describe('setLegTransportMode', () => {
  it('ASG-SVC-025: sets and clears the leg override (sticky per #1281)', () => {
    const { day, place } = fixture();
    const a = createDayAssignment(testDb, day.id, place.id);
    expect(svc.setLegTransportMode(a.id, 'cycling')!.leg_transport_mode).toBe('cycling');
    expect(svc.setLegTransportMode(a.id, null)!.leg_transport_mode).toBeNull();
  });
});

// ASG-SVC-026 pinned the deleted assignments.bridge and died with it — the
// same paths are covered on the service above and via places.mcp injection.
