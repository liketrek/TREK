import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 89 (`db/migrations.ts`).
 *
 * Add OTP field, skip_ssl column, device_id (did) column, and hint column for
 * Synology Photos.
 */
export class Migration20200101012900_add_otp_field_skip_ssl_column_device extends Migration {
  override name = 'Migration20200101012900_add_otp_field_skip_ssl_column_device';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'photo_provider_fields', 'hint', `hint TEXT`);

    await this.execute(`
      INSERT OR IGNORE INTO photo_provider_fields
        (provider_id, field_key, label, input_type, placeholder, required, secret, settings_key, payload_key, sort_order)
      VALUES
        ('synologyphotos', 'synology_otp', 'providerOTP', 'text', '123456', 0, 0, NULL, 'synology_otp', 3)
    `);

    await addColumnIfMissing(this, 'users', 'synology_skip_ssl', `synology_skip_ssl INTEGER NOT NULL DEFAULT 0`);
    await addColumnIfMissing(this, 'users', 'synology_did', `synology_did TEXT`);

    await this.execute(`
      INSERT OR IGNORE INTO photo_provider_fields
        (provider_id, field_key, label, input_type, placeholder, required, secret, settings_key, payload_key, sort_order)
      VALUES
        ('synologyphotos', 'synology_skip_ssl', 'skipSSLVerification', 'checkbox', NULL, 0, 0, 'synology_skip_ssl', 'synology_skip_ssl', 4)
    `);

    await this.execute(`
      UPDATE photo_provider_fields
      SET hint = 'providerUrlHintSynology'
      WHERE provider_id = 'synologyphotos' AND field_key = 'synology_url'
    `);
  }
}
