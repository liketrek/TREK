import type { VacayUserSettings } from '../entities/VacayUserSettings.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `vacay_user_settings` row as the legacy `SELECT *` returned it — `user` is the entity's primary key (`[PrimaryKeyProp]?: 'user'`), so `user_id` is its `persist(false)` shadow scalar. */
export interface VacayUserSettingsRow {
  user_id: number;
  year_type: string;
  year_start_month: number;
  year_start_day: number;
  hire_date: string | null;
}

const _vacayUserSettingsRowKeys: AssertRowKeys<VacayUserSettingsRow, VacayUserSettings> = true;

export class VacayUserSettingsRepository extends TrekRepository<VacayUserSettings> {
  /**
   * VC3 — `SELECT * FROM vacay_user_settings WHERE user_id = ?`
   * (`getUserYearSettings`). Named `findForUser`, not `find` —
   * `EntityRepository#find` already exists with an incompatible signature.
   */
  async findForUser(userId: number): Promise<VacayUserSettingsRow | null> {
    const row = await this.findOne({ user: userId });
    return row ? (toRow(row) as VacayUserSettingsRow) : null;
  }

  /**
   * VC6 — `INSERT INTO vacay_user_settings (user_id, year_type,
   * year_start_month, year_start_day, hire_date) VALUES (?, ?, ?, ?, ?) ON
   * CONFLICT(user_id) DO UPDATE SET year_type = excluded.year_type,
   * year_start_month = excluded.year_start_month, year_start_day =
   * excluded.year_start_day, hire_date = excluded.hire_date`
   * (`updateYearSettings`). `user` is the entity's own primary key, so
   * `onConflictFields: ['user']` targets it directly — the default `'merge'`
   * action already updates every OTHER column present in the payload (all
   * four here, matching the legacy statement's own exhaustive `SET` list),
   * so no `onConflictMergeFields` narrowing is needed (unlike
   * `VacayUserYearsRepository.upsertCarriedOver`, which deliberately narrows
   * to ONE column). Named `upsertSettings`, not `upsert` —
   * `EntityRepository#upsert` already exists with an incompatible signature.
   */
  async upsertSettings(
    userId: number,
    yearType: string,
    yearStartMonth: number,
    yearStartDay: number,
    hireDate: string | null,
  ): Promise<void> {
    await this.upsert(
      {
        user: userId,
        year_type: yearType,
        year_start_month: yearStartMonth,
        year_start_day: yearStartDay,
        hire_date: hireDate,
      },
      { onConflictFields: ['user'], onConflictAction: 'merge' },
    );
  }
}
