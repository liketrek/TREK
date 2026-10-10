import { DayNotes } from '../../../../src/db/entities/DayNotes.entity';
import type { DayNotesRepository } from '../../../../src/db/repositories/DayNotes.repository';
import { DB_TIMESTAMP_RE } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createDay, createDayNote, createTrip, createUser } from '../../../helpers/factories';
import { findRow, insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let notes: DayNotesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  notes = t.repo(DayNotes);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('DayNotesRepository timestamps', () => {
  it('NOTEREPO-001: an ORM insert leaves created_at to the column default, as text', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const row = await notes.createNote({
      day_id: day.id,
      trip_id: trip.id,
      text: 'Lunch',
      time: null,
      icon: '📝',
      sort_order: 0,
      color: null,
    });
    // test-sql-allow: typeof() reports the SQLite storage class of the stored value, which no entity maps.
    const stored = testDb
      .prepare('SELECT created_at, typeof(created_at) AS kind FROM day_notes WHERE id = ?')
      .get(row.id) as { created_at: string; kind: string };
    expect(stored.kind).toBe('text');
    expect(stored.created_at).toMatch(DB_TIMESTAMP_RE);
    expect(row.created_at).toBe(stored.created_at);
  });

  it('NOTEREPO-002: the returned row is the SELECT * row, with the values the caller passed written verbatim', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const row = await notes.createNote({
      day_id: day.id,
      trip_id: trip.id,
      text: 'Lunch',
      time: null,
      icon: '📝',
      sort_order: 0,
      color: null,
    });
    // test-sql-allow: the raw full row is the parity oracle the repository's return value is compared against.
    expect(row).toStrictEqual(testDb.prepare('SELECT * FROM day_notes WHERE id = ?').get(row.id));
    expect(row.icon).toBe('📝');
    expect(row.sort_order).toBe(0);
  });

  it('NOTEREPO-003: date() still works on a row the ORM wrote', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const row = await notes.createNote({
      day_id: day.id,
      trip_id: trip.id,
      text: 'Lunch',
      time: null,
      icon: '📝',
      sort_order: 0,
      color: null,
    });
    // test-sql-allow: the point is that SQLite's own date() parses the stored value, so the read has to be SQL.
    const d = testDb.prepare('SELECT date(created_at) AS d FROM day_notes WHERE id = ?').get(row.id) as { d: string };
    expect(d.d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('NOTEREPO-004: throws when the read-back after insert finds no row (coverage: the guard branch)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const spy = vi.spyOn(notes, 'findOne').mockResolvedValueOnce(null);
    await expect(
      notes.createNote({
        day_id: day.id,
        trip_id: trip.id,
        text: 'Ghost',
        time: null,
        icon: null,
        sort_order: 0,
        color: null,
      }),
    ).rejects.toThrow('createNote: read-back after insert found no row');
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 2 (DY4) — DaysService.list's day_notes batch load.
// ---------------------------------------------------------------------------

describe('DayNotesRepository.listByDayIds (DY4)', () => {
  it('NOTEREPO-005: an empty day_ids array short-circuits to [] without querying', async () => {
    const connection = t.orm.em.getConnection();
    const spy = vi.spyOn(connection, 'execute');
    expect(await notes.listByDayIds([])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('NOTEREPO-006: spans several days, ordered by sort_order ASC then created_at ASC', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const dayA = createDay(testDb, trip.id, { day_number: 1 });
    const dayB = createDay(testDb, trip.id, { day_number: 2 });
    createDayNote(testDb, dayA.id, trip.id, { text: 'Second', sort_order: 2 });
    createDayNote(testDb, dayA.id, trip.id, { text: 'First', sort_order: 1 });
    createDayNote(testDb, dayB.id, trip.id, { text: 'Only' });

    const rows = await notes.listByDayIds([dayA.id, dayB.id]);
    expect(rows.map((r) => r.text)).toEqual(['First', 'Second', 'Only']);
    expect(rows.map((r) => r.day_id)).toEqual([dayA.id, dayA.id, dayB.id]);
  });

  it('NOTEREPO-007: a day with no notes contributes no rows', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    expect(await notes.listByDayIds([day.id])).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // Task 9 fix wave (B-M3): relabelled. The Task 2 review comment this
  // replaces claimed `listByDayIds` being `find`-based made the identity-map
  // guard "a real, provable guarantee here, not 'proven regardless'" — that
  // is not true: `TrekRepository.find` applies `disableIdentityMap: true` to
  // EVERY read by default (rule 14), `listByDayIds` never opts in, and its
  // filter (`day: { $in: day_ids }`) is not a primary-key lookup regardless.
  // There is no live identity-map entry here to bypass. The setup read still
  // passes `{ disableIdentityMap: false }` so it genuinely caches a managed
  // entity first (a bare `find({})` would be a no-op under the base's own
  // default, the same vacuousness `DAYREPO-018` had) — but what this proves
  // is a DB round-trip (a text write after an unrelated wider read is
  // visible), not an identity-map bypass.
  // ---------------------------------------------------------------------------

  it('NOTEREPO-008 (fresh after a raw UPDATE, not D-shape): a text write after an unrelated identity-map read is visible in the FIRST wider listByDayIds', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id, { text: 'Old text' });
    await t.repo(DayNotes).find({}, { disableIdentityMap: false }); // populate the identity map with the managed note entity
    // test-sql-allow: the out-of-band write this case is about has to bypass every EntityManager, the one under test included.
    testDb.prepare('UPDATE day_notes SET text = ? WHERE id = ?').run('Fresh text', note.id);

    const rows = await notes.listByDayIds([day.id]);
    expect(rows).toEqual([expect.objectContaining({ id: note.id, text: 'Fresh text' })]);
  });
});

// ── Plan 3c Task 8 (`TripsService.copy`, TP70/TP71) — additive ──────────────

describe('DayNotesRepository.listByTrip (TP70)', () => {
  // Task 9 fix wave (B-M4, rule 19): widened from an ids-only assertion to
  // full-row parity on a fully seeded fixture — every nullable column
  // non-null in one row, null in the other, plus a unicode string and a
  // '007'-style digit string — `toEqual(<the legacy SELECT * FROM day_notes
  // WHERE trip_id = ? run raw>)`, so a renamed/dropped column or a changed
  // row order would fail this, not just the id list.
  it('NOTEREPO-009: every note of the trip, scoped by trip_id (not day_id) — toEqual(legacy) on a fully seeded fixture', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);

    // Row A: every nullable column non-null, a unicode string and a
    // '007'-style digit string among the values.
    const n1 = await insertRow(t, DayNotes, {
      day: day.id,
      trip: trip.id,
      text: 'Keep — 日本 ☕️ 007',
      time: '09:00',
      icon: '🗒️',
      sort_order: 1,
      color: '#00ff00',
    });
    // Row B: every nullable column NULL.
    const n2 = await insertRow(t, DayNotes, {
      day: day.id,
      trip: trip.id,
      text: 'Bare note',
      time: null,
      icon: null,
      sort_order: null,
      color: null,
    });

    const otherDay = createDay(testDb, other.id);
    createDayNote(testDb, otherDay.id, other.id, { text: 'Not this trip' });

    const rows = await notes.listByTrip(trip.id);
    // test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
    const legacy = testDb.prepare('SELECT * FROM day_notes WHERE trip_id = ?').all(trip.id);
    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).toEqual([n1, n2]);
  });

  it('NOTEREPO-010: a trip with no notes returns []', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await notes.listByTrip(trip.id)).toEqual([]);
  });
});

describe('DayNotesRepository.insertNoteCopy (TP71)', () => {
  it('NOTEREPO-011: writes the 6-column copy set (no color — left NULL, unlike createNote)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);

    const newId = await notes.insertNoteCopy({
      day_id: day.id,
      trip_id: trip.id,
      text: 'Copied note',
      time: '09:00',
      icon: '🎒',
      sort_order: 5,
    });

    const { day_id, trip_id, text, time, icon, sort_order, color } = (await findRow(t, DayNotes, { id: newId }))!;
    expect({ day_id, trip_id, text, time, icon, sort_order, color }).toEqual({
      day_id: day.id,
      trip_id: trip.id,
      text: 'Copied note',
      time: '09:00',
      icon: '🎒',
      sort_order: 5,
      color: null,
    });
  });
});

describe('DayNotesRepository.listByDayAndTrip (Plan 4 Task 1, day-notes.service.ts::list)', () => {
  it('NOTEREPO-012: scoped to BOTH day and trip, ordered by sort_order then created_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const otherDay = createDay(testDb, trip.id);
    const second = createDayNote(testDb, day.id, trip.id, { sort_order: 5 });
    const first = createDayNote(testDb, day.id, trip.id, { sort_order: 1 });
    createDayNote(testDb, otherDay.id, trip.id);

    // test-sql-allow: the legacy statement is the parity oracle the repository is compared against.
    const legacy = testDb
      .prepare('SELECT * FROM day_notes WHERE day_id = ? AND trip_id = ? ORDER BY sort_order ASC, created_at ASC')
      .all(day.id, trip.id);
    const rows = await notes.listByDayAndTrip(day.id, trip.id);
    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).toEqual([first.id, second.id]);
  });

  it('NOTEREPO-013: a day with no notes returns []', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    expect(await notes.listByDayAndTrip(day.id, trip.id)).toEqual([]);
  });
});

describe('DayNotesRepository.findByIdDayTrip (Plan 4 Task 1, day-notes.service.ts::getNote)', () => {
  it('NOTEREPO-014: found only under its own id/day/trip triple', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const otherDay = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id, { text: 'Lunch' });

    expect(await notes.findByIdDayTrip(note.id, day.id, trip.id)).toEqual(note);
    expect(await notes.findByIdDayTrip(note.id, otherDay.id, trip.id)).toBeUndefined();
    expect(await notes.findByIdDayTrip(note.id, day.id, trip.id + 1)).toBeUndefined();
  });
});

describe('DayNotesRepository.updateNote (Plan 4 Task 1, day-notes.service.ts::update)', () => {
  it('NOTEREPO-015: updates every bound column and returns the re-selected row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id, { text: 'Lunch', time: '12:00', icon: '🍜', sort_order: 2 });

    const updated = await notes.updateNote(note.id, {
      text: 'Dinner',
      time: '19:00',
      icon: '🍣',
      sort_order: 3,
      color: '#2563eb',
    });

    expect(updated).toMatchObject({
      id: note.id,
      text: 'Dinner',
      time: '19:00',
      icon: '🍣',
      sort_order: 3,
      color: '#2563eb',
    });
    const stored = (await findRow(t, DayNotes, { id: note.id }))!;
    expect({
      text: stored.text,
      time: stored.time,
      icon: stored.icon,
      sort_order: stored.sort_order,
      color: stored.color,
    }).toEqual({ text: 'Dinner', time: '19:00', icon: '🍣', sort_order: 3, color: '#2563eb' });
  });

  it('NOTEREPO-016: undefined for an id that does not exist', async () => {
    expect(
      await notes.updateNote(999999, { text: 'x', time: null, icon: null, sort_order: null, color: null }),
    ).toBeUndefined();
  });
});

describe('DayNotesRepository.deleteById (Plan 4 Task 1, day-notes.service.ts::remove)', () => {
  it('NOTEREPO-017: deletes by bare id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const note = createDayNote(testDb, day.id, trip.id);

    await notes.deleteById(note.id);

    expect(await findRow(t, DayNotes, { id: note.id })).toBeNull();
  });

  it('NOTEREPO-018: deleting an id that does not exist is a no-op, not an error', async () => {
    await expect(notes.deleteById(999999)).resolves.toBeUndefined();
  });
});

describe('DayNotesRepository.listForPublicApi (Plan 4 Task 1, public-api.service.ts::dayNotesByDay)', () => {
  it('NOTEREPO-019: day_id/text/time only, ordered by day_id then sort_order, scoped to the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const dayA = createDay(testDb, trip.id);
    const dayB = createDay(testDb, trip.id);
    createDayNote(testDb, dayB.id, trip.id, { text: 'B-second', sort_order: 5 });
    createDayNote(testDb, dayA.id, trip.id, { text: 'A-first', sort_order: 1 });
    createDayNote(testDb, dayB.id, trip.id, { text: 'B-first', sort_order: 1 });
    createDayNote(testDb, createDay(testDb, other.id).id, other.id, { text: 'Not this trip' });

    const rows = await notes.listForPublicApi(trip.id);

    expect(rows).toEqual([
      { day_id: dayA.id, text: 'A-first', time: null },
      { day_id: dayB.id, text: 'B-first', time: null },
      { day_id: dayB.id, text: 'B-second', time: null },
    ]);
  });

  it('NOTEREPO-020: empty array for a trip with no notes', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await notes.listForPublicApi(trip.id)).toEqual([]);
  });
});
