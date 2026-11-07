import { closeDb, getRawConnection, registerReinitializeHook, reinitialize } from '../../database';
import { resolveDbPath } from '../../db-path';
import { runSchemaBootstrap, type AnyOrm } from '../../orm';
import { SharedSqliteDriver } from '../../orm-driver';
import type { DatabaseEngine } from '../engine';
import type { EntityManager } from '@mikro-orm/core';

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

  /**
   * Opens the file (normally a no-op: the ORM's first connect inside
   * NestFactory.create() already did, said here so the boot does not depend on
   * that), and registers the reopen. A reopen swaps the file under the same
   * handle, which Kysely caches, so the ORM's connection is closed and connected
   * again first: the driver then reaches the new handle through
   * `createKyselyDialect()`. The bound driver's `destroy()` is a no-op
   * (`orm-driver.ts`), so the close never reaches the handle `db/database.ts` owns.
   */
  open(orm: AnyOrm, onReopened: () => Promise<void>): void {
    getRawConnection();
    registerReinitializeHook(async () => {
      const connection = orm.em.getConnection();
      await connection.close(true);
      await connection.connect();
      await onReopened();
    });
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

  /** A no-op: SQLite has one connection and one writer, so its transactions already run one at a time. */
  serializeWrites(_em: EntityManager): Promise<void> {
    return Promise.resolve();
  }
}
