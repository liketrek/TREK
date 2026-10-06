import { getRawConnection } from './database';
import { NulSafeSqlitePlatform } from './nul-safe-sqlite-platform';
import type { Configuration } from '@mikro-orm/core';
import type { SqlitePlatform } from '@mikro-orm/sql';
import { SqliteConnection, SqliteDriver } from '@mikro-orm/sqlite';

import type Database from 'better-sqlite3';
import { SqliteDialect, SqliteDriver as KyselySqliteDriver, type Dialect, type SqliteDialectConfig } from 'kysely';

/**
 * The stock Kysely SQLite driver's `destroy()` unconditionally does
 * `db.close()`. MikroORM's own `close()` (`AbstractSqlConnection.close()`)
 * always calls the Kysely client's `destroy()` too, regardless of the `force`
 * flag it was given, and it caches that client behind a private field — so a
 * `SqliteConnection` subclass has no hook to intercept just that one call.
 * The fix has to live at the Kysely layer: hand MikroORM a driver identical to
 * the stock one except `destroy()` is a no-op, so closing the ORM never closes
 * a handle somebody else owns.
 */
class NonClosingSqliteDriver extends KyselySqliteDriver {
  override async destroy(): Promise<void> {
    // The handle's owner (whoever `getHandle` below reads from) closes it.
  }
}

/**
 * A SQLite driver bound to a better-sqlite3 handle somebody else owns.
 *
 * Forced by the test harness: `database.ts` hands each vitest worker
 * `:memory:`, and in better-sqlite3 an in-memory database belongs to its
 * *connection* — two connections to `:memory:` are two unrelated databases.
 * MikroORM's stock `SqliteConnection.createKyselyDialect()` always does
 * `new Database(dbName)`, so it would migrate a database nothing else in the
 * process can see. Sharing the handle also keeps the single-writer property the
 * app has always had: one handle, one WAL.
 *
 * `getHandle` is called on every (re)connect rather than once: a backup restore
 * closes the handle and opens a new one, and Kysely caches whatever it is given
 * for the life of its client, so `reinitialize()` closes the connection and the
 * next `connect()` lands here again with the new handle.
 */
export function createBoundSqliteDriver(getHandle: () => Database.Database): typeof SqliteDriver {
  class BoundSqliteConnection extends SqliteConnection {
    override createKyselyDialect(): Dialect {
      const handle = getHandle();
      const config: SqliteDialectConfig = { database: handle };
      // `SqliteConnection.getNativeClient()` reads this private field, but only
      // ever sets it from the base class's own `createKyselyDialect()` — which
      // this override replaces entirely, so it never runs. Capturing it here
      // too is what lets a migration reach this exact synchronous
      // better-sqlite3 handle via `getNativeClient()` in production, not just
      // under the unbound test driver (`createMigrationOrm()` in
      // tests/helpers/migration-step.ts, whose stock SqliteConnection sets it
      // unmodified). Needed by migrations that call a frozen, hand-written
      // step directly instead of through `this.execute()` — e.g.
      // Migration20200101040300, which calls reseat-booked-nights.ts.
      (this as unknown as { database: Database.Database }).database = handle;
      // Delegate the compiler/adapter/introspector to a throwaway stock dialect
      // (stateless factories); only `createDriver()` needs the non-closing swap.
      const stock = new SqliteDialect(config);
      return {
        createDriver: () => new NonClosingSqliteDriver(config),
        createQueryCompiler: () => stock.createQueryCompiler(),
        createAdapter: () => stock.createAdapter(),
        createIntrospector: (db) => stock.createIntrospector(db),
      };
    }
  }

  return class BoundSqliteDriver extends SqliteDriver {
    constructor(config: Configuration) {
      super(config);
      // The base constructor already built a stock SqliteConnection; replace it
      // before anything connects. `connection` is protected on AbstractSqlDriver
      // and SqliteDriver's constructor hardcodes the class, so there is no
      // supported hook for supplying it.
      (this as unknown as { connection: SqliteConnection }).connection = new BoundSqliteConnection(config);
      // Program rule 22 (NulSafeSqlitePlatform's own docstring): `SqliteDriver`'s
      // constructor hardcodes `new SqlitePlatform()` too, with no config hook to
      // supply a different one. `DatabaseDriver.platform` is a plain, reassignable
      // field — `DatabaseDriver.setMetadata()` (called once, during
      // `MikroORM.init()`, always after this constructor returns) is what actually
      // propagates it to the connection via `connection.setPlatform(this.platform)`,
      // so replacing it here, synchronously, is in time for every later read.
      (this as unknown as { platform: SqlitePlatform }).platform = new NulSafeSqlitePlatform();
    }
  };
}

/**
 * The production driver: bound to the connection `db/database.ts` owns.
 *
 * Wrapped in a closure rather than passed as `getRawConnection` directly:
 * `createBoundSqliteDriver` doesn't call its argument until something actually
 * connects, but merely *reading* the `getRawConnection` binding here would —
 * this module is evaluated at import time, and a test that mocks
 * `db/database` with a partial replacement (most do, via `buildDbMock` or a
 * hand-rolled object) throws on that read even when the test never touches
 * the database at all.
 */
export const SharedSqliteDriver = createBoundSqliteDriver(() => getRawConnection());
