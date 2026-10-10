import type { VacayUserColors } from '../entities/VacayUserColors.entity';
import { TrekRepository } from './_shared/trek-repository';

export class VacayUserColorsRepository extends TrekRepository<VacayUserColors> {
  /** VC79 — `SELECT color FROM vacay_user_colors WHERE plan_id = ?` (`viewerColors`). */
  async listForPlan(planId: number): Promise<{ color: string | null }[]> {
    const rows = await this.find({ plan: planId }, { fields: ['color'] });
    return rows.map((row) => ({ color: row.color ?? null }));
  }

  /**
   * VC57/VC60/VC80/VC124/VC128 — `SELECT color FROM vacay_user_colors WHERE
   * user_id = ? AND plan_id = ?` (five identical-text call sites:
   * `acceptInvite`'s own-color read and its post-remap re-read,
   * `shareDisplayColor`, `getStats`, `getPlanData`'s per-member map). Named
   * `findColor`, not `find` — `EntityRepository#find` already exists with an
   * incompatible signature.
   */
  async findColor(userId: number, planId: number): Promise<{ color: string | null } | null> {
    const row = await this.findOne({ user: userId, plan: planId }, { fields: ['color'] });
    return row ? { color: row.color ?? null } : null;
  }

  /** VC59 — `SELECT color FROM vacay_user_colors WHERE plan_id = ? AND user_id != ?` (`acceptInvite`'s taken-colors collection). */
  async listOtherColors(planId: number, excludeUserId: number): Promise<{ color: string | null }[]> {
    const rows = await this.find({ plan: planId, user: { $ne: excludeUserId } }, { fields: ['color'] });
    return rows.map((row) => ({ color: row.color ?? null }));
  }

  /**
   * VC12/VC58/VC62 — `INSERT OR IGNORE INTO vacay_user_colors (user_id,
   * plan_id, color) VALUES (?, ?, ?)` (`getOwnPlan`'s lazy default color,
   * `acceptInvite`'s own-color migration and its no-collision else-branch —
   * three identical-text call sites, one method).
   */
  async insertIgnore(userId: number, planId: number, color: string | null): Promise<void> {
    await this.upsert(
      { user: userId, plan: planId, color },
      { onConflictFields: ['user', 'plan'], onConflictAction: 'ignore' },
    );
  }

  /**
   * VC46/VC61 — `INSERT INTO vacay_user_colors (user_id, plan_id, color)
   * VALUES (?, ?, ?) ON CONFLICT(user_id, plan_id) DO UPDATE SET color =
   * excluded.color` (`setUserColor`'s own write, `acceptInvite`'s
   * collision-remap write — identical statement, two call sites).
   */
  async upsertColor(userId: number, planId: number, color: string): Promise<void> {
    await this.upsert(
      { user: userId, plan: planId, color },
      { onConflictFields: ['user', 'plan'], onConflictAction: 'merge', onConflictMergeFields: ['color'] },
    );
  }
}
