import type { VacayShares } from '../entities/VacayShares.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `vacay_shares` row as the legacy `SELECT *` returned it. */
export interface VacayShareRow {
  id: number;
  owner_id: number;
  user_id: number;
  hidden: number;
  created_at: string | null;
}

const _vacayShareRowKeys: AssertRowKeys<VacayShareRow, VacayShares> = true;

/** VC81/VC82/VC91's joined share+user projections. */
export interface VacayOutgoingShareRow {
  id: number;
  user_id: number;
  username: string;
}

export interface VacayIncomingShareRow {
  id: number;
  owner_id: number;
  hidden: number;
  username: string;
}

export class VacaySharesRepository extends TrekRepository<VacayShares> {
  /** VC84 — `SELECT id FROM vacay_shares WHERE owner_id = ? AND user_id = ?` (`shareCalendar`'s dedup guard). */
  async findByOwnerAndUser(ownerId: number, userId: number): Promise<{ id: number } | null> {
    const row = await this.findOne({ owner: ownerId, user: userId }, { fields: ['id'] });
    return row ? { id: row.id } : null;
  }

  /**
   * VC83 (`shareCalendar`'s share-target lookup) — `SELECT id FROM users
   * WHERE id = ? AND COALESCE(is_guest, 0) = 0` — a NARROWER column set than
   * `VacayPlanMembersRepository.findInvitableUser`'s VC47 (no `username`), a
   * genuinely distinct statement (inventory §2's own note), not a reuse.
   * `UsersRepository` is a concurrently in-flight file owned by another
   * Plan 3f task at the time of this write and outside this task's Named
   * file set (same reasoning as `VacayPlansRepository.findVacayUser`'s
   * docstring) — a direct `users`-table Kysely read here instead.
   */
  async existsInvitableUser(id: number): Promise<boolean> {
    interface UsersKyselyDB {
      users: { id: number; is_guest: number | null };
    }
    const row = await this.kysely<UsersKyselyDB>()
      .selectFrom('users')
      .select('id')
      .where('id', '=', id)
      .where((eb) => eb(eb.fn.coalesce('is_guest', eb.val(0)), '=', 0))
      .executeTakeFirst();
    return row !== undefined;
  }

  /** VC81 — `SELECT s.id, s.user_id, u.username FROM vacay_shares s JOIN users u ON s.user_id = u.id WHERE s.owner_id = ? ORDER BY s.id` (`listShares`'s outgoing half — usernames only, emails withheld). */
  async listOutgoing(ownerId: number): Promise<VacayOutgoingShareRow[]> {
    return this.qb('s')
      .join('s.user', 'u')
      .select(['s.id', 'u.id as user_id', 'u.username'])
      .where({ 's.owner': ownerId })
      .orderBy({ 's.id': 'asc' })
      .execute<VacayOutgoingShareRow[]>('all', false);
  }

  /** VC82/VC91 — `SELECT s.id, s.owner_id, s.hidden, u.username FROM vacay_shares s JOIN users u ON s.owner_id = u.id WHERE s.user_id = ? ORDER BY s.id` (`listShares`'s incoming half, `getSharedCalendars`'s share list — identical statement, two call sites). */
  async listIncoming(userId: number): Promise<VacayIncomingShareRow[]> {
    return this.qb('s')
      .join('s.owner', 'u')
      .select(['s.id', 'u.id as owner_id', 's.hidden', 'u.username'])
      .where({ 's.user': userId })
      .orderBy({ 's.id': 'asc' })
      .execute<VacayIncomingShareRow[]>('all', false);
  }

  /**
   * VC85 — `INSERT INTO vacay_shares (owner_id, user_id) VALUES (?, ?)`
   * (`shareCalendar`). Named `insertShare`, not `insert` —
   * `EntityRepository#insert` already exists with an incompatible signature.
   */
  async insertShare(ownerId: number, userId: number): Promise<void> {
    await this.insert({ owner: ownerId, user: userId });
  }

  /**
   * R6 — `findScopedForRemoval(id, userId)`: `WHERE id = ? AND (owner_id = ?
   * OR user_id = ?)`, mirroring `removeShare`'s wider ownership-or-viewer
   * check (VC86, today an UNSCOPED `SELECT * FROM vacay_shares WHERE id = ?`
   * followed by a JS check — `share.owner_id !== userId && share.user_id !==
   * userId` — that runs before any mutation either way). This method scopes
   * the SAME check IN the SQL statement itself: a share row belonging to
   * neither the owner NOR the viewer never comes back, so the caller (which
   * then deletes-by-id via {@link deleteById}) cannot act on a foreign row
   * even if a future change to the service dropped the JS check. Behaviorally
   * identical to today on every input (the JS check ran first either way);
   * flagged per R6/the plan's "For the user" note as a genuine SQL-shape
   * tightening, not silent parity.
   */
  async findScopedForRemoval(id: number, userId: number): Promise<VacayShareRow | null> {
    const row = await this.findOne({ id, $or: [{ owner: userId }, { user: userId }] });
    return row ? (toRow(row) as VacayShareRow) : null;
  }

  /**
   * R6 — `findScopedForHide(id, userId)`: `WHERE id = ? AND user_id = ?`,
   * mirroring `setShareHidden`'s NARROWER viewer-only check (VC88, today the
   * same unscoped `SELECT * FROM vacay_shares WHERE id = ?` plus a JS check —
   * `share.user_id !== userId` only, the OWNER may not hide their own
   * outgoing share). Deliberately a DIFFERENT predicate from
   * {@link findScopedForRemoval}, not the same method with a mode flag — an
   * owner's own row must NOT match this one even though it would match
   * `findScopedForRemoval`.
   */
  async findScopedForHide(id: number, userId: number): Promise<VacayShareRow | null> {
    const row = await this.findOne({ id, user: userId });
    return row ? (toRow(row) as VacayShareRow) : null;
  }

  /** VC87 — `DELETE FROM vacay_shares WHERE id = ?` (`removeShare`, called only after {@link findScopedForRemoval} found a scoped row). */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** VC89 — `UPDATE vacay_shares SET hidden = ? WHERE id = ?` (`setShareHidden`, called only after {@link findScopedForHide} found a scoped row). */
  async setHidden(id: number, hidden: boolean): Promise<void> {
    await this.nativeUpdate({ id }, { hidden: hidden ? 1 : 0 });
  }

  /** VC20 — `SELECT DISTINCT user_id FROM vacay_shares WHERE owner_id IN (${dynamic})` (`notifyShareViewers`'s fan-out list). Empty `ownerIds` short-circuits before any query, matching the caller's own guard. */
  async listDistinctViewerIdsForOwners(ownerIds: number[]): Promise<number[]> {
    if (ownerIds.length === 0) return [];
    interface VacaySharesKyselyDB {
      vacay_shares: { id: number; owner_id: number; user_id: number; hidden: number; created_at: string | null };
    }
    const rows = await this.kysely<VacaySharesKyselyDB>()
      .selectFrom('vacay_shares')
      .select('user_id')
      .distinct()
      .where('owner_id', 'in', ownerIds)
      .execute();
    return rows.map((row) => row.user_id);
  }

  /**
   * VC90 (`getShareAvailableUsers`, the share-candidate picker) — `SELECT
   * u.id, u.username FROM users u WHERE u.id != ? AND COALESCE(u.is_guest, 0)
   * = 0 AND u.id NOT IN (SELECT user_id FROM vacay_shares WHERE owner_id = ?)
   * AND u.id NOT IN (SELECT owner_id FROM vacay_plans WHERE id = ? UNION
   * SELECT user_id FROM vacay_plan_members WHERE plan_id = ? AND status =
   * 'accepted') ORDER BY u.username`. A `UNION` nested inside a `NOT IN`
   * subquery (§13) — Kysely, no `sql` tag.
   */
  async listAvailableForShare(userId: number, planId: number): Promise<{ id: number; username: string }[]> {
    interface ShareCandidateKyselyDB {
      users: { id: number; username: string; is_guest: number | null };
      vacay_shares: { id: number; owner_id: number; user_id: number };
      vacay_plans: { id: number; owner_id: number };
      vacay_plan_members: { id: number; plan_id: number; user_id: number; status: string | null };
    }
    return this.kysely<ShareCandidateKyselyDB>()
      .selectFrom('users as u')
      .select(['u.id', 'u.username'])
      .where('u.id', '!=', userId)
      .where((eb) => eb(eb.fn.coalesce('u.is_guest', eb.val(0)), '=', 0))
      .where('u.id', 'not in', (eb) => eb.selectFrom('vacay_shares').select('user_id').where('owner_id', '=', userId))
      .where('u.id', 'not in', (eb) =>
        eb
          .selectFrom('vacay_plans')
          .select('owner_id')
          .where('id', '=', planId)
          .union(
            eb
              .selectFrom('vacay_plan_members')
              .select('user_id as owner_id')
              .where('plan_id', '=', planId)
              .where('status', '=', 'accepted'),
          ),
      )
      .orderBy('u.username', 'asc')
      .execute();
  }
}
