import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 190 (`db/migrations.ts`).
 *
 * A reservation_day_positions row only makes sense when its reservation and
 * its day are on the same trip. The table carries no trip_id and its two
 * foreign keys only ask that the ids exist, so pairs that never belonged
 * together could accumulate; the writer refuses them now, and this clears
 * whatever an older build let through. This slot keeps the index it shipped
 * with on dev — the array is index-addressed against schema_version.
 */
export class Migration20200101031000_a_reservation_day_positions_row_only_makes extends Migration {
  override name = 'Migration20200101031000_a_reservation_day_positions_row_only_makes';

  override up(): void {
    this.addSql(`
      DELETE FROM reservation_day_positions
      WHERE rowid IN (
        SELECT rdp.rowid
          FROM reservation_day_positions rdp
          JOIN reservations r ON r.id = rdp.reservation_id
          JOIN days d ON d.id = rdp.day_id
         WHERE d.trip_id <> r.trip_id
      )
    `);
  }
}
