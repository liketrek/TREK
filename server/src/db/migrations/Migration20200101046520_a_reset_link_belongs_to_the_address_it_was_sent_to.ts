import { engineDdl } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * A password reset link remembers the address it was mailed to, so it stops
 * working once the account has moved to another address.
 *
 * `password_reset_tokens.email` holds the account's address at the moment the
 * link was issued. Every link issued before this step starts empty and keeps
 * working until it expires or is used, as it did before.
 */
export class Migration20200101046520_a_reset_link_belongs_to_the_address_it_was_sent_to extends Migration {
  override name = 'Migration20200101046520_a_reset_link_belongs_to_the_address_it_was_sent_to';

  override up(): void {
    engineDdl(this, {
      sqlite: ['ALTER TABLE password_reset_tokens ADD COLUMN email TEXT'],
      postgres: ['alter table "password_reset_tokens" add column "email" text null'],
    });
  }
}
