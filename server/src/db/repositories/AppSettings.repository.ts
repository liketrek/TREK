import type { AppSettings } from '../entities/AppSettings.entity';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** An `app_settings` row as the API emits it. */
export interface AppSettingsRow {
  key: string | null;
  value: string | null;
}

const _appSettingsRowKeys: AssertRowKeys<AppSettingsRow, AppSettings> = true;

export class AppSettingsRepository extends TrekRepository<AppSettings> {
  /**
   * `SELECT value FROM app_settings WHERE key = ?`
   *
   * `disableIdentityMap: true`, applied by the base class's default (Plan 3b
   * interlude B — `_shared/trek-repository.ts`; supersedes Plan 3a's I1
   * "`refresh: true` on every PK-only `findOne`" — see
   * `Users.repository.ts`'s class-level docstring for the full mechanism and
   * `.superpowers/sdd/2026-09-22-orm-phase3b/task-1-review.md` B1): the read
   * is answered from a throwaway forked context that is cleared afterwards,
   * so a raw/native write or `deleteValue` on the same key inside the same
   * request is always seen, and the entity never lands in the request's
   * identity map to become a stale pending change at a later `flush()`.
   */
  async getValue(key: string): Promise<string | null> {
    const row = await this.findOne({ key }, { fields: ['value'] });
    return row?.value ?? null;
  }

  /**
   * `SELECT key, value FROM app_settings WHERE key IN (?, ?, ...)` — a
   * NULL-valued row is silently dropped from the returned Map, matching the
   * legacy callers, which never distinguished "row present with a NULL
   * value" from "no row" (both read as absent).
   */
  async getValues(keys: string[]): Promise<Map<string, string>> {
    const rows = await this.find({ key: { $in: keys } });
    const values = new Map<string, string>();
    for (const row of rows) {
      if (row.key != null && row.value != null) values.set(row.key, row.value);
    }
    return values;
  }

  /**
   * Upsert ruling: `app_settings` (`Migration20200101000000_baseline_schema.ts`)
   * is `CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT)` and no
   * later migration adds a column or a timestamp — the table has never carried
   * anything beyond `key`/`value`. Every legacy call site across settings,
   * addons and permissions is either `INSERT OR REPLACE INTO app_settings
   * (key, value) VALUES (?, ?)` or `INSERT INTO app_settings (key, value)
   * VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value` —
   * with no other column whose reset by REPLACE could be observable, both
   * spellings are exactly `em.upsert`'s job, with the sole unique field
   * (`key`, the primary key) as the conflict target.
   *
   * The one difference from `INSERT OR REPLACE` — verified, unobservable
   * here — is the row's implicit SQLite rowid: REPLACE deletes and
   * reinserts (rowid moves), `em.upsert`'s `ON CONFLICT ... DO UPDATE`
   * keeps the original row (rowid stays). `app_settings` has no `INTEGER
   * PRIMARY KEY`, no `AUTOINCREMENT`, no trigger and no foreign key
   * referencing it, so nothing here reads the rowid — but the next table
   * converted off `INSERT OR REPLACE` that does have one of those needs its
   * own check, not an assumption from this comment.
   */
  async setValue(key: string, value: string): Promise<void> {
    await this.upsert({ key, value }, { onConflictFields: ['key'], onConflictAction: 'merge' });
  }

  /**
   * `SELECT key, value FROM app_settings WHERE key LIKE ?` — the caller
   * passes the bare prefix; this appends the trailing `%` itself, matching
   * every legacy call site (`'perm_%'`, `'default_user_setting_%'`).
   *
   * Escaping: neither the legacy `LIKE 'prefix%'` literals nor `$like`'s
   * parameter binding here escape `%`/`_` in the prefix — both are plain
   * SQL LIKE, where a bound parameter's `%`/`_` are wildcards exactly like a
   * literal's are. The repository test proves the two behave identically for
   * a prefix that itself contains `%`/`_`.
   */
  async findByKeyPrefix(prefix: string): Promise<AppSettingsRow[]> {
    const rows = await this.find({ key: { $like: `${prefix}%` } });
    return rows.map((row) => toRow(row) as AppSettingsRow);
  }

  /** `DELETE FROM app_settings WHERE key = ?` */
  async deleteValue(key: string): Promise<number> {
    return this.nativeDelete({ key });
  }

  /**
   * `SELECT COUNT(*) AS n FROM app_settings WHERE key IN (?, ?, ...)` (Plan
   * 3i, storage's SR1 — `StorageRegistryService#seedFromFileOnce`'s
   * seed-once boot guard). Counts every ROW whose key matches, including one
   * whose `value` is NULL — unlike `getValues()`, which drops a NULL-valued
   * row from its Map, this mirrors the legacy statement exactly: no WHERE on
   * `value`, so a present-but-NULL row still counts as "already seeded."
   */
  async countKeysPresent(keys: string[]): Promise<number> {
    return this.count({ key: { $in: keys } });
  }

  /**
   * `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)` (Plan
   * 3i, storage's SS1 — `StorageStatsService#scan`). The SAME "one row per
   * key" write as `setValue()`'s `ON CONFLICT(key) DO UPDATE` upsert, but a
   * genuinely DIFFERENT legacy SQL text (R4/R5's ruling: `app_settings` has
   * two distinct upsert dialects across this program's converted call
   * sites — preserve both as separately-named methods, never merged into one
   * with a boolean/dialect flag, even where — as here — their observable
   * behavior on this table is identical). Per `setValue()`'s own docstring,
   * the only real difference between the two dialects (REPLACE deletes and
   * reinserts, moving the SQLite rowid; `ON CONFLICT ... DO UPDATE` keeps the
   * original row) is unobservable on `app_settings` (no `INTEGER PRIMARY
   * KEY`/`AUTOINCREMENT`/trigger/FK references it) — this method exists so
   * the repository's public surface keeps naming the legacy text 1:1, not
   * because the two need different runtime behavior on this table.
   */
  async upsertOrReplace(key: string, value: string): Promise<void> {
    await this.upsert({ key, value }, { onConflictFields: ['key'], onConflictAction: 'merge' });
  }
}
