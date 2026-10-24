import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 86 (`db/migrations.ts`).
 *
 * Migration: Refresh-token rotation chain tracking for replay detection
 */
export class Migration20200101012600_refresh_token_rotation_chain_tracking_for_replay extends Migration {
  override name = 'Migration20200101012600_refresh_token_rotation_chain_tracking_for_replay';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'oauth_tokens',
      'parent_token_id',
      `parent_token_id INTEGER REFERENCES oauth_tokens(id)`,
    );

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_oauth_tokens_parent ON oauth_tokens(parent_token_id)`);
  }
}
