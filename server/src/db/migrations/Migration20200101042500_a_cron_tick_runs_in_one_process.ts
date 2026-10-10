import { Migration } from '@mikro-orm/migrations';

/**
 * A cron tick runs in one process. Every job registered through
 * CronRegistrarService takes a row here before its tick body runs: the row
 * names the process holding the job and until when, and a process only runs
 * the tick when one conditional UPDATE moved the row to itself. Two processes
 * on one database (a rolling update's overlap, a second replica, a stray dev
 * container) therefore no longer both send the reminders, take the backup or
 * run the sync.
 *
 * `expires_at` is in milliseconds since the epoch. A row is only ever written
 * by the scheduler, so there is nothing to backfill.
 */
export class Migration20200101042500_a_cron_tick_runs_in_one_process extends Migration {
  override name = 'Migration20200101042500_a_cron_tick_runs_in_one_process';

  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS scheduler_leases (
        name TEXT NOT NULL PRIMARY KEY,
        owner TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);
  }
}
