import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 130 (`db/migrations.ts`).
 *
 * Migration: OAuth 2.0 client_credentials grant — allow user-owned confidential
 * clients to skip the browser consent flow entirely and obtain tokens directly
 * via client_id + client_secret. Flag is immutable after creation so existing
 * authorization-code clients are not silently upgraded.
 */
export class Migration20200101021000_oauth_2 extends Migration {
  override name = 'Migration20200101021000_oauth_2';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'oauth_clients',
      'allows_client_credentials',
      `allows_client_credentials INTEGER NOT NULL DEFAULT 0`,
    );
  }
}
