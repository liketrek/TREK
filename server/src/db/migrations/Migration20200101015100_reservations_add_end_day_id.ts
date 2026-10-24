import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 111 (`db/migrations.ts`).
 *
 * Migration 110 — link transport reservations to days via day_id / end_day_id
 */
export class Migration20200101015100_reservations_add_end_day_id extends Migration {
  override name = 'Migration20200101015100_reservations_add_end_day_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'reservations',
      'end_day_id',
      `end_day_id INTEGER REFERENCES days(id) ON DELETE SET NULL`,
    );

    await this.execute(`
      UPDATE reservations
      SET day_id = (
        SELECT d.id FROM days d
        WHERE d.trip_id = reservations.trip_id
          AND d.date = substr(reservations.reservation_time, 1, 10)
        LIMIT 1
      )
      WHERE type IN ('flight','train','car','cruise','bus')
        AND reservation_time IS NOT NULL
        AND day_id IS NULL
    `);

    await this.execute(`
      UPDATE reservations
      SET end_day_id = (
        SELECT d.id FROM days d
        WHERE d.trip_id = reservations.trip_id
          AND d.date = substr(reservations.reservation_end_time, 1, 10)
        LIMIT 1
      )
      WHERE type IN ('flight','train','car','cruise','bus')
        AND reservation_end_time IS NOT NULL
        AND end_day_id IS NULL
        AND substr(reservations.reservation_end_time, 1, 10) != substr(reservations.reservation_time, 1, 10)
    `);
  }
}
