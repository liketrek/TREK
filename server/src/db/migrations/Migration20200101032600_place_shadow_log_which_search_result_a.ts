import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 206 (`db/migrations.ts`).
 *
 * Place shadow log: which search result a user actually picked.
 * The corpus behind "would our own index have found that too". No user id,
 * no trip, no session and no result list — the evaluation compares a query
 * against a pick, and anything beyond that would be collecting for its own
 * sake on an instance that promises not to.
 * The table is created regardless of the switch: the switch decides whether
 * rows are written, and a schema that appears only when a feature is
 * enabled is a schema that differs between installs.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101032600_place_shadow_log_which_search_result_a extends Migration {
  override name = 'Migration20200101032600_place_shadow_log_which_search_result_a';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS place_shadow_picks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        query TEXT NOT NULL,
        lang TEXT,
        bias_lat REAL,
        bias_lng REAL,
        source TEXT NOT NULL,
        live_rank INTEGER NOT NULL,
        live_count INTEGER NOT NULL,
        picked_name TEXT NOT NULL,
        picked_lat REAL NOT NULL,
        picked_lng REAL NOT NULL,
        picked_place_id TEXT
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_place_shadow_created ON place_shadow_picks(created_at)`);
  }
}
