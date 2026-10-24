import { Migration } from '@mikro-orm/migrations';

/**
 * LIB-02: a tour taken over from another trip keeps where it came from as
 * written then, the source trip's title and the tour's name. Text, not a
 * pointer: the source may be deleted, renamed or out of the user's reach
 * later, and the copy must never reveal or depend on it. NULL for every other tour.
 */
export class Migration20200101045100_a_tour_remembers_the_trip_it_was_taken_from extends Migration {
  override name = 'Migration20200101045100_a_tour_remembers_the_trip_it_was_taken_from';

  override up(): void {
    this.addSql('ALTER TABLE tours ADD COLUMN taken_over_from_trip_title TEXT');
    this.addSql('ALTER TABLE tours ADD COLUMN taken_over_from_tour_name TEXT');
  }
}
