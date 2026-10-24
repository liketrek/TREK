import { coalesce, columnRef } from '../dialect/sql-functions';
import type { AssignmentParticipants } from '../entities/AssignmentParticipants.entity';
import { TrekRepository } from './_shared/trek-repository';

/** One assignment's participant, from `QueryHelpersService.loadParticipantsByAssignmentIds` (QH3). */
export interface ParticipantForAssignmentRow {
  assignment_id: number;
  user_id: number;
  username: string;
  avatar: string | null;
}

/**
 * One assignment's participant, from AS2/AS15/AS31
 * (`AssignmentsService.getAssignmentWithPlace`/`getParticipants`/
 * `setParticipants`) — narrower than `ParticipantForAssignmentRow` above
 * (no `assignment_id` — the legacy statement never selects it) and with
 * `COALESCE(display_name, username)` folded into `username`.
 */
export interface ParticipantRow {
  user_id: number;
  username: string;
  avatar: string | null;
}

export class AssignmentParticipantsRepository extends TrekRepository<AssignmentParticipants> {
  /**
   * `SELECT ap.assignment_id, ap.user_id, u.username, u.avatar
   *  FROM assignment_participants ap JOIN users u ON ap.user_id = u.id
   *  WHERE ap.assignment_id IN (${…})` (`query-helpers.service.ts:83-86`, QH3).
   *
   * Deliberately **no** `COALESCE(display_name, username)` — unlike
   * `AssignmentsService.getParticipants` (AS15), which does. The two
   * participant projections genuinely disagree on the wire (plan3c inventory
   * §1 QH3) and must stay that way; do not "fix" this one to match AS15.
   *
   * Empty `assignmentIds` short-circuits before any query, matching the
   * legacy service method.
   */
  async listForAssignments(assignmentIds: number[]): Promise<ParticipantForAssignmentRow[]> {
    if (assignmentIds.length === 0) return [];
    // `ap.assignment` selects the plain FK scalar as `assignment_id` (never
    // separately joined here). `ap.user` IS separately joined (to `u`), so
    // its id is pulled explicitly off the join instead (`u.id as user_id`)
    // — see `PlaceRatingsRepository.listForPlaces`'s docstring for why
    // selecting a relation property that is ALSO an active join's target
    // renames the column onto the joined entity's own primary key instead.
    return this.qb('ap')
      .join('ap.user', 'u')
      .select(['ap.assignment', 'u.id as user_id', 'u.username', 'u.avatar'])
      .where({ 'ap.assignment': { $in: assignmentIds } })
      .execute<ParticipantForAssignmentRow[]>('all', false);
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 3 (`AssignmentsService`) — appended after Task 1's own
  // `listForAssignments` above, per this task's coordination note (this file
  // may already carry Task 1's uncommitted method; both are kept, and the
  // whole file is committed under Task 3's message, noted in its report).
  // ---------------------------------------------------------------------------

  /**
   * AS2/AS15/AS31 (`AssignmentsService.getAssignmentWithPlace`/
   * `getParticipants`/`setParticipants`'s post-write re-select) — `SELECT
   * ap.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
   * FROM assignment_participants ap JOIN users u ON ap.user_id = u.id WHERE
   * ap.assignment_id = ?`. A SEPARATE method from `listForAssignments`
   * (QH3) above — the inventory's §18.10 finding: the two participant
   * projections genuinely disagree on the wire (this one COALESCEs
   * `display_name` over `username`, QH3 does not) and must stay that way,
   * never unified into one "shared row shaper". Also a NARROWER column set
   * than QH3's own row: the legacy AS2/AS15/AS31 statement never selects
   * `assignment_id` at all (unlike QH3, which does) — `ParticipantRow` below
   * is deliberately its own type, not `ParticipantForAssignmentRow`, so a
   * caller can never accidentally see a key this statement doesn't produce.
   */
  async listWithDisplayName(assignment_id: number): Promise<ParticipantRow[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('ap')
      .join('ap.user', 'u')
      .select(['u.id as user_id', coalesce(platform, 'u.display_name', 'u.username').as('username'), 'u.avatar'])
      .where({ 'ap.assignment': assignment_id })
      .execute<ParticipantRow[]>('all', false);
  }

  /** AS29 — `DELETE FROM assignment_participants WHERE assignment_id = ?`. */
  async deleteForAssignment(assignment_id: number): Promise<void> {
    await this.nativeDelete({ assignment: assignment_id });
  }

  /**
   * AS30 — `INSERT OR IGNORE INTO assignment_participants (assignment_id,
   * user_id) VALUES (?, ?)`, run once per id. `upsertMany` with
   * `onConflictAction: 'ignore'` on the table's real unique key
   * (`UNIQUE(assignment_id, user_id)`,
   * `Migration20200101002400_create_assignment_participants` — verified
   * against the migration, not assumed), named by entity property
   * (`assignment`/`user`, `OauthConsentsRepository.upsertGrant`'s precedent
   * for a relation-backed `onConflictFields` list). The caller only ever
   * passes a non-empty, already-roster-scoped array; the empty-array guard
   * here is defensive, matching the service's own guard.
   *
   * **Two differences from the legacy per-row loop (Task 3 review M1,
   * absorbed in Task 4), both benign today, documented so they stay that
   * way on purpose:**
   * 1. **Narrower failure mode.** `OR IGNORE` swallowed *any* constraint
   *    violation on a row; `ON CONFLICT (assignment_id, user_id) DO
   *    NOTHING` swallows only THAT unique index, and one row that violates
   *    a DIFFERENT constraint aborts the whole multi-row statement rather
   *    than being skipped. Unreachable today — AS28 roster-scopes the ids
   *    before this call, and the caller has already gated the assignment
   *    itself — but a concurrent delete of the assignment mid-request would
   *    now 500 where the legacy loop silently no-opped that one row.
   * 2. **One extra statement.** `upsertMany` issues a reload `SELECT` after
   *    the insert (`generated SQL, captured: insert … on conflict (…) do
   *    nothing returning id` then `select … from assignment_participants
   *    as a0 where (…)`) that the legacy loop never ran. Harmless — the
   *    reloaded rows are fully hydrated and unchanged, so the enclosing
   *    `em.transactional`'s closing flush emits nothing for them — but it
   *    is a genuine extra round-trip and briefly populates the identity map
   *    inside the write transaction, worth knowing if a future change here
   *    ever needs to reason about statement counts.
   */
  async insertIgnore(assignment_id: number, user_ids: number[]): Promise<void> {
    if (user_ids.length === 0) return;
    await this.upsertMany(
      user_ids.map((user_id) => ({ assignment: assignment_id, user: user_id })),
      { onConflictFields: ['assignment', 'user'], onConflictAction: 'ignore' },
    );
  }

  // ---------------------------------------------------------------------------
  // Plan 3c Task 8 (`TripsService.copy`) — additive.
  // ---------------------------------------------------------------------------

  /**
   * TP53 (`trips.service.ts::copy`'s participants read) — `SELECT ap.* FROM
   * assignment_participants ap JOIN day_assignments da ON da.id =
   * ap.assignment_id JOIN days d ON d.id = da.day_id WHERE d.trip_id = ?`,
   * the two-hop join scoping participant rows to a trip. Only `assignment_id`/
   * `user_id` are returned — the legacy `ap.*`'s own `id` column is never
   * used by the copy loop, only the two FK values it re-inserts (TP54, via
   * {@link insertIgnore} above, once per row).
   *
   * `ap.assignment` is ALSO the target of this query's own `.join('ap.assignment',
   * 'da')` — selecting it bare here would resolve through the join and emit
   * `da__id`, not the FK scalar (`DayAssignmentsRepository
   * .assignmentWithPlaceSelect`'s `category_id` docstring documents the same
   * trap) — `columnRef` selects the literal `assignment_id` column instead.
   * `ap.user` is NOT separately joined here, so it selects fine as `user_id`
   * (`TripsRepository.getOwnerId`'s `'t.user'` precedent).
   */
  async listForTrip(trip_id: number | string): Promise<{ assignment_id: number; user_id: number }[]> {
    const platform = this.getEntityManager().getPlatform();
    return this.qb('ap')
      .join('ap.assignment', 'da')
      .join('da.day', 'd')
      .select([columnRef(platform, 'ap.assignment_id').as('assignment_id'), 'ap.user'])
      .where('d.trip_id = ?', [trip_id])
      .execute<{ assignment_id: number; user_id: number }[]>('all', false);
  }
}
