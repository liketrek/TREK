import { getRawConnection } from './database';
import type { Configuration } from '@mikro-orm/core';
import { SqliteConnection, SqliteDriver } from '@mikro-orm/sqlite';

import { SqliteDialect } from 'kysely';

/**
 * A SQLite driver that reuses the connection `db/database.ts` already owns
 * instead of opening a second one.
 *
 * This is not a preference — it is forced by the test harness. `database.ts`
 * hands each vitest worker `:memory:`, and in better-sqlite3 an in-memory
 * database belongs to its *connection*: two connections to `:memory:` are two
 * unrelated databases. MikroORM's stock `SqliteConnection.createKyselyDialect()`
 * always does `new Database(dbName)`, so it would migrate a database nothing
 * else in the process can see.
 *
 * Sharing it also keeps the single-writer property the app has always had: one
 * handle, one WAL, no two-writers-on-one-file question in production.
 */
class SharedSqliteConnection extends SqliteConnection {
  /**
   * Resolved lazily, on every (re)connect rather than once at import: a backup
   * restore closes the handle and opens a new one, and Kysely caches whatever it
   * is given for the life of its client. `reinitialize()` closes this connection
   * so that the next `connect()` lands here again and picks up the new handle.
   */
  override createKyselyDialect(): SqliteDialect {
    return new SqliteDialect({ database: getRawConnection() });
  }
}

export class SharedSqliteDriver extends SqliteDriver {
  constructor(config: Configuration) {
    super(config);
    // The base constructor already built a stock SqliteConnection; replace it
    // before anything connects. `connection` is protected on AbstractSqlDriver,
    // and there is no supported hook for supplying the class from a subclass of
    // SqliteDriver (its own constructor hardcodes SqliteConnection).
    (this as unknown as { connection: SqliteConnection }).connection = new SharedSqliteConnection(config);
  }
}
