import type { VacayPlanMembers } from '../entities/VacayPlanMembers.entity';
import type { DB } from '../kysely/db';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `vacay_plan_members` row as the legacy `SELECT *` returned it (VC51). */
export interface VacayPlanMemberRow {
  id: number;
  plan_id: number;
  user_id: number;
  status: string | null;
  created_at: string | null;
}

const _vacayPlanMemberRowKeys: AssertRowKeys<VacayPlanMemberRow, VacayPlanMembers> = true;

/** VC17/VC129/VC130's joined member+user projections. */
export interface VacayMemberUserRow {
  id: number;
  username: string;
  email: string;
}

/** VC129 — outgoing pending invites (`getPlanData`). */
export interface VacayPendingOutgoingRow {
  id: number;
  user_id: number;
  username: string;
  email: string;
  created_at: string | null;
}

/** VC130 — incoming pending invites (`getPlanData`). */
export interface VacayPendingIncomingRow {
  id: number;
  plan_id: number;
  username: string;
  email: string;
  created_at: string | null;
}

export class VacayPlanMembersRepository extends TrekRepository<VacayPlanMembers> {
  /**
   * VC13/VC76 — `SELECT plan_id FROM vacay_plan_members WHERE user_id = ? AND
   * status = 'accepted'` (`getActivePlan`, `peekActivePlan`). No `fields`
   * narrowing: `plan_id` is the `persist(false)` shadow of the `plan`
   * relation — narrowing to JUST a `persist(false)` mirror column silently
   * drops it from the result (verified directly).
   */
  async findAcceptedPlanId(userId: number): Promise<{ plan_id: number } | null> {
    const row = await this.findOne({ user: userId, status: 'accepted' });
    return row ? { plan_id: row.plan_id } : null;
  }

  /** VC17 — `SELECT u.id, u.username, u.email FROM vacay_plan_members m JOIN users u ON m.user_id = u.id WHERE m.plan_id = ? AND m.status = 'accepted'` (`getPlanUsers`'s accepted-member half). */
  async listAcceptedWithUsers(planId: number): Promise<VacayMemberUserRow[]> {
    return this.qb('m')
      .join('m.user', 'u')
      .select(['u.id', 'u.username', 'u.email'])
      .where({ 'm.plan': planId, 'm.status': 'accepted' })
      .execute<VacayMemberUserRow[]>('all', false);
  }

  /**
   * VC19/VC68 — `SELECT user_id FROM vacay_plan_members WHERE plan_id = ? AND
   * status = 'accepted'` (`notifyPlanUsers`, `dissolvePlan`'s owner branch).
   * No `fields` narrowing — same `persist(false)`-mirror trap as
   * {@link findAcceptedPlanId}.
   */
  async listAcceptedUserIds(planId: number): Promise<{ user_id: number }[]> {
    const rows = await this.find({ plan: planId, status: 'accepted' });
    return rows.map((row) => ({ user_id: row.user_id }));
  }

  /** VC48 — `SELECT id, status FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?` (`sendInvite`'s dedup guard — any status). */
  async findMembership(planId: number, userId: number): Promise<{ id: number; status: string | null } | null> {
    const row = await this.findOne({ plan: planId, user: userId }, { fields: ['id', 'status'] });
    return row ? { id: row.id, status: row.status ?? null } : null;
  }

  /** VC49 — `SELECT id FROM vacay_plan_members WHERE user_id = ? AND status = 'accepted'` (`sendInvite`'s single-fusion guard). */
  async findAcceptedForUser(userId: number): Promise<{ id: number } | null> {
    const row = await this.findOne({ user: userId, status: 'accepted' }, { fields: ['id'] });
    return row ? { id: row.id } : null;
  }

  /** VC50 — `INSERT INTO vacay_plan_members (plan_id, user_id, status) VALUES (?, ?, 'pending')`. */
  async insertPending(planId: number, userId: number): Promise<void> {
    await this.insert({ plan: planId, user: userId, status: 'pending' });
  }

  /**
   * VC47 (`sendInvite`'s invite-target lookup) — `SELECT id, username FROM
   * users WHERE id = ? AND COALESCE(is_guest, 0) = 0` — a guest is never
   * invitable (#1362-class). `UsersRepository` is a concurrently in-flight
   * file owned by another Plan 3f task at the time of this write and outside
   * this task's Named file set (same reasoning as `VacayPlansRepository
   * .findVacayUser`'s docstring) — a direct `users`-table Kysely read here
   * instead.
   */
  async findInvitableUser(id: number): Promise<{ id: number; username: string } | null> {
    type UsersKyselyDB = Pick<DB, 'users'>;
    const row = await this.kysely<UsersKyselyDB>()
      .selectFrom('users')
      .select(['id', 'username'])
      .where('id', '=', id)
      .where((eb) => eb(eb.fn.coalesce('is_guest', eb.val(0)), '=', 0))
      .executeTakeFirst();
    return row ? { id: row.id, username: row.username } : null;
  }

  /** VC51 — `SELECT * FROM vacay_plan_members WHERE plan_id = ? AND user_id = ? AND status = 'pending'` (`acceptInvite`'s own pending-invite read). */
  async findPending(planId: number, userId: number): Promise<VacayPlanMemberRow | null> {
    const row = await this.findOne({ plan: planId, user: userId, status: 'pending' });
    return row ? (toRow(row) as VacayPlanMemberRow) : null;
  }

  /** VC52 — `UPDATE vacay_plan_members SET status = 'accepted' WHERE id = ?`. */
  async accept(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { status: 'accepted' });
  }

  /** VC65/VC66 — `DELETE FROM vacay_plan_members WHERE plan_id = ? AND user_id = ? AND status = 'pending'` (`declineInvite`'s own withdrawal, `cancelInvite`'s owner-initiated withdrawal — identical statement, `targetUserId` in place of `userId`). */
  async deletePending(planId: number, userId: number): Promise<void> {
    await this.nativeDelete({ plan: planId, user: userId, status: 'pending' });
  }

  /** VC71 — `DELETE FROM vacay_plan_members WHERE plan_id = ?` (`dissolvePlan`'s owner branch). */
  async deleteForPlan(planId: number): Promise<void> {
    await this.nativeDelete({ plan: planId });
  }

  /** VC74 — `DELETE FROM vacay_plan_members WHERE plan_id = ? AND user_id = ?` (`dissolvePlan`'s member branch). */
  async deleteForPlanAndUser(planId: number, userId: number): Promise<void> {
    await this.nativeDelete({ plan: planId, user: userId });
  }

  /** VC129 — `SELECT m.id, m.user_id, u.username, u.email, m.created_at FROM vacay_plan_members m JOIN users u ON m.user_id = u.id WHERE m.plan_id = ? AND m.status = 'pending'` (`getPlanData`'s outgoing invites). */
  async listPendingForPlan(planId: number): Promise<VacayPendingOutgoingRow[]> {
    return this.qb('m')
      .join('m.user', 'u')
      .select(['m.id', 'u.id as user_id', 'u.username', 'u.email', 'm.created_at'])
      .where({ 'm.plan': planId, 'm.status': 'pending' })
      .execute<VacayPendingOutgoingRow[]>('all', false);
  }

  /** VC130 — `SELECT m.id, m.plan_id, u.username, u.email, m.created_at FROM vacay_plan_members m JOIN vacay_plans p ON m.plan_id = p.id JOIN users u ON p.owner_id = u.id WHERE m.user_id = ? AND m.status = 'pending'` (`getPlanData`'s incoming invites — the OWNER's username/email, not the member's). */
  async listPendingForUser(userId: number): Promise<VacayPendingIncomingRow[]> {
    return this.qb('m')
      .join('m.plan', 'p')
      .join('p.owner', 'u')
      .select(['m.id', 'p.id as plan_id', 'u.username', 'u.email', 'm.created_at'])
      .where({ 'm.user': userId, 'm.status': 'pending' })
      .execute<VacayPendingIncomingRow[]>('all', false);
  }

  /**
   * VC75 (`getAvailableUsers`, the fusion-candidate picker) — `SELECT u.id,
   * u.username, u.email FROM users u WHERE u.id != ? AND COALESCE(u.is_guest,
   * 0) = 0 AND u.id NOT IN (SELECT user_id FROM vacay_plan_members WHERE
   * plan_id = ?) AND u.id NOT IN (SELECT user_id FROM vacay_plan_members
   * WHERE status = 'accepted') AND u.id NOT IN (SELECT owner_id FROM
   * vacay_plans WHERE id IN (SELECT plan_id FROM vacay_plan_members WHERE
   * status = 'accepted')) ORDER BY u.username`. Three nested `NOT IN`
   * subqueries (§13) — Kysely, no `sql` tag, every operand builder-expressed.
   */
  async listAvailableForFusion(userId: number, planId: number): Promise<VacayMemberUserRow[]> {
    type FusionCandidateKyselyDB = Pick<DB, 'users' | 'vacay_plan_members' | 'vacay_plans'>;
    return this.kysely<FusionCandidateKyselyDB>()
      .selectFrom('users as u')
      .select(['u.id', 'u.username', 'u.email'])
      .where('u.id', '!=', userId)
      .where((eb) => eb(eb.fn.coalesce('u.is_guest', eb.val(0)), '=', 0))
      .where('u.id', 'not in', (eb) =>
        eb.selectFrom('vacay_plan_members').select('user_id').where('plan_id', '=', planId),
      )
      .where('u.id', 'not in', (eb) =>
        eb.selectFrom('vacay_plan_members').select('user_id').where('status', '=', 'accepted'),
      )
      .where('u.id', 'not in', (eb) =>
        eb
          .selectFrom('vacay_plans')
          .select('owner_id')
          .where('id', 'in', (eb2) =>
            eb2.selectFrom('vacay_plan_members').select('plan_id').where('status', '=', 'accepted'),
          ),
      )
      .orderBy('u.username', 'asc')
      .execute();
  }
}
