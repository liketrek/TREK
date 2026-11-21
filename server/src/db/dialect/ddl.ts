import { isPostgres, isSqlite, unsupported } from './platform';
import type { Platform } from '@mikro-orm/core';

/**
 * Schema statements a migration writes once per engine.
 *
 * A migration after the Postgres baseline's cut (`through` in
 * `assets/postgres/baseline.json`) runs on both engines, and their DDL is not
 * one language: SQLite rebuilds a table where Postgres alters it, and the
 * Postgres side has to read exactly as MikroORM generates it from the entities
 * (`bigint`, `bigserial` ids, `<table>_<column>_foreign` keys), or PARITY-PG
 * fails. So a migration hands both spellings to `engineDdl` in
 * `db/migration-utils.ts`, which picks the one for the engine it runs on here;
 * `npm run gen:pg-migration` writes the Postgres side and `lint:dialect`
 * refuses DDL a newer migration spells outside it.
 */

/** One value per engine, picked by the platform the migration runs on. */
interface PerEngine<T> {
  readonly sqlite: T;
  readonly postgres: T;
}

/** The statements of one schema change, in the order they run, per engine. */
export type EngineDdl = PerEngine<readonly string[]>;

/** A column definition (`status TEXT DEFAULT 'pending'`) per engine, for `addColumnIfMissing`. */
export type EngineColumn = PerEngine<string>;

/** The member of `choices` for the engine behind `platform`; any other engine is refused. */
export function forEngine<T>(platform: Platform, choices: PerEngine<T>): T {
  if (isSqlite(platform)) return choices.sqlite;
  if (isPostgres(platform)) return choices.postgres;
  return unsupported(platform);
}
