import { readEnv } from '../../app-config';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 127 (`db/migrations.ts`).
 *
 * Prepare migration to nest + typeorm.
 */
export class Migration20200101020700_prepare_migration_to_nest_typeorm extends Migration {
  override name = 'Migration20200101020700_prepare_migration_to_nest_typeorm';

  override async up(): Promise<void> {
    await this.execute(
      `CREATE TABLE IF NOT EXISTS migrations (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, timestamp bigint NOT NULL, name varchar NOT NULL)`,
    );
    await this.execute(`INSERT INTO migrations (timestamp, name) VALUES (1777810195344, 'InitialSchema1777810195344')`);
    await this.execute(`INSERT INTO app_settings (key, value) VALUES ('app_version', ?)`, [
      readEnv().app.appVersion || '3.0.14',
    ]);
  }
}
