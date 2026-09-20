import { tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 113 (`db/migrations.ts`).
 *
 * Migration 112: expose the immich auto-upload toggle in the Settings UI (#730).
 * Runs after Immich provider seeding so the FK to photo_providers holds.
 */
export class Migration20200101015300_expose_immich_auto_upload_toggle_in_the extends Migration {
  override name = 'Migration20200101015300_expose_immich_auto_upload_toggle_in_the';

  override async up(): Promise<void> {
    if (!(await tableExists(this, 'photo_providers'))) return;
    if (!(await tableExists(this, 'photo_provider_fields'))) return;

    const immich = await this.execute(`SELECT 1 AS present FROM photo_providers WHERE id = 'immich' LIMIT 1`);
    if (immich.length === 0) return;

    await this.execute(`
      INSERT OR IGNORE INTO photo_provider_fields
        (provider_id, field_key, label, input_type, placeholder, required, secret, settings_key, payload_key, sort_order)
      VALUES
        ('immich', 'immich_auto_upload', 'immichAutoUpload', 'checkbox', NULL, 0, 0, 'auto_upload', 'auto_upload', 5)
    `);
  }
}
