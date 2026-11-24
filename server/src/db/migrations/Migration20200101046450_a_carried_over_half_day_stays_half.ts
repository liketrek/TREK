import { engineDdl } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * A vacation day can be taken as a half day (`vacay_entries.fraction` 0.5), so
 * what is left of a year and carried into the next one can end in a half:
 * 30 days less one half day carries 29.5. `vacay_user_years.carried_over` was
 * declared INTEGER. SQLite stored 29.5 in it anyway, as a REAL, while Postgres,
 * where the column was `bigint`, rounded it to 30, so the two engines disagreed
 * about every balance with a half day in it, and a SQLite install holding such a
 * value could not be moved to Postgres.
 *
 * The column becomes a REAL on SQLite and `double precision` on Postgres, the
 * type `vacay_entries.fraction` already has. `vacation_days`, the allowance a
 * member sets, stays a whole number.
 *
 * SQLite cannot change a column's type in place, so its table is rebuilt: the
 * same columns, keys, index and AUTOINCREMENT counter, every row with its id.
 * No other table points at `vacay_user_years`.
 */
export class Migration20200101046450_a_carried_over_half_day_stays_half extends Migration {
  override name = 'Migration20200101046450_a_carried_over_half_day_stays_half';

  override up(): void {
    engineDdl(this, {
      sqlite: [
        `CREATE TABLE vacay_user_years_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
          year INTEGER NOT NULL,
          vacation_days INTEGER DEFAULT 30,
          carried_over REAL DEFAULT 0,
          UNIQUE(user_id, plan_id, year)
        )`,
        `INSERT INTO vacay_user_years_new (id, user_id, plan_id, year, vacation_days, carried_over)
          SELECT id, user_id, plan_id, year, vacation_days, carried_over FROM vacay_user_years`,
        // The copy left the new table's counter at its highest id; the old
        // counter can be above that when the newest rows were deleted.
        `UPDATE sqlite_sequence SET seq = (SELECT old.seq FROM sqlite_sequence old WHERE old.name = 'vacay_user_years')
          WHERE name = 'vacay_user_years_new'
            AND seq < (SELECT old.seq FROM sqlite_sequence old WHERE old.name = 'vacay_user_years')`,
        `INSERT INTO sqlite_sequence (name, seq)
          SELECT 'vacay_user_years_new', seq FROM sqlite_sequence WHERE name = 'vacay_user_years'
            AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'vacay_user_years_new')`,
        'DROP TABLE vacay_user_years',
        'ALTER TABLE vacay_user_years_new RENAME TO vacay_user_years',
        'CREATE INDEX idx_vacay_user_years_plan_id ON vacay_user_years(plan_id)',
      ],
      postgres: [
        'alter table "vacay_user_years" alter column "carried_over" type double precision using ("carried_over"::double precision)',
      ],
    });
  }
}
