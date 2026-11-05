import { Migration } from '@mikro-orm/migrations';

/**
 * The storage reclaim pass remembers, per stored object, since when no row has
 * named it. An object is deleted only once it has stayed unreferenced on every
 * pass for a week (and only when the admin switched deletion on), so a value a
 * client writes back late, an offline replay or a copy made in between keeps
 * its object. A row goes as soon as its object is referenced again or gone.
 */
export class Migration20200101046330_an_object_no_row_names_is_marked_before_it_goes extends Migration {
  override name = 'Migration20200101046330_an_object_no_row_names_is_marked_before_it_goes';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS storage_reclaim_marks (
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        first_seen_at DATETIME NOT NULL,
        size INTEGER NOT NULL,
        PRIMARY KEY (category, key)
      )
    `);
  }
}
