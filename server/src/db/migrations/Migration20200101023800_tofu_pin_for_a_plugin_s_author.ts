import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 158 (`db/migrations.ts`).
 *
 * Migration 158: TOFU pin for a plugin's author signing key (#plugins, #4).
 * Set on first install of a signed plugin; a later install whose registry key
 * differs is a hard stop (author change / key rotation / attack) unless an
 * admin re-trusts. NULL for unsigned plugins (signing is opt-in).
 */
export class Migration20200101023800_tofu_pin_for_a_plugin_s_author extends Migration {
  override name = 'Migration20200101023800_tofu_pin_for_a_plugin_s_author';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugins', 'author_pubkey', `author_pubkey TEXT`);
  }
}
