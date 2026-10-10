import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 180 (`db/migrations.ts`).
 *
 * School holidays are a visual Vacay calendar layer. Keep them separate from
 * public holidays so applyHolidayCalendars never removes vacation entries for
 * school-break dates.
 */
export class Migration20200101030000_school_holidays_are_a_visual_vacay_calendar extends Migration {
  override name = 'Migration20200101030000_school_holidays_are_a_visual_vacay_calendar';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'vacay_plans',
      'school_holidays_enabled',
      `school_holidays_enabled INTEGER DEFAULT 0`,
    );
    await addColumnIfMissing(this, 'vacay_holiday_calendars', 'type', `type TEXT NOT NULL DEFAULT 'public_holiday'`);
  }
}
