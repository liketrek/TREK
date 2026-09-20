import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 170 (`db/migrations.ts`).
 *
 * Operator-supplied egress hosts for a plugin (#plugins).
 *
 * A plugin's egress allow-list is fixed in its manifest at publish time, but a
 * plugin that talks to a SELF-HOSTED service (Gotify, ntfy, …) cannot know the
 * operator's hostname — so a community plugin could serve nobody. These rows let
 * the ADMIN add hosts post-install; the runtime unions them into the child's
 * allow-list at spawn. Consent stays with the admin (never the end user),
 * exactly as for manifest egress.
 */
export class Migration20200101025000_operator_supplied_egress_hosts_for_a_plugin extends Migration {
  override name = 'Migration20200101025000_operator_supplied_egress_hosts_for_a_plugin';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS plugin_egress_hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT NOT NULL,
        host TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (plugin_id, host)
      )
    `);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_plugin_egress_hosts_plugin ON plugin_egress_hosts (plugin_id)`);

    // Whether the plugin DECLARED that it needs operator-supplied hosts. Only
    // such a plugin may have hosts added — an admin can never widen egress for a
    // plugin that never asked for it, so install-time consent still bounds what
    // is possible.
    await addColumnIfMissing(this, 'plugins', 'operator_egress', `operator_egress INTEGER NOT NULL DEFAULT 0`);
  }
}
