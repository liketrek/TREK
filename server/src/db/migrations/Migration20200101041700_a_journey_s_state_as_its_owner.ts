import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 256 (`db/migrations.ts`).
 *
 * A journey's state as its owner sets it (#762): draft, live or completed. NULL
 * keeps the state derived from the linked trips' dates, which is what every
 * journey had so far; a journey with no trip could only ever be a draft.
 */
export class Migration20200101041700_a_journey_s_state_as_its_owner extends Migration {
  override name = 'Migration20200101041700_a_journey_s_state_as_its_owner';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'journeys', 'status_override', `status_override TEXT`);
  }
}
