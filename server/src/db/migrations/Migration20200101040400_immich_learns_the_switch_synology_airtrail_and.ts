import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 243 (`db/migrations.ts`).
 *
 * Immich learns the switch Synology, AirTrail and Dawarich already have: a
 * server behind a self-signed certificate can be trusted per user (#2475).
 * Off by default, and only 1 counts as on.
 *
 * The two settings rows are the toggle for it and the auto-upload toggle
 * step 113 (`Migration20200101015300`) meant to add. That one only ran
 * where the Immich provider row already existed, which on a fresh install it
 * never did (the seeders run after the migrations), so fresh installs never
 * showed the upload toggle. Both rows are in `PhotoProviderSeeder` as well for
 * the same reason; here they reach the installs that already have the provider
 * row. Re-runnable.
 */
export class Migration20200101040400_immich_learns_the_switch_synology_airtrail_and extends Migration {
  override name = 'Migration20200101040400_immich_learns_the_switch_synology_airtrail_and';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'users',
      'immich_allow_insecure_tls',
      `immich_allow_insecure_tls INTEGER NOT NULL DEFAULT 0`,
    );
    const immich = await this.execute(`SELECT 1 AS present FROM photo_providers WHERE id = 'immich' LIMIT 1`);
    if (immich.length === 0) return;
    await this.execute(`
      INSERT OR IGNORE INTO photo_provider_fields
        (provider_id, field_key, label, input_type, placeholder, hint, required, secret, settings_key, payload_key, sort_order)
      VALUES
        ('immich', 'immich_allow_insecure_tls', 'skipSSLVerification', 'checkbox', NULL, NULL, 0, 0, 'allow_insecure_tls', 'allow_insecure_tls', 2),
        ('immich', 'immich_auto_upload', 'immichAutoUpload', 'checkbox', NULL, NULL, 0, 0, 'auto_upload', 'auto_upload', 5)
    `);
  }
}
