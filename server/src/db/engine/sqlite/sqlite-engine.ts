import { resolveDbPath } from '../../db-path';
import { SharedSqliteDriver } from '../../orm-driver';
import type { DatabaseEngine } from '../engine';

/**
 * The SQLite file engine, TREK's default: one better-sqlite3 handle that
 * `db/database.ts` owns and the ORM's bound driver shares (`db/orm-driver.ts`),
 * on `TREK_DB_FILE` or `data/travel.db` (`:memory:` under test).
 */
export class SqliteEngine implements DatabaseEngine {
  readonly id = 'sqlite';
  readonly ready = true;

  describe(): string {
    return `SQLite file ${resolveDbPath()}`;
  }

  ormOptions() {
    return { driver: SharedSqliteDriver, dbName: resolveDbPath() };
  }
}
