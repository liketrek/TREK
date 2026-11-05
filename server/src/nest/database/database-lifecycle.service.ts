import { resolveDbPath } from '../../db/db-path';
import type { DatabaseEngine } from '../../db/engine';
import { DATABASE_ENGINE } from './database-engine.module';
import { MikroORM } from '@mikro-orm/core';
import { Inject, Injectable } from '@nestjs/common';

/**
 * The one owner of the core database connection's lifecycle: open, close and
 * reopen, plus the schema bootstrap that has to follow an open.
 *
 * The handle itself still lives in `db/database.ts`, because the ORM's bound
 * driver (`db/orm-driver.ts`) reads it on every connect and the test suites
 * replace that module wholesale with `vi.mock`. What moved here is every
 * decision about WHEN it opens and closes: `buildApp()` opens through this,
 * a restore and the demo reset close and reopen through this (via the backup
 * port), and the shutdown closes through this. The ORM's first connect is what
 * actually opens the file; this provider makes that step explicit.
 *
 * What differs by engine (a file to open or not, how a reopen reaches the ORM)
 * is the engine's (`db/engine/`), the one `DATABASE_ENGINE` provides: this
 * provider decides when, the engine decides how.
 */
@Injectable()
export class DatabaseLifecycle {
  private readonly reopenListeners: Array<() => Promise<void>> = [];

  constructor(
    private readonly orm: MikroORM,
    @Inject(DATABASE_ENGINE) private readonly engine: DatabaseEngine,
  ) {}

  /**
   * The database file this process runs on, resolved the one way every caller
   * shares (`db/db-path.ts`): `TREK_DB_FILE` when set, `data/travel.db`
   * otherwise, `:memory:` under test.
   */
  get file(): string {
    return resolveDbPath();
  }

  /**
   * Opens the connection, points the engine's reopen at the ORM and brings the
   * schema to head (on SQLite: legacy baseline, migrations, the deferred index,
   * seeders, demo seed, in that order, see `db/orm.ts`; on Postgres: the
   * baseline or the migrations after it, then the same seeding). Called once
   * by `buildApp()`, before anything reads the database.
   */
  async open(): Promise<void> {
    this.engine.open(this.orm, () => this.afterReopen());
    await this.engine.schemaBootstrap(this.orm, { snapshot: true });
  }

  /** Checkpoints and closes the connection. A closed connection stays closed until `reopen()`. */
  close(): void {
    this.engine.close();
  }

  /**
   * Reopens the connection after the database was replaced. The engine points
   * the ORM at the new database first; then `afterReopen` migrates it forward
   * and runs the listeners.
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
   * What follows a reopen once the engine has pointed the ORM at the reopened
   * database. No pre-migrate snapshot: the file was just unpacked from an
   * archive that is still there to go back to.
   */
  private async afterReopen(): Promise<void> {
    await this.engine.schemaBootstrap(this.orm, { snapshot: false });
    for (const listener of this.reopenListeners) await listener();
  }
}
