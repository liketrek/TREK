import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * A trip reminder remembers the start date it was sent for. The daily job
 * used to match only "starts exactly N days from today", so a day the server
 * was down at the job's hour lost that day's reminders for good. With the
 * date on record the job sends every reminder that is due and not yet sent,
 * and a trip moved to a new start date is reminded again.
 *
 * Trips whose reminder day already passed are marked as sent, so the first
 * run after the upgrade does not repeat reminders that went out before.
 */
export class Migration20200101042100_a_trip_reminder_remembers_it_was_sent extends Migration {
  override name = 'Migration20200101042100_a_trip_reminder_remembers_it_was_sent';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trips', 'reminder_sent_for', 'reminder_sent_for TEXT');
    this.addSql(`
      UPDATE trips SET reminder_sent_for = start_date
      WHERE start_date IS NOT NULL AND reminder_days > 0
        AND date(start_date, '-' || reminder_days || ' days') < date('now')
    `);
  }
}
