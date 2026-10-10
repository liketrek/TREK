import { encrypt_api_key } from '../../nest/common/crypto/apiKeyCrypto';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 61 (`db/migrations.ts`).
 *
 * Encrypt any plaintext oidc_client_secret left in app_settings.
 */
export class Migration20200101010100_encrypt_any_plaintext_oidc_client_secret_left extends Migration {
  override name = 'Migration20200101010100_encrypt_any_plaintext_oidc_client_secret_left';

  override async up(): Promise<void> {
    const rows = (await this.execute(`SELECT value FROM app_settings WHERE key = 'oidc_client_secret'`)) as {
      value: string | null;
    }[];
    const value = rows[0]?.value;
    if (!value || value.startsWith('enc:v1:')) return;
    await this.execute(`UPDATE app_settings SET value = ? WHERE key = 'oidc_client_secret'`, [encrypt_api_key(value)]);
  }
}
