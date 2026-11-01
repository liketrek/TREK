import { Migration } from '@mikro-orm/migrations';

/**
 * What a user's delete or replace left unnamed waits here before it goes: one
 * row per stored object, due once every undo that can write the old value back
 * has run out. A job then asks every reference source again and deletes only
 * what none of them names; the row goes either way. A row is all an owner's
 * request writes, so a delete stays as cheap as it was before the storage
 * reclaim, whatever the request named.
 */
export class Migration20200101046340_a_released_object_outlasts_every_undo_before_it_goes extends Migration {
  override name = 'Migration20200101046340_a_released_object_outlasts_every_undo_before_it_goes';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS storage_release_queue (
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        due_at DATETIME NOT NULL,
        PRIMARY KEY (category, key)
      )
    `);
  }
}
