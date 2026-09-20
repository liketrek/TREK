import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 234 (`db/migrations.ts`).
 *
 * Let go of a booking the day stop can no longer reach.
 * day_assignments.accommodation_id was added as a bare INTEGER, and the only
 * code that ever clears it looks the stay up by id. A stay can also vanish
 * without anybody asking: day_accommodations.end_day_id is ON DELETE CASCADE,
 * so shortening a trip past a booking's last night deletes the booking while
 * the stop on its first night survives, now pointing at nothing. Days hides any
 * stop that carries an accommodation_id, so the hotel drops out of the day list
 * on every surface while the route still drives to it, and the id is
 * AUTOINCREMENT, so nothing will ever come along and free the row.
 * A trigger rather than a column rebuild: day_assignments is referenced by two
 * cascading tables of its own, and SQLite fires this even when the stay went
 * down with a foreign-key cascade.
 */
export class Migration20200101035400_let_go_of_a_booking_the_day extends Migration {
  override name = 'Migration20200101035400_let_go_of_a_booking_the_day';

  override up(): void {
    this.addSql(`
      UPDATE day_assignments SET accommodation_id = NULL
      WHERE accommodation_id IS NOT NULL
        AND accommodation_id NOT IN (SELECT id FROM day_accommodations)
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_day_assignments_accommodation_id ON day_assignments(accommodation_id)`);

    this.addSql(`
      CREATE TRIGGER IF NOT EXISTS trg_release_stop_on_stay_delete
              AFTER DELETE ON day_accommodations
              BEGIN
                UPDATE day_assignments SET accommodation_id = NULL WHERE accommodation_id = OLD.id;
      END
    `);
  }
}
