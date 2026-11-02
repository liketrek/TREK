import { resolveDbPath } from '../../db/db-path';
import { resolveEngine } from '../../db/engine';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

/**
 * The one owner of the core database connection's lifecycle: open, close and
 * reopen, plus the schema bootstrap that has to follow an open.
 *
 * The handle itself still lives in `db/database.ts`, because the ORM's bound
 * driver (`db/orm-driver.ts`) reads it on every connect and the test suites
 * replace that module wholesale with `vi.mock`. What moved here is every
 * decision about WHEN it opens and closes: `buildApp()` opens through this,
 * a restore and the demo reset close and reopen through this (via the backup
 * port), and the shutdown closes through this. Nothing opens the database at
 * import any more; the first connect does, and this provider makes it explicit.
 *
 * What differs by engine (a file to open or not, how a database reaches the
 * schema) is the engine's (`db/engine/`), chosen from `TREK_DB_URL`: this
 * provider decides when, the engine decides how.
 */
@Injectable()
export class DatabaseLifecycle {
  private readonly reopenListeners: Array<() => Promise<void>> = [];
  private readonly engine = resolveEngine();

  constructor(private readonly orm: MikroORM) {}

  /**
   * The database file this process runs on, resolved the one way every caller
   * shares (`db/db-path.ts`): `TREK_DB_FILE` when set, `data/travel.db`
   * otherwise, `:memory:` under test.
   */
  get file(): string {
    return resolveDbPath();
  }

  /**
   * Opens the connection, binds the ORM to its later swaps and brings the schema
   * to head (on SQLite: legacy baseline, migrations, the deferred index,
   * seeders, demo seed, in that order, see `db/orm.ts`; on Postgres: the
   * baseline or the migrations after it, then the same seeding). Called once
   * by `buildApp()`, before anything reads the database.
   */
  async open(): Promise<void> {
    this.engine.open(() => this.rebindOrm());
    await this.engine.schemaBootstrap(this.orm, { snapshot: true });
  }

  /** Checkpoints and closes the connection. A closed connection stays closed until `reopen()`. */
  close(): void {
    this.engine.close();
  }

  /**
   * Reopens the connection after its file was replaced, rebuilds the ORM's
   * cached client around the new handle and migrates the new file forward (a
   * restored backup may predate this release).
   */
  async reopen(): Promise<void> {
    await this.engine.reopen();
  }

  /**
   * Runs `listener` after every reopen, once the reopened file has been through
   * the schema bootstrap (migrations, seeders, demo seed). For work that has to
   * follow what that bootstrap did and needs the container, which the bootstrap
   * itself has no access to: the demo reset job saves the first demo baseline
   * here when a restore's re-bootstrap seeded the example trips.
   *
   * A listener contains its own failures. One that throws turns into the
   * reopen's error, which a restore reports as "restart required".
   */
  onReopened(listener: () => Promise<void>): void {
    this.reopenListeners.push(listener);
  }

  /**
   * Kysely caches whatever handle it was given, so without this the ORM would
   * keep talking to the closed one. Closing and reconnecting sends the driver
   * back through `createKyselyDialect()`, which picks up the new handle.
   */
  private async rebindOrm(): Promise<void> {
    const connection = this.orm.em.getConnection();
    // The handle is owned and closed by `db/database.ts`; the bound driver's
    // `destroy()` is a no-op (see `orm-driver.ts`), so this close never reaches it.
    await connection.close(true);
    await connection.connect();
    // No pre-migrate snapshot: the file was just unpacked from an archive that
    // is still there to go back to.
    await this.engine.schemaBootstrap(this.orm, { snapshot: false });
    for (const listener of this.reopenListeners) await listener();
  }
}
