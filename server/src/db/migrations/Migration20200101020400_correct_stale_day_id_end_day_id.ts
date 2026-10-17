import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 124 (`db/migrations.ts`).
 *
 * Migration 122: Correct stale day_id / end_day_id on non-transport
 * reservations. Migration 110 only backfilled transport types; tours,
 * restaurants, events and "other" bookings kept a stale day_id from
 * older code paths that often defaulted to the first day of the trip.
 * Starting with v3.0.0 the planner renders reservations by day_id
 * instead of reservation_time, so those stale rows show up on the
 * wrong day. This migration nulls out day_id / end_day_id values that
 * don't match the reservation's time and then backfills them from
 * reservation_time / reservation_end_time.
 */
export class Migration20200101020400_correct_stale_day_id_end_day_id extends Migration {
  override name = 'Migration20200101020400_correct_stale_day_id_end_day_id';

  override up(): void {
    this.addSql(`
      UPDATE reservations
      SET day_id = NULL
      WHERE reservation_time IS NOT NULL
        AND day_id IS NOT NULL
        AND type != 'hotel'
        AND NOT EXISTS (
          SELECT 1 FROM days d
          WHERE d.id = reservations.day_id
            AND d.date = substr(reservations.reservation_time, 1, 10)
        )
    `);

    this.addSql(`
      UPDATE reservations
      SET end_day_id = NULL
      WHERE reservation_end_time IS NOT NULL
        AND end_day_id IS NOT NULL
        AND type != 'hotel'
        AND NOT EXISTS (
          SELECT 1 FROM days d
          WHERE d.id = reservations.end_day_id
            AND d.date = substr(reservations.reservation_end_time, 1, 10)
        )
    `);

    this.addSql(`
      UPDATE reservations
      SET day_id = (
        SELECT d.id FROM days d
        WHERE d.trip_id = reservations.trip_id
          AND d.date = substr(reservations.reservation_time, 1, 10)
        LIMIT 1
      )
      WHERE type != 'hotel'
        AND reservation_time IS NOT NULL
        AND day_id IS NULL
    `);

    this.addSql(`
      UPDATE reservations
      SET end_day_id = (
        SELECT d.id FROM days d
        WHERE d.trip_id = reservations.trip_id
          AND d.date = substr(reservations.reservation_end_time, 1, 10)
        LIMIT 1
      )
      WHERE type != 'hotel'
        AND reservation_end_time IS NOT NULL
        AND end_day_id IS NULL
        AND substr(reservations.reservation_end_time, 1, 10)
            != substr(reservations.reservation_time, 1, 10)
    `);
  }
}
