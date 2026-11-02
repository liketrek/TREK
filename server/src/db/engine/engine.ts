import type { Options } from '@mikro-orm/core';

/** The databases TREK can be pointed at. MySQL/MariaDB are out of scope (server/CLAUDE.md). */
type EngineId = 'sqlite' | 'postgres';

/**
 * One database engine: what the ORM needs to reach it and how to name it in a
 * log line. Code that differs by engine dispatches through this, or through
 * the helpers in `db/dialect/`, never through its own platform check
 * (`lint:engine-dispatch`).
 *
 * Free of Nest like every other file under `db/`: `src/db` does not import
 * `src/nest` (`lint:boundaries`).
 */
export interface DatabaseEngine {
  readonly id: EngineId;
  /** Whether this release can run TREK on the engine; `buildOrmConfig` refuses one that cannot. */
  readonly ready: boolean;
  /** For log lines and errors: the file path, or the URL without its password. */
  describe(): string;
  /** What MikroORM needs to reach the database: the driver and its target, the pool, driver options. */
  ormOptions(): Partial<Options>;
}
