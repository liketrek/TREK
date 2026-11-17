import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * A tag can belong to a trip. Every tag used to be one person's: a place of a
 * shared trip carried labels only their owner could list, pick again or rename,
 * and a co-traveller had to make their own tag of the same name.
 *
 * A tag with `trip_id` set is the trip's own. Every member reads it, anyone who
 * may edit the trip's places may change it, and it goes when the trip goes.
 * `user_id` keeps who created it. The column stays null on every existing row,
 * which leaves those what they were: personal tags.
 */
export class Migration20200101046440_a_trip_owns_its_tags extends Migration {
  override name = 'Migration20200101046440_a_trip_owns_its_tags';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'tags', 'trip_id', 'trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tags_trip_id ON tags (trip_id)');
  }
}
