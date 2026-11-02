import { closeDb, getRawConnection, registerReinitializeHook, reinitialize } from '../../database';
import { resolveDbPath } from '../../db-path';
import { runSchemaBootstrap, type AnyOrm } from '../../orm';
import { SharedSqliteDriver } from '../../orm-driver';
import type { DatabaseEngine } from '../engine';

/**
 * The SQLite file engine, TREK's default: one better-sqlite3 handle that
 * `db/database.ts` owns and the ORM's bound driver shares (`db/orm-driver.ts`),
 * on `TREK_DB_FILE` or `data/travel.db` (`:memory:` under test). A restore
 * swaps the file and reopens the handle; the schema comes from the migration
 * chain (`db/orm.ts`).
 */
export class SqliteEngine implements DatabaseEngine {
  readonly id = 'sqlite';

  describe(): string {
    return `SQLite file ${resolveDbPath()}`;
  }

  ormOptions() {
    return { driver: SharedSqliteDriver, dbName: resolveDbPath() };
  }

  open(onReopened: () => Promise<void>): void {
    // Normally a no-op: the ORM's first connect inside NestFactory.create()
    // already opened it. Said here so the boot does not depend on that.
    getRawConnection();
    registerReinitializeHook(onReopened);
  }

  close(): void {
    closeDb();
  }

  reopen(): Promise<void> {
    return reinitialize();
  }

  schemaBootstrap(orm: AnyOrm, options: { snapshot: boolean }): Promise<void> {
    return runSchemaBootstrap(orm, options);
  }
}
