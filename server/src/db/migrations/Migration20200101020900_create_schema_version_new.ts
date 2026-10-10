import { readEnv } from '../../app-config';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 129 (`db/migrations.ts`).
 *
 * Give `schema_version` a primary key. The original table was a single bare
 * `version` column.
 */
export class Migration20200101020900_create_schema_version_new extends Migration {
  override name = 'Migration20200101020900_create_schema_version_new';

  override async up(): Promise<void> {
    await this.execute(
      `CREATE TABLE IF NOT EXISTS schema_version_new (id INTEGER PRIMARY KEY AUTOINCREMENT, version INTEGER NOT NULL)`,
    );
    await this.execute(`INSERT INTO schema_version_new (version) SELECT version FROM schema_version`);
    await this.execute(`DROP TABLE schema_version`);
    await this.execute(`ALTER TABLE schema_version_new RENAME TO schema_version`);
    await this.execute(`UPDATE app_settings SET value = ? WHERE key = 'app_version'`, [
      readEnv().app.appVersion || '3.0.15',
    ]);
  }
}
