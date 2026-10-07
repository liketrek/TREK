import type { VacayPlans } from '../entities/VacayPlans.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * A `vacay_plans` row as the legacy `SELECT *` returned it (Plan 3f Task 5,
 * inventory §2, VC7-131's `vacay_plans` group). `owner_id` is the
 * `persist(false)` shadow of the `owner` relation (§14's FK-mirror TRAP —
 * every plain `find`/`findOne` below reads the whole row, so it always
 * hydrates); `created_at` is the one column `VacayService`'s own hand-written
 * `VacayPlan` interface never declared (nothing reads it), kept here anyway
 * so {@link AssertRowKeys} still pins every scalar column of the entity.
 */
export interface VacayPlanRow {
  id: number;
  owner_id: number;
  block_weekends: number | null;
  holidays_enabled: number | null;
  holidays_region: string | null;
  school_holidays_enabled: number | null;
  company_holidays_enabled: number | null;
  carry_over_enabled: number | null;
  created_at: string | null;
  weekend_days: string | null;
  week_start: number;
}

const _vacayPlanRowKeys: AssertRowKeys<VacayPlanRow, VacayPlans> = true;

/** `updatePlan` (VC28)'s conditionally-included-fields patch — §15.9: a JS-assembled SET list, not the presence-sentinel idiom, maps directly onto `nativeUpdate`'s own `undefined`-means-omit semantics. */
export interface VacayPlanPatch {
  block_weekends?: number;
  holidays_enabled?: number;
  holidays_region?: string | null;
  school_holidays_enabled?: number;
  company_holidays_enabled?: number;
  carry_over_enabled?: number;
  weekend_days?: string;
  week_start?: number;
}

export class VacayPlansRepository extends TrekRepository<VacayPlans> {
  /** VC7/VC9/VC78 — `SELECT * FROM vacay_plans WHERE owner_id = ?` (one method, three identical-text call sites: `getOwnPlan`'s pre-insert read, its post-insert re-select, and `peekActivePlan`'s owner fallback). */
  async findByOwner(ownerId: number): Promise<VacayPlanRow | null> {
    const plan = await this.findOne({ owner: ownerId });
    return plan ? (toRow(plan) as VacayPlanRow) : null;
  }

  /**
   * VC14 — `SELECT * FROM vacay_plans WHERE id = ?`, the hottest statement in
   * this file: seven identical-text call sites (`getActivePlan`,
   * `getPlanUsers`, `peekActivePlan`, `updatePlan`'s pre- and post-write
   * reads, `addYear`, `deleteYear`, `toggleEntry`, `getStats` — VC14/15/31/
   * 36/77/97/107/113/122), all ONE method.
   */
  async findById(id: number): Promise<VacayPlanRow | null> {
    const plan = await this.findOne({ id });
    return plan ? (toRow(plan) as VacayPlanRow) : null;
  }

  /**
   * VC18/VC103 — `SELECT owner_id FROM vacay_plans WHERE id = ?`
   * (`notifyPlanUsers`, `deleteYear`'s carry-over recompute). No `fields`
   * narrowing: `owner_id` is the `persist(false)` shadow of the `owner`
   * relation, and narrowing a `find`/`findOne` to JUST a `persist(false)`
   * mirror column silently drops it from the result (verified directly, the
   * same trap `PlaceRatingsRepository.listForPlaces`'s docstring names for
   * the join-alias case) — a full read costs one extra row's worth of
   * columns, never a wrong answer.
   */
  async findOwnerId(id: number): Promise<{ owner_id: number } | null> {
    const row = await this.findOne({ id });
    return row ? { owner_id: row.owner_id } : null;
  }

  /** VC53 — `SELECT id FROM vacay_plans WHERE owner_id = ?` (`acceptInvite`'s own-plan-to-migrate-from lookup) — a NARROWER column set than {@link findByOwner}'s VC7/9/78 (no `username`/`email`/etc., just `id`), a genuinely distinct statement. */
  async findIdByOwner(ownerId: number): Promise<{ id: number } | null> {
    const row = await this.findOne({ owner: ownerId }, { fields: ['id'] });
    return row ? { id: row.id } : null;
  }

  /** VC21 — `SELECT holidays_enabled FROM vacay_plans WHERE id = ?` (`applyHolidayCalendars`'s feature gate). */
  async getHolidaysEnabled(id: number): Promise<number | null> {
    const row = await this.findOne({ id }, { fields: ['holidays_enabled'] });
    return row?.holidays_enabled ?? null;
  }

  /**
   * VC8 — `INSERT INTO vacay_plans (owner_id) VALUES (?)` (`getOwnPlan`'s
   * lazy-create; every other column takes the schema's own default). Named
   * `insertForOwner`, not `insert` — `EntityRepository#insert` already
   * exists with an incompatible signature (`Users.repository.ts::insertUser`'s
   * precedent).
   */
  async insertForOwner(ownerId: number): Promise<number> {
    return this.insert({ owner: ownerId });
  }

  /** VC28 — `UPDATE vacay_plans SET ${dynamic column list} WHERE id = ?`, §15.9's conditionally-included-fields shape: only the keys present in `patch` are written, matching the legacy JS-assembled SET list exactly (an absent key is truly untouched, never a presence-sentinel `CASE WHEN`). */
  async update(id: number, patch: VacayPlanPatch): Promise<void> {
    if (Object.keys(patch).length === 0) return;
    await this.nativeUpdate({ id }, { ...patch });
  }

  /**
   * VC16 (`getPlanUsers`'s owner lookup) — `SELECT id, username, email FROM
   * users WHERE id = ?`. `UsersRepository` is a concurrently in-flight file
   * owned by another Plan 3f task at the time of this write (Task 4's own
   * additive block) — this task's Named file set does not include it, so
   * this read stays here (a same-shape precedent to `VacayPlanMembersRepository
   * .listAvailableForFusion`'s direct `users`-table Kysely read: a
   * repository is not required to route every cross-table read through the
   * table's "owning" repository, only to own its OWN table's writes) rather
   * than risk a conflicting concurrent edit to a file this task does not own.
   */
  async findVacayUser(id: number): Promise<{ id: number; username: string; email: string } | null> {
    interface UsersKyselyDB {
      users: { id: number; username: string; email: string };
    }
    const row = await this.kysely<UsersKyselyDB>()
      .selectFrom('users')
      .select(['id', 'username', 'email'])
      .where('id', '=', id)
      .executeTakeFirst();
    return row ?? null;
  }
}
