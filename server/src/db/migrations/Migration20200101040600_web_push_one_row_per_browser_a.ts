import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 245 (`db/migrations.ts`).
 *
 * Web Push (#894): one row per browser a user switched push on in.
 *
 * The endpoint is the push service URL that browser handed out, so it is
 * unique: a browser shared by two accounts belongs to whoever subscribed on it
 * last. p256dh and auth are the browser's keys for the RFC 8291 message
 * encryption. vapid_public_key is the server key the subscription was made
 * against, so a changed key pair shows up as a mismatch the sender can clean
 * up, rather than as a push service refusing every message. failure_count and
 * last_success_at are bookkeeping for the sender; the rows go with the user.
 *
 * Web Push was 244 before the #2527 trigger took that slot to match main. A
 * 4.3.3 install is already at 244 with the trigger and gets the table here; an
 * instance that ran this at 244 replays it as a no-op.
 */
export class Migration20200101040600_web_push_one_row_per_browser_a extends Migration {
  override name = 'Migration20200101040600_web_push_one_row_per_browser_a';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        vapid_public_key TEXT NOT NULL,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_success_at TEXT,
        failure_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id)`);
  }
}
