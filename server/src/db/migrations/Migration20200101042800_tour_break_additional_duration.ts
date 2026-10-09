import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/** Breaks and additional planned time stay separate from walking ETA and total override. */
export class Migration20200101042800_tour_break_additional_duration extends Migration {
  override name = 'Migration20200101042800_tour_break_additional_duration';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'tours',
      'break_additional_minutes',
      'break_additional_minutes INTEGER CHECK(break_additional_minutes BETWEEN 0 AND 1440)',
    );
  }
}
