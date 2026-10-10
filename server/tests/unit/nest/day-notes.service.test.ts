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

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
  };
});

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, addTripMember } from '../../helpers/factories';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { DayNotesService } from '../../../src/nest/day-notes/day-notes.service';
import type { DayNote } from '../../../src/types';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestDayNotesRepo, createTestDaysRepo, createTestTripsRepo } from '../../helpers/test-uow';
import { sharedTestOrm } from '../../helpers/test-uow';
import { findRow } from '../../helpers/factories/rows';
import { DayNotes } from '../../../src/db/entities/DayNotes.entity';
import { TripAccessService } from '../../../src/nest/trip-membership/trip-access.service';

let svc: DayNotesService;
beforeAll(async () => {
  // Plan 4 Task 2 — DayNotesService's own canAccessTrip delegate is now
  // TripsRepository.findAccessible, in the same constructor slot.
  svc = new DayNotesService(
    new TripAccessService(await createTestTripsRepo(testDb)),
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(),
    await createTestDayNotesRepo(testDb),
    await createTestDaysRepo(testDb),
  );
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
  it('DAYNOTE-SVC-001: returns trip for owner', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = await svc.verifyTripAccess(trip.id, user.id);
    expect(result).toBeDefined();
    expect(result?.id).toBe(trip.id);
  });

  it('DAYNOTE-SVC-002: returns nothing for non-member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(await svc.verifyTripAccess(trip.id, stranger.id)).toBeFalsy();
  });

  it('DAYNOTE-SVC-003: returns trip for member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect(await svc.verifyTripAccess(trip.id, member.id)).toBeDefined();
  });
});

// ── dayExists ─────────────────────────────────────────────────────────────────

describe('dayExists', () => {
  it('DAYNOTE-SVC-004: truthy only when the day belongs to the trip', async () => {
    const { trip, day } = seedTripAndDay();
    const { user: other } = createUser(testDb);
    const otherTrip = createTrip(testDb, other.id);
    expect(await svc.dayExists(day.id, trip.id)).toBeTruthy();
    expect(await svc.dayExists(day.id, otherTrip.id)).toBeFalsy();
    expect(await svc.dayExists(9999, trip.id)).toBeFalsy();
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('DAYNOTE-SVC-005: inserts and returns the re-selected row', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Lunch', '12:00', '🍜', 2) as DayNote;
    expect(note).toMatchObject({ day_id: day.id, trip_id: trip.id, text: 'Lunch', time: '12:00', icon: '🍜', sort_order: 2 });
    expect(note.id).toBeGreaterThan(0);
    // test-sql-allow: the raw full row is the oracle the service's return value is compared against.
    const row = testDb.prepare('SELECT * FROM day_notes WHERE id = ?').get(note.id);
    expect(row).toEqual(note);
  });

  it('DAYNOTE-SVC-006: trims the text on insert', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, '  Lunch  ') as DayNote;
    expect(note.text).toBe('Lunch');
  });

  it('DAYNOTE-SVC-007: empty-string time coerces to NULL (`||`, not `??`)', async () => {
    const { trip, day } = seedTripAndDay();
    expect((await svc.create(day.id, trip.id, 'a', '') as DayNote).time).toBeNull();
    expect((await svc.create(day.id, trip.id, 'b', undefined) as DayNote).time).toBeNull();
    expect((await svc.create(day.id, trip.id, 'c', null) as DayNote).time).toBeNull();
  });

  it('DAYNOTE-SVC-008: empty/absent icon falls back to 📝 (`||`, not `??`)', async () => {
    const { trip, day } = seedTripAndDay();
    expect((await svc.create(day.id, trip.id, 'a', undefined, '') as DayNote).icon).toBe('📝');
    expect((await svc.create(day.id, trip.id, 'b') as DayNote).icon).toBe('📝');
    expect((await svc.create(day.id, trip.id, 'c', undefined, null) as DayNote).icon).toBe('📝');
  });

  it('DAYNOTE-SVC-009: sort_order 0 is preserved, only undefined defaults to 9999 (`??`)', async () => {
    const { trip, day } = seedTripAndDay();
    expect((await svc.create(day.id, trip.id, 'a', undefined, undefined, 0) as DayNote).sort_order).toBe(0);
    expect((await svc.create(day.id, trip.id, 'b') as DayNote).sort_order).toBe(9999);
  });
});

// ── colour (#1629) ────────────────────────────────────────────────────────────

describe('note colours', () => {
  it('DAYNOTE-SVC-017: a palette colour is stored as given', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Passport check', null, null, 0, '#dc2626') as DayNote;
    expect(note.color).toBe('#dc2626');
  });

  it('DAYNOTE-SVC-018: no colour is the default, and stays NULL rather than empty string', async () => {
    const { trip, day } = seedTripAndDay();
    expect((await svc.create(day.id, trip.id, 'a') as DayNote).color).toBeNull();
    expect((await svc.create(day.id, trip.id, 'b', null, null, 0, null) as DayNote).color).toBeNull();
    expect((await svc.create(day.id, trip.id, 'c', null, null, 0, '') as DayNote).color).toBeNull();
  });

  it('DAYNOTE-SVC-019: a colour outside the palette is dropped, not stored', async () => {
    const { trip, day } = seedTripAndDay();
    // Anything can reach this: the Zod contract can only say "a short string".
    expect((await svc.create(day.id, trip.id, 'a', null, null, 0, '#123456') as DayNote).color).toBeNull();
    expect((await svc.create(day.id, trip.id, 'b', null, null, 0, 'red') as DayNote).color).toBeNull();
    expect((await svc.create(day.id, trip.id, 'c', null, null, 0, 'javascript:x') as DayNote).color).toBeNull();
  });

  it('DAYNOTE-SVC-020: the note survives a bad colour instead of being rejected', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Ferry at six', '18:00', null, 0, 'nonsense') as DayNote;
    expect(note.text).toBe('Ferry at six');
    expect(note.time).toBe('18:00');
  });

  it('DAYNOTE-SVC-021: update changes the colour and can clear it again', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Museum', null, null, 0, '#2563eb') as DayNote;

    expect((await svc.update(note.id, note, { color: '#16a34a' }) as DayNote).color).toBe('#16a34a');
    expect((await svc.update(note.id, (await svc.getNote(note.id, day.id, trip.id))!, { color: null }) as DayNote).color).toBeNull();
  });

  it('DAYNOTE-SVC-022: an update that says nothing about the colour keeps it', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Museum', null, null, 0, '#9333ea') as DayNote;

    const updated = await svc.update(note.id, note, { text: 'Museum, book ahead' }) as DayNote;

    expect(updated.text).toBe('Museum, book ahead');
    expect(updated.color).toBe('#9333ea');
  });
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('DAYNOTE-SVC-010: returns [] for a day without notes', async () => {
    const { trip, day } = seedTripAndDay();
    expect(await svc.list(day.id, trip.id)).toEqual([]);
  });

  it('DAYNOTE-SVC-011: orders by sort_order then created_at and scopes to day+trip', async () => {
    const { trip, day } = seedTripAndDay();
    const otherDay = createDay(testDb, trip.id);
    const second = await svc.create(day.id, trip.id, 'second', undefined, undefined, 5) as DayNote;
    const first = await svc.create(day.id, trip.id, 'first', undefined, undefined, 1) as DayNote;
    await svc.create(otherDay.id, trip.id, 'elsewhere');
    const notes = await svc.list(day.id, trip.id) as DayNote[];
    expect(notes.map((n) => n.id)).toEqual([first.id, second.id]);
  });
});

// ── getNote ───────────────────────────────────────────────────────────────────

describe('getNote', () => {
  it('DAYNOTE-SVC-012: returns the note only under its own day and trip', async () => {
    const { trip, day } = seedTripAndDay();
    const otherDay = createDay(testDb, trip.id);
    const note = await svc.create(day.id, trip.id, 'Lunch') as DayNote;
    expect(await svc.getNote(note.id, day.id, trip.id)).toEqual(note);
    expect(await svc.getNote(note.id, otherDay.id, trip.id)).toBeUndefined();
    expect(await svc.getNote(note.id, day.id, trip.id + 1)).toBeUndefined();
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('DAYNOTE-SVC-013: merges omitted fields from the current row (JS-side, full-row UPDATE)', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Lunch', '12:00', '🍜', 2) as DayNote;
    const updated = await svc.update(note.id, note, { icon: '🍣' }) as DayNote;
    expect(updated).toMatchObject({ id: note.id, text: 'Lunch', time: '12:00', icon: '🍣', sort_order: 2 });
  });

  it('DAYNOTE-SVC-014: explicit null time clears it, undefined keeps it', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Lunch', '12:00') as DayNote;
    const kept = await svc.update(note.id, note, { text: 'Lunch!' }) as DayNote;
    expect(kept.time).toBe('12:00');
    const cleared = await svc.update(note.id, kept, { time: null }) as DayNote;
    expect(cleared.time).toBeNull();
  });

  it('DAYNOTE-SVC-015: trims only the new text and preserves sort_order 0 writes', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Lunch', undefined, undefined, 5) as DayNote;
    const updated = await svc.update(note.id, note, { text: '  Dinner  ', sort_order: 0 }) as DayNote;
    expect(updated.text).toBe('Dinner');
    expect(updated.sort_order).toBe(0);
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('DAYNOTE-SVC-016: deletes by bare id (trip-scoping is the caller getNote)', async () => {
    const { trip, day } = seedTripAndDay();
    const note = await svc.create(day.id, trip.id, 'Lunch') as DayNote;
    await svc.remove(note.id);
    expect(await findRow(await sharedTestOrm(testDb), DayNotes, { id: note.id })).toBeNull();
  });
});

/**
 * canEdit is MCP-only now: the HTTP path checks the same right through
 * TripAccessGuard's @RequirePermission('day_edit'), so nothing in a controller test
 * reaches this method any more. It stays because the *.mcp.ts tools never pass through
 * an HTTP guard, and it is tested directly here for the same reason.
 */
describe('DayNotesService.canEdit', () => {
  it('DAYNOTE-SVC-090 asks for day_edit and flags a non-owner as shared', async () => {
    const checkPermission = vi.fn(() => true);
    const permissions = { checkPermission } as unknown as PermissionsService;
    const withStub = new DayNotesService(new TripAccessService(await createTestTripsRepo(testDb)), permissions, new RealtimeService(), await createTestDayNotesRepo(testDb), await createTestDaysRepo(testDb));
    const trip = { id: 1, user_id: 1 } as never;

    expect(await withStub.canEdit(trip, { id: 1, role: 'user' } as never)).toBe(true);
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 1, 1, false);

    await withStub.canEdit(trip, { id: 2, role: 'user' } as never);
    // The shared flag is what the guard has to reproduce; getting it wrong would give a
    // member the owner's rights on somebody else's trip.
    expect(checkPermission).toHaveBeenLastCalledWith('day_edit', 'user', 1, 2, true);

    checkPermission.mockReturnValue(false);
    expect(await withStub.canEdit(trip, { id: 2, role: 'user' } as never)).toBe(false);
  });
});
