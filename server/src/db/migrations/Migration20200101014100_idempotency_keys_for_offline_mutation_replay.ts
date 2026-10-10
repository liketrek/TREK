import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 101 (`db/migrations.ts`).
 *
 * Migration 100: Idempotency keys for offline mutation replay
 */
export class Migration20200101014100_idempotency_keys_for_offline_mutation_replay extends Migration {
  override name = 'Migration20200101014100_idempotency_keys_for_offline_mutation_replay';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key         TEXT NOT NULL,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method      TEXT NOT NULL,
        path        TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        response_body TEXT NOT NULL,
        created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        PRIMARY KEY (key, user_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON idempotency_keys(created_at)`);
  }
}
