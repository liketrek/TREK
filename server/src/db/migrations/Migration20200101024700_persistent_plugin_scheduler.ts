import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 167 (`db/migrations.ts`).
 *
 * Persistent plugin scheduler (#plugins). A plugin with the existing `jobs:run`
 * grant can schedule a userless callback to fire at a future time (once, or
 * recurring), surviving server restarts because the entry lives here. Same risk
 * class as cron jobs (no user, no trip reads, own db + declared egress only) —
 * so it rides on `jobs:run`, no new consent. UNIQUE(plugin_id, name) makes
 * scheduler.set an upsert and cancel deterministic. Rows are purged on uninstall.
 */
export class Migration20200101024700_persistent_plugin_scheduler extends Migration {
  override name = 'Migration20200101024700_persistent_plugin_scheduler';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS plugin_scheduled_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        name TEXT NOT NULL,
        due_at INTEGER NOT NULL,
        payload TEXT NOT NULL DEFAULT 'null',
        every_ms INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (plugin_id, name)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_plugin_sched_due ON plugin_scheduled_tasks (due_at)`);
  }
}
