import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 87 (`db/migrations.ts`).
 *
 * Migration: Public client support for browser-initiated dynamic registration (DCR)
 */
export class Migration20200101012700_public_client_support_for_browser_initiated_dynamic extends Migration {
  override name = 'Migration20200101012700_public_client_support_for_browser_initiated_dynamic';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'oauth_clients', 'is_public', `is_public INTEGER NOT NULL DEFAULT 0`);

    await addColumnIfMissing(this, 'oauth_clients', 'created_via', `created_via TEXT NOT NULL DEFAULT 'settings_ui'`);
  }
}
