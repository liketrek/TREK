import type { JourneyContributors } from '../entities/JourneyContributors.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** JG18's contributor-list row (`getJourneyFull`) — the junction plus the joined username/avatar. */
export interface JourneyContributorListRow {
  journey_id: number;
  user_id: number;
  role: string;
  added_at: number;
  username: string;
  avatar: string | null;
}

/** The `journey_contributors`/`users` tables {@link JourneyContributorsRepository.listForJourney} reads. */
type JourneyContributorListKyselyDB = Pick<DB, 'journey_contributors' | 'users'>;

/**
 * `journey_contributors` — a genuine TWO-column composite primary key
 * (`journey` + `user`, both `.primary()`, R3 — pinned against
 * `Migration20200101013300_journey_rebuild.ts:65-72`'s
 * `PRIMARY KEY (journey_id, user_id)` by Task 0). Plan 3g Task 1 is the
 * FIRST real consumer of this shape in the whole plan (R3/R5) — Task 2's
 * `JourneyEntryPhotosRepository` upsert is checked against
 * {@link JourneyContributorsRepository.upsertContributor}'s rendered SQL,
 * pinned in `task-1-report.md`.
 */
export class JourneyContributorsRepository extends TrekRepository<JourneyContributors> {
  /** JG4 — `canAccessJourney`'s contributor-match primitive: `SELECT 1 FROM journey_contributors WHERE journey_id = ? AND user_id = ?`. */
  async existsForUser(journeyId: number, userId: number): Promise<boolean> {
    const row = await this.qb('jc')
      .select(['jc.journey'])
      .where({ journey: journeyId, user: userId })
      .execute<unknown>('get', false);
    return !!row;
  }

  /** JG7/JG21 — `canEdit`'s edit-access primitive and `getJourneyFull`'s `myRole` resolution: `SELECT role FROM journey_contributors WHERE journey_id = ? AND user_id = ?`. */
  async findRole(journeyId: number, userId: number): Promise<string | undefined> {
    const row = await this.qb('jc')
      .select(['jc.role'])
      .where({ journey: journeyId, user: userId })
      .execute<{ role: string } | undefined>('get', false);
    return row?.role;
  }

  /** JG20/JG27 — `getJourneyFull`'s `hide_skeletons` preference read and `updateJourneyPreferences`'s re-read, one statement text. */
  async getHideSkeletons(journeyId: number, userId: number): Promise<boolean> {
    const row = await this.qb('jc')
      .select(['jc.hide_skeletons'])
      .where({ journey: journeyId, user: userId })
      .execute<{ hide_skeletons: number } | undefined>('get', false);
    return !!row?.hide_skeletons;
  }

  /** JG26 — `updateJourneyPreferences`'s write: `UPDATE journey_contributors SET hide_skeletons = ? WHERE journey_id = ? AND user_id = ?`. */
  async setHideSkeletons(journeyId: number, userId: number, value: number): Promise<void> {
    await this.nativeUpdate({ journey: journeyId, user: userId }, { hide_skeletons: value });
  }

  /** JG18 — `getJourneyFull`'s contributor list, joined to `users` for `username`/`avatar` (`avatar_url` is computed in the SERVICE, unchanged). */
  async listForJourney(journeyId: number): Promise<JourneyContributorListRow[]> {
    const rows = await this.kysely<JourneyContributorListKyselyDB>()
      .selectFrom('journey_contributors as jc')
      .innerJoin('users as u', 'u.id', 'jc.user_id')
      .select(['jc.journey_id', 'jc.user_id', 'jc.role', 'jc.added_at', 'u.username', 'u.avatar'])
      .where('jc.journey_id', '=', journeyId)
      .orderBy('jc.added_at', 'asc')
      .execute();
    return rows as JourneyContributorListRow[];
  }

  /**
   * JG10 — `createJourney`'s owner seed: a PLAIN `INSERT` (no conflict
   * handling — the row is fresh, the journey was just created). A DIFFERENT
   * statement from {@link upsertContributor} (JG117's `INSERT OR REPLACE`) —
   * do not collapse the two.
   */
  async insertOwner(journeyId: number, userId: number, addedAt: number): Promise<void> {
    await this.insert({ journey: journeyId, user: userId, role: 'owner', added_at: addedAt });
  }

  /**
   * JG117 — `addContributor`'s `INSERT OR REPLACE INTO journey_contributors
   * (journey_id, user_id, role, added_at) VALUES (?,?,?,?)` (R3's composite-PK
   * upsert reference — first landed here). Built for Task 2's own
   * `addContributor` conversion (not called from Part A); named
   * `upsertContributor`, not `upsert` — `TrekRepository`/`EntityRepository`
   * already declare `upsert` with MikroORM's own generic signature, the same
   * reason `UserNoticeDismissalsRepository.upsertDismissal`/
   * `PackingItemContributorsRepository.insertIgnore` use their own names.
   *
   * `hide_skeletons: 0` is written explicitly on every call, including the
   * conflict branch: SQLite's `INSERT OR REPLACE` deletes the conflicting row
   * and re-inserts it, so a column the legacy statement's own column list
   * omits (`hide_skeletons`) resets to its table default (`0`) on a REPLACE —
   * a real behavior a plain `onConflictAction: 'merge'` over `{journey, user,
   * role, added_at}` alone would NOT reproduce (Kysely's `DO UPDATE SET` only
   * touches the columns named in the upserted data, silently preserving a
   * prior `hide_skeletons` value the legacy REPLACE actually clobbers).
   * Written here so Task 2's `addContributor` conversion inherits the correct
   * parity rather than rediscovering it.
   */
  async upsertContributor(journeyId: number, userId: number, role: string, addedAt: number): Promise<void> {
    await this.upsert(
      { journey: journeyId, user: userId, role, added_at: addedAt, hide_skeletons: 0 },
      { onConflictFields: ['journey', 'user'], onConflictAction: 'merge' },
    );
  }

  /**
   * JG118 — `updateContributorRole`: `UPDATE journey_contributors SET role = ?
   * WHERE journey_id = ? AND user_id = ?`. Built for Task 2 (not called from
   * Part A). Preserves the pre-existing gap R5 names (no guard against
   * writing `role = 'owner'` through this path) — flagged, not fixed.
   */
  async updateRole(journeyId: number, userId: number, role: string): Promise<void> {
    await this.nativeUpdate({ journey: journeyId, user: userId }, { role });
  }

  /**
   * JG119 — `removeContributor`: `DELETE FROM journey_contributors WHERE
   * journey_id = ? AND user_id = ? AND role != 'owner'`. The owner-protection
   * guard stays INSIDE the statement (R5) — never split into a
   * find-then-conditional-delete. Built for Task 2 (not called from Part A).
   * Returns the affected-row count so a mutation proof can assert 0 rows
   * changed when the guard is asked to remove an owner.
   */
  async deleteNonOwner(journeyId: number, userId: number): Promise<number> {
    return await this.nativeDelete({ journey: journeyId, user: userId, role: { $ne: 'owner' } });
  }

  /**
   * UC10 (Plan 3g Task 4 survivor, `UserCleanupService.cleanupUserReferences`)
   * — `DELETE FROM journey_contributors WHERE user_id = ?`: contributor rows
   * on OTHER users' journeys (not covered by UC8's cascade). Unscoped by
   * journey and carries no `role != 'owner'` guard, unlike {@link
   * deleteNonOwner}/JG119 — by the call order UC8 already ran first and
   * deleted every journey this user owns (cascading away their own
   * `role='owner'` row on each), so no remaining row for this user can be
   * `role='owner'`; the absent guard is preserved exactly, not added
   * defensively.
   */
  async deleteAllForUser(userId: number): Promise<void> {
    await this.nativeDelete({ user: userId });
  }
}
