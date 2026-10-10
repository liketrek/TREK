import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 159 (`db/migrations.ts`).
 *
 * Migration 159: hash-chained capability audit log (#plugins, L1 hardening).
 * Every host-mediated capability call the plugin makes is recorded at the RPC
 * boundary (where the plugin provably can't reach) with the host-bound acting
 * user and a per-plugin hash chain, so wide data grants stay attributable +
 * tamper-evident + user-visible.
 */
export class Migration20200101023900_hash_chained_capability_audit_log extends Migration {
  override name = 'Migration20200101023900_hash_chained_capability_audit_log';

  override async up(): Promise<void> {
    await execBestEffort(
      this,
      `
      CREATE TABLE IF NOT EXISTS plugin_capability_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        acting_user_id INTEGER,
        method TEXT NOT NULL,
        resource TEXT,
        code TEXT NOT NULL,
        ts TEXT NOT NULL DEFAULT (datetime('now')),
        prev_hash TEXT,
        hash TEXT NOT NULL
      )
    `,
    );

    await execBestEffort(
      this,
      `CREATE INDEX IF NOT EXISTS idx_plugin_audit_plugin ON plugin_capability_audit (plugin_id, id)`,
    );
  }
}
