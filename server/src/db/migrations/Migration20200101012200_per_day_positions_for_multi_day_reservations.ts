import { Migration } from '@mikro-orm/migrations';

/** A reservation that still carries the old single, trip-wide plan position. */
interface PositionedReservation {
  id: number;
  trip_id: number;
  reservation_time: string | null;
  reservation_end_time: string | null;
  day_plan_position: number;
}

/**
 * Legacy migration step 82 (`db/migrations.ts`).
 *
 * Per-day positions for multi-day reservations: one global position becomes one
 * row per day the reservation spans, so a stay can sit in a different slot on
 * each of its days.
 */
export class Migration20200101012200_per_day_positions_for_multi_day_reservations extends Migration {
  override name = 'Migration20200101012200_per_day_positions_for_multi_day_reservations';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS reservation_day_positions (
        reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        position REAL NOT NULL,
        PRIMARY KEY (reservation_id, day_id)
      )
    `);

    const reservations = (await this.execute(
      `SELECT id, trip_id, reservation_time, reservation_end_time, day_plan_position FROM reservations WHERE day_plan_position IS NOT NULL`,
    )) as PositionedReservation[];

    for (const r of reservations) {
      const startDate = r.reservation_time?.split('T')[0];
      if (!startDate) continue;
      const endDate = r.reservation_end_time?.split('T')[0] || startDate;

      const matchingDays = (await this.execute(`SELECT id FROM days WHERE trip_id = ? AND date >= ? AND date <= ?`, [
        r.trip_id,
        startDate,
        endDate,
      ])) as { id: number }[];

      for (const day of matchingDays) {
        await this.execute(
          `INSERT OR IGNORE INTO reservation_day_positions (reservation_id, day_id, position) VALUES (?, ?, ?)`,
          [r.id, day.id, r.day_plan_position],
        );
      }
    }
  }
}
