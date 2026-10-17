import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 143 (`db/migrations.ts`).
 *
 * Calendar feed tokens — subscribable ICS links for per-trip and all-trips feeds
 */
export class Migration20200101022300_calendar_feed_tokens extends Migration {
  override name = 'Migration20200101022300_calendar_feed_tokens';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trips', 'feed_token', `feed_token TEXT`);

    await addColumnIfMissing(this, 'users', 'feed_token', `feed_token TEXT`);

    await this.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_feed_token ON trips(feed_token) WHERE feed_token IS NOT NULL`,
    );

    await this.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_feed_token ON users(feed_token) WHERE feed_token IS NOT NULL`,
    );
  }
}
