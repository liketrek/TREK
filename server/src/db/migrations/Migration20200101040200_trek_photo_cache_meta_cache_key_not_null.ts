import { Migration } from '@mikro-orm/migrations';

/**
 * Plan 4 Task 8a program carry — `trek_photo_cache_meta.cache_key` was
 * declared a bare `TEXT PRIMARY KEY` (Migration20200101014900), which SQLite
 * does NOT implicitly make `NOT NULL` the way it does for an `INTEGER
 * PRIMARY KEY` rowid alias — a genuine, if surprising, SQLite quirk (3e's R5
 * Task 0 finding). Every statement that writes this column
 * (`TrekPhotoCacheMetaRepository.upsertMeta`'s `INSERT OR REPLACE`, its only
 * writer) has always bound a real `string`, never `null` — this migration
 * tightens the schema to match the code's actual invariant, not a behaviour
 * change. SQLite has no `ALTER COLUMN ... SET NOT NULL`, so the column is
 * added via the standard rebuild-table recipe (the same shape
 * Migration20200101020000 uses in the opposite direction).
 */
export class Migration20200101040200_trek_photo_cache_meta_cache_key_not_null extends Migration {
  override name = 'Migration20200101040200_trek_photo_cache_meta_cache_key_not_null';

  override up(): void {
    this.addSql(`
      CREATE TABLE trek_photo_cache_meta_new (
        cache_key    TEXT    PRIMARY KEY NOT NULL,
        content_type TEXT    NOT NULL DEFAULT 'image/jpeg',
        fetched_at   INTEGER NOT NULL
      )
    `);

    this.addSql(`
      INSERT INTO trek_photo_cache_meta_new
      SELECT cache_key, content_type, fetched_at
      FROM trek_photo_cache_meta
      WHERE cache_key IS NOT NULL
    `);

    this.addSql(`DROP TABLE trek_photo_cache_meta`);

    this.addSql(`ALTER TABLE trek_photo_cache_meta_new RENAME TO trek_photo_cache_meta`);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_trek_photo_cache_meta_fetched_at ON trek_photo_cache_meta (fetched_at)`,
    );
  }
}
