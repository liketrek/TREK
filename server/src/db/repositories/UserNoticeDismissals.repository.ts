import type { UserNoticeDismissals } from '../entities/UserNoticeDismissals.entity';
import { toRow } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** SN4's projection — `notice_id`/`dismissed_app_version` (the caller already knows which user it asked for). */
export interface UserNoticeDismissalRow {
  notice_id: string;
  dismissed_app_version: string | null;
}

/**
 * `user_notice_dismissals` — a genuine TWO-column composite primary key
 * (`user` relation + `notice_id` text, both `.primary()` — Plan 3f Task 0's
 * R5/§14 finding, confirmed against the migration DDL:
 * `Migration20200101014400_system_notices.ts` + the later
 * `dismissed_app_version` column addition). Every write here goes through
 * `em.upsert` targeting both columns as the conflict target, never a
 * synthetic `id`. `user_id` is a `persist(false)` mirror of the `user`
 * relation — filtered/written through `user` throughout, never the mirror
 * (the program-wide trap).
 */
export class UserNoticeDismissalsRepository extends TrekRepository<UserNoticeDismissals> {
  /**
   * SN4 — `SELECT notice_id, dismissed_app_version FROM user_notice_dismissals
   * WHERE user_id = ?`. `SystemNoticesService.getActiveFor` maps the result to
   * a `Map<noticeId, dismissedAppVersion>` for the per-version re-show logic.
   */
  async listForUser(userId: number): Promise<UserNoticeDismissalRow[]> {
    const rows = await this.find({ user: userId }, { fields: ['notice_id', 'dismissed_app_version'] });
    // `dismissed_app_version` is declared optional (`?`) on the entity class
    // (the `AppSettings`/`AppSettingsRow` precedent — `AppSettings
    // .repository.ts#findByKeyPrefix`'s own `toRow(...) as ...Row` cast), so
    // a fields-narrowed `Loaded<...>` types it as possibly-undefined even
    // though a fields-narrowed read always returns the column (`null`, never
    // absent) — `toRow` + the row cast bridges that gap.
    return rows.map((row) => toRow(row) as UserNoticeDismissalRow);
  }

  /**
   * SN5 — `dismissNotice`'s `INSERT INTO user_notice_dismissals (user_id,
   * notice_id, dismissed_at, dismissed_app_version) VALUES (?, ?, ?, ?) ON
   * CONFLICT(user_id, notice_id) DO UPDATE SET dismissed_at =
   * excluded.dismissed_at, dismissed_app_version = excluded.dismissed_app_version`.
   *
   * Composite-PK `em.upsert` — the shape Task 0 (R5) pinned against the
   * migration DDL and Task 3's `NotificationChannelPreferencesRepository
   * .upsertPreference` proved first with a rendered-SQL test
   * (`NCPREPO-UPSERT-SQL`), re-checked here rather than re-derived
   * (`UserNoticeDismissals.repository.test.ts`'s `UNDREPO-UPSERT-SQL`).
   * `onConflictFields` names the two primary-key properties by their ENTITY
   * property names (`user`, not the `persist(false)` `user_id` mirror);
   * `onConflictAction: 'merge'` reproduces the `ON CONFLICT ... DO UPDATE`'s
   * "overwrite `dismissed_at`/`dismissed_app_version`" semantics exactly —
   * there is no other non-key column for it to diverge on.
   *
   * Named `upsertDismissal`, not `upsert`: `TrekRepository` already declares
   * (and overrides) `upsert` with MikroORM's own generic signature, so a
   * method of the same name here would have to be a compatible override, not
   * a differently-shaped convenience wrapper — same reason
   * `AppSettingsRepository.setValue`/`NotificationChannelPreferencesRepository
   * .upsertPreference` use their own names rather than `upsert`.
   *
   * `dismissedAt` stays the caller's raw epoch-ms integer (`Date.now()`, not
   * `CURRENT_TIMESTAMP`) — this table is the one place in the whole plan
   * that stores a timestamp this way; preserved exactly, not normalized to
   * match every other domain's `CURRENT_TIMESTAMP` convention.
   */
  async upsertDismissal(
    userId: number,
    noticeId: string,
    dismissedAt: number,
    dismissedAppVersion: string,
  ): Promise<void> {
    await this.upsert(
      { user: userId, notice_id: noticeId, dismissed_at: dismissedAt, dismissed_app_version: dismissedAppVersion },
      { onConflictFields: ['user', 'notice_id'], onConflictAction: 'merge' },
    );
  }
}
