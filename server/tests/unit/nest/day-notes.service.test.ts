/**
 * Unit tests for the DI-native DayNotesService — DAYNOTE-SVC-001 through
 * DAYNOTE-SVC-016. The legacy dayNoteService had no dedicated suite (it was
 * only covered transitively), so these cases are authored fresh with the DI
 * move to pin the relocated SQL and its quirks (trim-on-write, `||` empty-
 * string coercions vs the `??` sort_order default, JS-side update merge,
 * post-write re-selects). Uses a real in-memory SQLite DB so SQL logic is
 * exercised faithfully.
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
    canAccessTrip: (tripId: number | string, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: number | string, userId: number) =>
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
import { createUser, createTrip, createDay, addTripMember } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { DayNotesService } from '../../../src/nest/day-notes/day-notes.service';
import type { DayNote } from '../../../src/types';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';

const svc = new DayNotesService(new DatabaseService(testDb), new PermissionsService(new DatabaseService(testDb)), new RealtimeService());

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

function seedTripAndDay() {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const day = createDay(testDb, trip.id);
  return { user, trip, day };
}

// ── verifyTripAccess ──────────────────────────────────────────────────────────

describe('verifyTripAccess', () => {
  it('DAYNOTE-SVC-001: returns trip for owner', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = svc.verifyTripAccess(trip.id, user.id);
    expect(result).toBeDefined();
    expect(result?.id).toBe(trip.id);
  });

  it('DAYNOTE-SVC-002: returns nothing for non-member', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(svc.verifyTripAccess(trip.id, stranger.id)).toBeFalsy();
  });

  it('DAYNOTE-SVC-003: returns trip for member', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect(svc.verifyTripAccess(trip.id, member.id)).toBeDefined();
  });
});

// ── dayExists ─────────────────────────────────────────────────────────────────

describe('dayExists', () => {
  it('DAYNOTE-SVC-004: truthy only when the day belongs to the trip', () => {
    const { trip, day } = seedTripAndDay();
    const { user: other } = createUser(testDb);
    const otherTrip = createTrip(testDb, other.id);
    expect(svc.dayExists(day.id, trip.id)).toBeTruthy();
    expect(svc.dayExists(day.id, otherTrip.id)).toBeFalsy();
    expect(svc.dayExists(9999, trip.id)).toBeFalsy();
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('DAYNOTE-SVC-005: inserts and returns the re-selected row', () => {
    const { trip, day } = seedTripAndDay();
    const note = svc.create(day.id, trip.id, 'Lunch', '12:00', '🍜', 2) as DayNote;
    expect(note).toMatchObject({ day_id: day.id, trip_id: trip.id, text: 'Lunch', time: '12:00', icon: '🍜', sort_order: 2 });
    expect(note.id).toBeGreaterThan(0);
    const row = testDb.prepare('SELECT * FROM day_notes WHERE id = ?').get(note.id);
    expect(row).toEqual(note);
  });

  it('DAYNOTE-SVC-006: trims the text on insert', () => {
    const { trip, day } = seedTripAndDay();
    const note = svc.create(day.id, trip.id, '  Lunch  ') as DayNote;
    expect(note.text).toBe('Lunch');
  });

  it('DAYNOTE-SVC-007: empty-string time coerces to NULL (`||`, not `??`)', () => {
    const { trip, day } = seedTripAndDay();
    expect((svc.create(day.id, trip.id, 'a', '') as DayNote).time).toBeNull();
    expect((svc.create(day.id, trip.id, 'b', undefined) as DayNote).time).toBeNull();
    expect((svc.create(day.id, trip.id, 'c', null) as DayNote).time).toBeNull();
  });

  it('DAYNOTE-SVC-008: empty/absent icon falls back to 📝 (`||`, not `??`)', () => {
    const { trip, day } = seedTripAndDay();
    expect((svc.create(day.id, trip.id, 'a', undefined, '') as DayNote).icon).toBe('📝');
    expect((svc.create(day.id, trip.id, 'b') as DayNote).icon).toBe('📝');
    expect((svc.create(day.id, trip.id, 'c', undefined, null) as DayNote).icon).toBe('📝');
  });

  it('DAYNOTE-SVC-009: sort_order 0 is preserved, only undefined defaults to 9999 (`??`)', () => {
    const { trip, day } = seedTripAndDay();
    expect((svc.create(day.id, trip.id, 'a', undefined, undefined, 0) as DayNote).sort_order).toBe(0);
    expect((svc.create(day.id, trip.id, 'b') as DayNote).sort_order).toBe(9999);
  });
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('DAYNOTE-SVC-010: returns [] for a day without notes', () => {
    const { trip, day } = seedTripAndDay();
    expect(svc.list(day.id, trip.id)).toEqual([]);
  });

  it('DAYNOTE-SVC-011: orders by sort_order then created_at and scopes to day+trip', () => {
    const { trip, day } = seedTripAndDay();
    const otherDay = createDay(testDb, trip.id);
    const second = svc.create(day.id, trip.id, 'second', undefined, undefined, 5) as DayNote;
    const first = svc.create(day.id, trip.id, 'first', undefined, undefined, 1) as DayNote;
    svc.create(otherDay.id, trip.id, 'elsewhere');
    const notes = svc.list(day.id, trip.id) as DayNote[];
    expect(notes.map((n) => n.id)).toEqual([first.id, second.id]);
  });
});

// ── getNote ───────────────────────────────────────────────────────────────────

describe('getNote', () => {
  it('DAYNOTE-SVC-012: returns the note only under its own day and trip', () => {
    const { trip, day } = seedTripAndDay();
    const otherDay = createDay(testDb, trip.id);
    const note = svc.create(day.id, trip.id, 'Lunch') as DayNote;
    expect(svc.getNote(note.id, day.id, trip.id)).toEqual(note);
    expect(svc.getNote(note.id, otherDay.id, trip.id)).toBeUndefined();
    expect(svc.getNote(note.id, day.id, trip.id + 1)).toBeUndefined();
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('DAYNOTE-SVC-013: merges omitted fields from the current row (JS-side, full-row UPDATE)', () => {
    const { trip, day } = seedTripAndDay();
    const note = svc.create(day.id, trip.id, 'Lunch', '12:00', '🍜', 2) as DayNote;
    const updated = svc.update(note.id, note, { icon: '🍣' }) as DayNote;
    expect(updated).toMatchObject({ id: note.id, text: 'Lunch', time: '12:00', icon: '🍣', sort_order: 2 });
  });

  it('DAYNOTE-SVC-014: explicit null time clears it, undefined keeps it', () => {
    const { trip, day } = seedTripAndDay();
    const note = svc.create(day.id, trip.id, 'Lunch', '12:00') as DayNote;
    const kept = svc.update(note.id, note, { text: 'Lunch!' }) as DayNote;
    expect(kept.time).toBe('12:00');
    const cleared = svc.update(note.id, kept, { time: null }) as DayNote;
    expect(cleared.time).toBeNull();
  });

  it('DAYNOTE-SVC-015: trims only the new text and preserves sort_order 0 writes', () => {
    const { trip, day } = seedTripAndDay();
    const note = svc.create(day.id, trip.id, 'Lunch', undefined, undefined, 5) as DayNote;
    const updated = svc.update(note.id, note, { text: '  Dinner  ', sort_order: 0 }) as DayNote;
    expect(updated.text).toBe('Dinner');
    expect(updated.sort_order).toBe(0);
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('DAYNOTE-SVC-016: deletes by bare id (trip-scoping is the caller getNote)', () => {
    const { trip, day } = seedTripAndDay();
    const note = svc.create(day.id, trip.id, 'Lunch') as DayNote;
    svc.remove(note.id);
    expect(testDb.prepare('SELECT * FROM day_notes WHERE id = ?').get(note.id)).toBeUndefined();
  });
});

/**
 * canEdit is MCP-only now: the HTTP path checks the same right through
 * TripAccessGuard's @RequirePermission('day_edit'), so nothing in a controller test
 * reaches this method any more. It stays because the *.mcp.ts tools never pass through
 * an HTTP guard, and it is tested directly here for the same reason.
 */
describe('DayNotesService.canEdit', () => {
  it('DAYNOTE-SVC-090 asks for day_edit and flags a non-owner as shared', () => {
    const checkPermission = vi.fn(() => true);
    const permissions = { checkPermission } as unknown as PermissionsService;
    const withStub = new DayNotesService(new DatabaseService(testDb), permissions, new RealtimeService());
    const trip = { id: 1, user_id: 1 } as never;

    expect(withStub.canEdit(trip, { id: 1, role: 'user' } as never)).toBe(true);
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 1, 1, false);

    withStub.canEdit(trip, { id: 2, role: 'user' } as never);
    // The shared flag is what the guard has to reproduce; getting it wrong would give a
    // member the owner's rights on somebody else's trip.
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 1, 2, true);

    checkPermission.mockReturnValue(false);
    expect(withStub.canEdit(trip, { id: 2, role: 'user' } as never)).toBe(false);
  });
});
