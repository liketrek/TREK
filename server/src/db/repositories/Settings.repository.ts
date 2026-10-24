import type { Settings } from '../entities/Settings.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `settings` row (the per-user key/value table) as the API emits it. */
export interface SettingRow {
  id: number;
  user_id: number;
  key: string;
  value: string | null;
}

const _settingRowKeys: AssertRowKeys<SettingRow, Settings> = true;

export class SettingsRepository extends TrekRepository<Settings> {
  /**
   * `SELECT key, value FROM settings WHERE user_id = ?`
   *
   * `disableIdentityMap: true`, applied by the base class's default (Plan 3b
   * interlude B — `_shared/trek-repository.ts`) — a "rows out"
   * read, converted via `toRow` and discarded.
   */
  async getForUser(userId: number): Promise<SettingRow[]> {
    const rows = await this.find({ user: userId });
    return rows.map((row) => toRow(row) as SettingRow);
  }

  /**
   * `SELECT value FROM settings WHERE user_id = ? AND key = ?`
   *
   * `disableIdentityMap: true`, applied by the base class's default (Plan 3b
   * interlude B — supersedes Plan 3a's I1 — see `Users.repository.ts`'s
   * class-level docstring and
   * `.superpowers/sdd/2026-09-22-orm-phase3b/task-1-review.md` B1): this
   * filter is `(user, key)` — `Settings`'s PK is the surrogate `id`, not
   * this composite — so it was never PK-only and always re-queried even
   * before this ruling; `disableIdentityMap: true` is applied uniformly
   * regardless, matching every other read in this repository.
   * `SETTINGSREPO-012`/`013` pin the always-fresh-read property directly (a
   * raw UPDATE/DELETE on the same row, then `getOne` in the same request,
   * sees it) rather than assume it.
   */
  async getOne(userId: number, key: string): Promise<SettingRow | null> {
    const row = await this.findOne({ user: userId, key });
    return row ? (toRow(row) as SettingRow) : null;
  }

  /**
   * `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
   *  ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`
   *
   * The composite conflict target is the relation field (`user`), never its
   * `persist(false)` scalar twin (`user_id`) — same rule as every other
   * `create`/`upsert` call in this migration (D4's defaults rule): the
   * relation is the one column MikroORM actually writes, the twin is filled
   * by a subsequent read. `Settings`'s own `uniques: [{ properties: ['user',
   * 'key'] }]` (`Settings.entity.ts`, generated off the schema's inline
   * `UNIQUE(user_id, key)` by the `fix(db)` commit that precedes this one)
   * names that same relation field — `Settings.repository.test.ts` asserts
   * both the schema-level unique index and the entity metadata.
   *
   * `onConflictFields` is passed explicitly here for CLARITY at the call
   * site, not because `em.upsert` needs it to find the conflict target: the
   * `uniques` entry above is fidelity to the schema first, but as a
   * consequence it is also consumable — `em.upsert` infers the same
   * `(user, key)` target from it alone when `onConflictFields` is omitted
   * (`getWhereCondition` in `@mikro-orm/core/utils/upsert-utils.js` matches a
   * `uniques` entry's `properties` against the payload's own property-named
   * keys). `SETTINGSREPO-014` proves that inference directly, independent of
   * this method's explicit option.
   *
   * Only `value` is ever updated on conflict, matching the legacy statement's
   * `DO UPDATE SET value = excluded.value` exactly (no other column, no
   * `updated_at` — the `settings` table has none).
   */
  async upsertForUser(userId: number, key: string, value: string): Promise<void> {
    await this.upsert({ user: userId, key, value }, { onConflictFields: ['user', 'key'], onConflictAction: 'merge' });
  }

  /**
   * Plan 3j Task 2 — `plugin-runtime.service.ts#uninstall`'s `deleteData` branch
   * (PR39): `` DELETE FROM settings WHERE key LIKE 'plugin:${id}:%' ``. No `user`
   * filter — this deletes a plugin's settings across EVERY user, unlike every
   * other method on this repository, which is why it takes a bare key-prefix
   * `$like` pattern rather than the `(user, key)` shape the rest of the class
   * uses. `prefix` is caller-built (`` `plugin:${id}:` ``) and bound as a plain
   * parameter — never interpolated into SQL text.
   */
  async deleteByKeyPrefix(prefix: string): Promise<number> {
    return await this.nativeDelete({ key: { $like: `${prefix}%` } });
  }
}
