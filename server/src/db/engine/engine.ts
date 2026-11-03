import type { AnyOrm } from '../orm';
import type { EntityManager, Options } from '@mikro-orm/core';

/** The databases TREK can be pointed at. MySQL/MariaDB are out of scope (server/CLAUDE.md). */
type EngineId = 'sqlite' | 'postgres';

/**
 * One database engine: what the ORM needs to reach it, how the connection
 * opens, closes and comes back after a restore, and how a database is brought
 * to the current schema. Code that differs by engine dispatches through this,
 * or through the helpers in `db/dialect/`, never through its own platform
 * check (`lint:engine-dispatch`).
 *
 * Free of Nest like every other file under `db/`: `src/db` does not import
 * `src/nest` (`lint:boundaries`). `DatabaseLifecycle` is the provider that
 * calls it.
 */
export interface DatabaseEngine {
  readonly id: EngineId;
  /** For log lines and errors: the file path, or the URL without its password. */
  describe(): string;
  /** What MikroORM needs to reach the database: the driver and its target, the pool, driver options. */
  ormOptions(): Partial<Options>;
  /**
   * Whether a reopen hands the ORM a different connection, so its client has
   * to be closed and connected again around it. SQLite swaps the file under
   * one handle; a Postgres restore replaces the contents of the same database,
   * which the pool's connections keep reaching.
   */
  readonly reopenSwapsConnection: boolean;
  /**
   * Called once at boot, before the schema bootstrap. `onReopened` is what
   * has to follow a later reopen (rebinding the ORM, migrating the restored
   * database forward).
   */
  open(onReopened: () => Promise<void>): void;
  /** Closes what the engine itself holds; the ORM's own pool is closed with the Nest container. */
  close(): void;
  /** Comes back after the database was replaced by a restore, then runs `onReopened`. */
  reopen(): Promise<void>;
  /**
   * Brings the database to the current schema, then seeds it. `snapshot:
   * false` skips the copy taken before pending migrations (a restore, whose
   * archive is the copy).
   */
  schemaBootstrap(orm: AnyOrm, options: { snapshot: boolean }): Promise<void>;
  /**
   * Runs first in every `UnitOfWork` transaction, on its EntityManager: makes
   * the transactions that write run one at a time, as SQLite's single writer
   * does, so a `MAX(...) + 1` read inside one cannot race another.
   */
  serializeWrites(em: EntityManager): Promise<void>;
}
