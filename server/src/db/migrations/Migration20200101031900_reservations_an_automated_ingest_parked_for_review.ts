import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 199 (`db/migrations.ts`).
 *
 * Reservations an automated ingest parked for review are 'staged' and stay out
 * of the two anonymous exports (ICS feed, shared trip) until a person confirms
 * them. Nothing writes 'staged' yet; this is the gate the mail ingest writes
 * through.
 *
 * 'live' as the default is what keeps this from being a breaking change: SQLite
 * fills every existing row on the ALTER, and no current writer names the column,
 * so every booking that is visible today stays visible.
 */
export class Migration20200101031900_reservations_an_automated_ingest_parked_for_review extends Migration {
  override name = 'Migration20200101031900_reservations_an_automated_ingest_parked_for_review';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'reservations', 'ingest_state', `ingest_state TEXT NOT NULL DEFAULT 'live'`);
  }
}
