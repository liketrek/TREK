import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 172 (`db/migrations.ts`).
 *
 * Why a plugin's update was REFUSED by the signature check (#plugins). A refused
 * update leaves a working plugin pinned at its old version — previously the
 * reason lived only in a transient toast, so the plugin quietly stopped updating
 * and the admin had to re-attempt an update to rediscover why. Record it instead.
 *
 * `update_block_version` is the registry version that was refused: once the
 * registry offers something NEWER, the block describes an artifact nobody is
 * being offered anymore, so it reads as stale and the admin can just re-attempt
 * (the next install re-verifies and either succeeds or re-blocks with fresh
 * values). Deliberately no `status = 'error'` — the plugin still runs fine on
 * its old code.
 */
export class Migration20200101025200_why_a_plugin_s_update_was_refused extends Migration {
  override name = 'Migration20200101025200_why_a_plugin_s_update_was_refused';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugins', 'update_block_code', `update_block_code TEXT`);
    await addColumnIfMissing(this, 'plugins', 'update_block_detail', `update_block_detail TEXT`);
    await addColumnIfMissing(this, 'plugins', 'update_block_version', `update_block_version TEXT`);
  }
}
