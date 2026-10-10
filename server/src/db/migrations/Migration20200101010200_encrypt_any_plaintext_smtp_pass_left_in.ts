import { encrypt_api_key } from '../../nest/common/crypto/apiKeyCrypto';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 62 (`db/migrations.ts`).
 *
 * Encrypt any plaintext smtp_pass left in app_settings.
 */
export class Migration20200101010200_encrypt_any_plaintext_smtp_pass_left_in extends Migration {
  override name = 'Migration20200101010200_encrypt_any_plaintext_smtp_pass_left_in';

  override async up(): Promise<void> {
    const rows = (await this.execute(`SELECT value FROM app_settings WHERE key = 'smtp_pass'`)) as {
      value: string | null;
    }[];
    const value = rows[0]?.value;
    if (!value || value.startsWith('enc:v1:')) return;
    await this.execute(`UPDATE app_settings SET value = ? WHERE key = 'smtp_pass'`, [encrypt_api_key(value)]);
  }
}
