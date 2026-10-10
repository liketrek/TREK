import { encrypt_api_key } from '../../nest/common/crypto/apiKeyCrypto';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 63 (`db/migrations.ts`).
 *
 * Encrypt any plaintext immich_api_key values in the users table.
 */
export class Migration20200101010300_encrypt_any_plaintext_immich_api_key_values extends Migration {
  override name = 'Migration20200101010300_encrypt_any_plaintext_immich_api_key_values';

  override async up(): Promise<void> {
    const rows = (await this.execute(
      `SELECT id, immich_api_key FROM users WHERE immich_api_key IS NOT NULL AND immich_api_key != '' AND immich_api_key NOT LIKE 'enc:v1:%'`,
    )) as { id: number; immich_api_key: string }[];
    for (const row of rows) {
      await this.execute(`UPDATE users SET immich_api_key = ? WHERE id = ?`, [
        encrypt_api_key(row.immich_api_key),
        row.id,
      ]);
    }
  }
}
