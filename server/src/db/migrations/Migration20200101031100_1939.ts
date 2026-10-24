import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 191 (`db/migrations.ts`).
 *
 * #1939 — the Google Places and Unsplash keys are instance configuration and now
 * resolve out of app_settings (nest/settings/instance-api-keys.ts). This carries
 * the value the old resolver would have handed out — the lowest-id admin who has
 * one — into that row, so an install that upgrades keeps the key it was
 * searching with instead of falling back to OpenStreetMap.
 *
 * Only where that key already was the whole install's, though. The resolver
 * reads the instance row before the caller's own column, so promoting a personal
 * key while a second row still holds one would move that member onto a
 * stranger's key and a stranger's bill without anyone saying so. As soon as
 * another row has a value for the same column nothing is written: everybody
 * keeps resolving what they resolved before, and a member with no key of their
 * own searches via OpenStreetMap until an admin saves the instance key once in
 * the panel. Handing a key to the whole instance is the admin's call, not a
 * migration's.
 *
 * The users columns are left alone: they are still the per-user fallback, and
 * nothing here can lose a value. Stored blobs are copied verbatim; both sides
 * use the same apiKeyCrypto format, legacy plaintext included.
 */
export class Migration20200101031100_1939 extends Migration {
  override name = 'Migration20200101031100_1939';

  override async up(): Promise<void> {
    for (const column of ['maps_api_key', 'unsplash_api_key'] as const) {
      const existing = (await this.execute(`SELECT value FROM app_settings WHERE key = ?`, [column])) as {
        value: string | null;
      }[];
      if (existing[0]?.value) continue;

      const candidates = (await this.execute(
        `SELECT id, ${column} AS value FROM users
          WHERE role = 'admin' AND ${column} IS NOT NULL AND ${column} != ''
          ORDER BY id ASC LIMIT 1`,
      )) as { id: number; value: string }[];
      const row = candidates[0];
      if (!row?.value) continue;

      const otherHolder = await this.execute(
        `SELECT 1 AS present FROM users
          WHERE id != ? AND ${column} IS NOT NULL AND ${column} != '' LIMIT 1`,
        [row.id],
      );
      if (otherHolder.length > 0) continue;

      await this.execute(
        `INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [column, row.value],
      );
    }
  }
}
