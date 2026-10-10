import { tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 118 (`db/migrations.ts`).
 *
 * Widen the idempotency_keys primary key to (key, user_id, method, path). The
 * middleware lookup was widened in the same audit batch so a reused
 * `X-Idempotency-Key` against a different endpoint does not replay the cached
 * body of an unrelated request. The old PK was only (key, user_id), so the
 * `INSERT OR IGNORE` on the second endpoint silently skipped — the cache never
 * stored request B's response and replays re-executed the handler. Rebuilding
 * with the widened PK preserves existing rows: the old PK guarantees there are
 * no conflicts under the new, strictly looser unique key.
 */
export class Migration20200101015800_widen_idempotency_keys_primary_key_to extends Migration {
  override name = 'Migration20200101015800_widen_idempotency_keys_primary_key_to';

  override async up(): Promise<void> {
    if (!(await tableExists(this, 'idempotency_keys'))) return;

    await this.execute(`
      CREATE TABLE idempotency_keys_new (
        key         TEXT NOT NULL,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method      TEXT NOT NULL,
        path        TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        response_body TEXT NOT NULL,
        created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        PRIMARY KEY (key, user_id, method, path)
      )
    `);
    await this.execute(`
      INSERT INTO idempotency_keys_new (key, user_id, method, path, status_code, response_body, created_at)
        SELECT key, user_id, method, path, status_code, response_body, created_at FROM idempotency_keys
    `);
    await this.execute(`DROP TABLE idempotency_keys`);
    await this.execute(`ALTER TABLE idempotency_keys_new RENAME TO idempotency_keys`);
    await this.execute(`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON idempotency_keys(created_at)`);
  }
}
