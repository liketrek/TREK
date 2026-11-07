import type { EntityManager } from '@mikro-orm/core';

/**
 * The SQLite engine's whole-file maintenance: the two statements a backup,
 * a restore and the demo reset need that are about the database file rather
 * than any table (`PRAGMA wal_checkpoint`, `VACUUM INTO`). Neither has a
 * Postgres spelling, so they live under the engine that owns the file instead
 * of in `MaintenanceRepository`, whose remaining statements run on every
 * engine (and which the Postgres probe calls method by method).
 *
 * Provided through Nest DI by `MaintenanceModule` (`nest/database/`), a
 * factory over the context-resolving global `EntityManager`, and injected by
 * the SQLite backup port (`SqliteDatabaseBackup`). Free of Nest decorators
 * like every other file under `db/`, so a test can build one over its own
 * `EntityManager`.
 */
export class SqliteMaintenance {
  constructor(private readonly em: EntityManager) {}

  /**
   * MikroORM's own validating `getContext()`: throws outside a request
   * context, the fail-closed check `TrekRepository` applies to every
   * repository, since a raw `connection.execute()` has no such guard.
   */
  private validateRequestContext(): void {
    this.em.getContext();
  }

  /**
   * `PRAGMA wal_checkpoint(TRUNCATE)`: flushes the WAL into the main file
   * before a snapshot or a swap. Reached through the backup port's
   * `checkpoint()`; every caller treats it as best effort.
   */
  async walCheckpoint(): Promise<void> {
    this.validateRequestContext();
    await this.em.getConnection().execute('PRAGMA wal_checkpoint(TRUNCATE)');
  }

  /**
   * `` VACUUM INTO '<path>' ``: a consistent point-in-time copy of the file
   * under concurrent writers, reached through the backup port's
   * `snapshot()`. Single quotes in `path` are escaped by doubling.
   */
  async vacuumInto(path: string): Promise<void> {
    this.validateRequestContext();
    const escaped = path.replaceAll("'", "''");
    await this.em.getConnection().execute(`VACUUM INTO '${escaped}'`);
  }
}
