import { columnNames } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 119 (`db/migrations.ts`).
 *
 * SEC-H6: revoke all OAuth tokens issued before audience binding was enforced.
 * `mcp/index.ts` now unconditionally checks audience; tokens with
 * `audience = NULL` would be permanently rejected by that check, so removing
 * them here avoids leaving dead rows and makes the intent clear.
 */
export class Migration20200101015900_sec_h6_revoke_all_oauth_tokens_issued extends Migration {
  override name = 'Migration20200101015900_sec_h6_revoke_all_oauth_tokens_issued';

  override async up(): Promise<void> {
    const names = await columnNames(this, 'oauth_tokens');
    if (!names.has('audience')) return;
    await this.execute(`DELETE FROM oauth_tokens WHERE audience IS NULL`);
  }
}
