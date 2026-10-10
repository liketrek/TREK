import { addColumnIfMissing, execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 22 (`db/migrations.ts`).
 *
 * Moves reservation state off the place and onto the day assignment, so the same
 * place booked on two days keeps two independent bookings. The copy is
 * best-effort: it reads `places` columns that a later step removes, and the
 * original step logged and swallowed a failure rather than blocking the boot.
 */
export class Migration20200101002200_day_assignments_add_reservation_status extends Migration {
  override name = 'Migration20200101002200_day_assignments_add_reservation_status';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_assignments', 'reservation_status', `reservation_status TEXT DEFAULT 'none'`);
    await addColumnIfMissing(this, 'day_assignments', 'reservation_notes', `reservation_notes TEXT`);
    await addColumnIfMissing(this, 'day_assignments', 'reservation_datetime', `reservation_datetime TEXT`);

    await execBestEffort(
      this,
      `
      UPDATE day_assignments SET
        reservation_status = (SELECT reservation_status FROM places WHERE places.id = day_assignments.place_id),
        reservation_notes = (SELECT reservation_notes FROM places WHERE places.id = day_assignments.place_id),
        reservation_datetime = (SELECT reservation_datetime FROM places WHERE places.id = day_assignments.place_id)
      WHERE place_id IN (SELECT id FROM places WHERE reservation_status IS NOT NULL AND reservation_status != 'none')
    `,
    );
  }
}
