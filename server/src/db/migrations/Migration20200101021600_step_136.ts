import { execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 136 (`db/migrations.ts`).
 *
 * AirTrail integration addon — disabled by default (opt-in). The per-user
 * connection lives in Settings → Integrations; this row is only the admin-level
 * global toggle.
 */
export class Migration20200101021600_step_136 extends Migration {
  override name = 'Migration20200101021600_step_136';

  override async up(): Promise<void> {
    await execBestEffort(
      this,
      `INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['airtrail', 'AirTrail', 'Sync flights from your self-hosted AirTrail instance', 'integration', 'Plane', 0, 14],
    );
  }
}
