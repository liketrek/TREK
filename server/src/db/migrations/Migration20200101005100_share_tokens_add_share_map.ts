import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 51 (`db/migrations.ts`).
 */
export class Migration20200101005100_share_tokens_add_share_map extends Migration {
  override name = 'Migration20200101005100_share_tokens_add_share_map';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'share_tokens', 'share_map', `share_map INTEGER DEFAULT 1`);

    await addColumnIfMissing(this, 'share_tokens', 'share_bookings', `share_bookings INTEGER DEFAULT 1`);

    await addColumnIfMissing(this, 'share_tokens', 'share_packing', `share_packing INTEGER DEFAULT 0`);

    await addColumnIfMissing(this, 'share_tokens', 'share_budget', `share_budget INTEGER DEFAULT 0`);

    await addColumnIfMissing(this, 'share_tokens', 'share_collab', `share_collab INTEGER DEFAULT 0`);
  }
}
