/**
 * AssignmentParticipantsRepository.listForAssignments (Plan 3c Task 1, QH3):
 * the batch participants-by-assignment loader behind
 * `QueryHelpersService.loadParticipantsByAssignmentIds`, moved off
 * `query-helpers.service.ts`. Deliberately no `COALESCE(display_name,
 * username)` — unlike `AssignmentsService.getParticipants` (AS15) — see the
 * repository's own docstring.
 */
import { AssignmentParticipants } from '../../../../src/db/entities/AssignmentParticipants.entity';
import type { AssignmentParticipantsRepository } from '../../../../src/db/repositories/AssignmentParticipants.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let participants: AssignmentParticipantsRepository;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  participants = t.repo(AssignmentParticipants);
  uow = new UnitOfWork(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function addParticipant(assignmentId: number, userId: number): void {
  testDb
    .prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)')
    .run(assignmentId, userId);
}

async function withQueryCount<T>(fn: () => Promise<T>): Promise<{ value: T; queries: number }> {
  const connection = t.orm.em.getConnection();
  const spy = vi.spyOn(connection, 'execute');
  try {
    const value = await fn();
    return { value, queries: spy.mock.calls.length };
  } finally {
    spy.mockRestore();
  }
}

describe('AssignmentParticipantsRepository.listForAssignments', () => {
  it('ASSIGNPARTREPO-001: an empty assignmentIds array short-circuits to [] without querying', async () => {
    const { value, queries } = await withQueryCount(() => participants.listForAssignments([]));
    expect(value).toEqual([]);
    expect(queries).toBe(0);
  });

  it("ASSIGNPARTREPO-002: joins the user's username/avatar, with NO COALESCE(display_name, username) — raw username only", async () => {
    const { user: owner } = createUser(testDb);
    const { user: participant } = createUser(testDb, { username: 'raw-username' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('A Display Name', participant.id);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    addParticipant(assignment.id, participant.id);

    const rows = await participants.listForAssignments([assignment.id]);
    expect(rows).toEqual([
      { assignment_id: assignment.id, user_id: participant.id, username: 'raw-username', avatar: null },
    ]);
  });

  it('ASSIGNPARTREPO-003: batches across several assignments', async () => {
    const { user: owner } = createUser(testDb);
    const { user: p1 } = createUser(testDb);
    const { user: p2 } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const placeA = createPlace(testDb, trip.id, { name: 'A' });
    const placeB = createPlace(testDb, trip.id, { name: 'B' });
    const a1 = createDayAssignment(testDb, day.id, placeA.id);
    const a2 = createDayAssignment(testDb, day.id, placeB.id);
    addParticipant(a1.id, p1.id);
    addParticipant(a2.id, p2.id);

    const rows = await participants.listForAssignments([a1.id, a2.id]);
    expect(rows.map((r) => r.assignment_id).sort()).toEqual([a1.id, a2.id].sort());
  });

  it('ASSIGNPARTREPO-004: an assignment with no participants contributes no rows', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    expect(await participants.listForAssignments([assignment.id])).toEqual([]);
  });

  // Task 9 fix wave (B-M3): relabelled. `listForAssignments` is a
  // `qb().execute('all', false)` projection, and `TrekRepository` applies
  // `disableIdentityMap: true` to every read by construction anyway, so
  // there is no live identity-map entry here to bypass — this proves a DB
  // round-trip, not an identity-map bypass.
  it('ASSIGNPARTREPO-005 (fresh after a raw UPDATE, not D-shape): a participant added after an unrelated identity-map read is visible in the FIRST wider projection', async () => {
    const { user: owner } = createUser(testDb);
    const { user: participant } = createUser(testDb, { username: 'fresh-participant' });
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    // Task 2 review (task-2-review.md, L1, program note): `{
    // disableIdentityMap: false }` on the setup read, for consistency with
    // every other D-shape test in this file — this particular read is
    // genuinely empty (no participant row exists yet), so the flag changes
    // nothing here, but the mechanical fix is applied uniformly rather than
    // singled out.
    await t.repo(AssignmentParticipants).find({}, { disableIdentityMap: false }); // populate the identity map with an unrelated (empty) read
    addParticipant(assignment.id, participant.id);
    const rows = await participants.listForAssignments([assignment.id]);
    expect(rows).toEqual([
      { assignment_id: assignment.id, user_id: participant.id, username: 'fresh-participant', avatar: null },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 3 (`AssignmentsService`) — appended after Task 1's own
// `listForAssignments` suite above, per this task's file-ownership rule.
// The whole file is committed under this task's message; see its report for
// the coordination note.
// ---------------------------------------------------------------------------

/** The AS2/AS15/AS31 statement, run raw — the parity oracle every assertion below is checked against. */
function legacyParticipantRows(assignmentId: number): unknown {
  return testDb
    .prepare(
      `
    SELECT ap.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM assignment_participants ap
    JOIN users u ON ap.user_id = u.id
    WHERE ap.assignment_id = ?
  `,
    )
    .all(assignmentId);
}

describe('AssignmentParticipantsRepository.listWithDisplayName (AS2/AS15/AS31)', () => {
  it('ASSIGNPARTREPO-006: no assignment_id key — a narrower row than listForAssignments (QH3)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: participant } = createUser(testDb, { username: 'raw-username' });
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    addParticipant(assignment.id, participant.id);

    const rows = await participants.listWithDisplayName(assignment.id);
    expect(rows).toStrictEqual(legacyParticipantRows(assignment.id));
    expect(rows[0]).not.toHaveProperty('assignment_id');
  });

  it('ASSIGNPARTREPO-007: username COALESCEs display_name over username, when set', async () => {
    const { user: owner } = createUser(testDb);
    const { user: withDisplayName } = createUser(testDb, { username: 'raw-username' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Fancy Name', withDisplayName.id);
    const { user: withoutDisplayName } = createUser(testDb, { username: 'plain-username' });
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    addParticipant(assignment.id, withDisplayName.id);
    addParticipant(assignment.id, withoutDisplayName.id);

    const rows = await participants.listWithDisplayName(assignment.id);
    expect(rows).toEqual(
      expect.arrayContaining([
        { user_id: withDisplayName.id, username: 'Fancy Name', avatar: null },
        { user_id: withoutDisplayName.id, username: 'plain-username', avatar: null },
      ]),
    );
    expect(rows).toStrictEqual(legacyParticipantRows(assignment.id));
  });

  it('ASSIGNPARTREPO-008: an assignment with no participants returns []', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    expect(await participants.listWithDisplayName(assignment.id)).toEqual([]);
  });

  // Task 9 fix wave (B-M3): relabelled — same reasoning as ASSIGNPARTREPO-005
  // above: a `qb().execute('all', false)` projection never hydrates an
  // entity into the identity map, and the base default leaves it disabled
  // anyway, so this proves a DB round-trip, not an identity-map bypass.
  it('ASSIGNPARTREPO-009 (fresh after a raw UPDATE, not D-shape): a participant added after an unrelated identity-map read is visible in the FIRST wider projection', async () => {
    const { user: owner } = createUser(testDb);
    const { user: participant } = createUser(testDb, { username: 'fresh-participant-2' });
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await t.repo(AssignmentParticipants).find({}, { disableIdentityMap: false });
    addParticipant(assignment.id, participant.id);
    const rows = await participants.listWithDisplayName(assignment.id);
    expect(rows).toEqual([{ user_id: participant.id, username: 'fresh-participant-2', avatar: null }]);
  });
});

describe('AssignmentParticipantsRepository.deleteForAssignment / insertIgnore (AS29/AS30)', () => {
  it('ASSIGNPARTREPO-010: deleteForAssignment removes every row for the assignment, none other', async () => {
    const { user: owner } = createUser(testDb);
    const { user: p1 } = createUser(testDb);
    const { user: p2 } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const a1 = createDayAssignment(testDb, day.id, place.id);
    const a2 = createDayAssignment(testDb, day.id, place.id);
    addParticipant(a1.id, p1.id);
    addParticipant(a2.id, p2.id);

    await withRequestContext(t.orm, async () => {
      await participants.deleteForAssignment(a1.id);
    });

    expect(await participants.listWithDisplayName(a1.id)).toEqual([]);
    expect(await participants.listWithDisplayName(a2.id)).toHaveLength(1);
  });

  it('ASSIGNPARTREPO-011: insertIgnore writes every id once; a duplicate id in the same call collapses to one row', async () => {
    const { user: owner } = createUser(testDb);
    const { user: p1 } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);

    await withRequestContext(t.orm, async () => {
      await participants.insertIgnore(assignment.id, [p1.id, p1.id]);
    });

    const rows = testDb
      .prepare('SELECT user_id FROM assignment_participants WHERE assignment_id = ?')
      .all(assignment.id);
    expect(rows).toEqual([{ user_id: p1.id }]);
  });

  it('ASSIGNPARTREPO-012: insertIgnore does not conflict with an existing row for a DIFFERENT assignment', async () => {
    const { user: owner } = createUser(testDb);
    const { user: shared } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const a1 = createDayAssignment(testDb, day.id, place.id);
    const a2 = createDayAssignment(testDb, day.id, place.id);
    addParticipant(a1.id, shared.id);

    await withRequestContext(t.orm, async () => {
      await participants.insertIgnore(a2.id, [shared.id]);
    });

    expect(await participants.listWithDisplayName(a1.id)).toHaveLength(1);
    expect(await participants.listWithDisplayName(a2.id)).toHaveLength(1);
  });

  it('ASSIGNPARTREPO-013: an empty user_ids array writes nothing (0 queries)', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);

    const { queries } = await withQueryCount(() =>
      withRequestContext(t.orm, async () => {
        await participants.insertIgnore(assignment.id, []);
      }),
    );
    expect(queries).toBe(0);
  });

  it('ASSIGNPARTREPO-014: deleteForAssignment + insertIgnore inside a rolled-back transaction leave the row unchanged (joins the ambient transaction)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: p1 } = createUser(testDb);
    const { user: p2 } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    addParticipant(assignment.id, p1.id);

    let caught: unknown;
    try {
      await withRequestContext(t.orm, async () => {
        await uow.transactional(async () => {
          await participants.deleteForAssignment(assignment.id);
          await participants.insertIgnore(assignment.id, [p2.id]);
          throw new Error('force rollback');
        });
      });
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toBe('force rollback');

    const rows = testDb
      .prepare('SELECT user_id FROM assignment_participants WHERE assignment_id = ?')
      .all(assignment.id);
    expect(rows).toEqual([{ user_id: p1.id }]);
  });
});

// ── Plan 3c Task 8 (`TripsService.copy`, TP53) — additive ───────────────────

describe('AssignmentParticipantsRepository.listForTrip (TP53)', () => {
  it('ASSIGNPARTREPO-015: the two-hop join scopes participants to the trip, returning only assignment_id/user_id', async () => {
    const { user: owner } = createUser(testDb);
    const { user: p1 } = createUser(testDb);
    const { user: p2 } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const other = createTrip(testDb, owner.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    addParticipant(assignment.id, p1.id);
    addParticipant(assignment.id, p2.id);

    const otherDay = createDay(testDb, other.id);
    const otherPlace = createPlace(testDb, other.id);
    const otherAssignment = createDayAssignment(testDb, otherDay.id, otherPlace.id);
    addParticipant(otherAssignment.id, p1.id);

    const rows = await participants.listForTrip(trip.id);
    expect(rows.map((r) => r.user_id).sort((a, b) => a - b)).toEqual([p1.id, p2.id].sort((a, b) => a - b));
    expect(rows.every((r) => r.assignment_id === assignment.id)).toBe(true);
  });

  it('ASSIGNPARTREPO-016: a trip with no participants returns []', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await participants.listForTrip(trip.id)).toEqual([]);
  });
});
