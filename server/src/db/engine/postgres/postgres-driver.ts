import { type Configuration } from '@mikro-orm/core';
import { PostgreSqlConnection, PostgreSqlDriver } from '@mikro-orm/postgresql';

/** The `pg` type id of `bigint` (`int8`): every integer column and every `count(*)` on Postgres. */
const INT8_OID = 20;

/**
 * Reads a `bigint` as a JavaScript number, the way better-sqlite3 hands
 * SQLite's 64-bit INTEGER to the services. `pg` returns it as a string to
 * keep precision past 2^53; no TREK value comes near that (ids, counts,
 * epoch milliseconds, cents), so one that does is refused rather than
 * rounded.
 */
export function parseInt8(text: string): number {
  const value = Number(text);
  if (!Number.isSafeInteger(value)) throw new Error(`A bigint of ${text} is beyond what TREK reads exactly (2^53).`);
  return value;
}

/** The `pg` type id of `numeric`: what `sum()` of a bigint and `avg()` answer. */
const NUMERIC_OID = 1700;

/**
 * Reads a `numeric` as a number, as SQLite answers `sum()` and `avg()`. An
 * integral result past 2^53 is refused like a bigint; a fraction is a double,
 * the precision SQLite's REAL has.
 */
export function parseNumeric(text: string): number {
  const value = Number(text);
  if (!Number.isFinite(value) || (/^-?\d+$/.test(text) && !Number.isSafeInteger(value))) {
    throw new Error(`A numeric of ${text} is beyond what TREK reads exactly (2^53).`);
  }
  return value;
}

/** The pool's own parsers (MikroORM keeps dates as text), plus `int8` and `numeric` as numbers. */
class Int8NumberConnection extends PostgreSqlConnection {
  override mapOptions(overrides: Parameters<PostgreSqlConnection['mapOptions']>[0]) {
    const options = super.mapOptions(overrides);
    const types = options.types as { setTypeParser(oid: number, parse: (text: string) => unknown): void };
    types.setTypeParser(INT8_OID, parseInt8);
    types.setTypeParser(NUMERIC_OID, parseNumeric);
    return options;
  }
}

/**
 * MikroORM's Postgres driver on a connection that reads `bigint` as a number.
 * The parsers belong to this pool only: nothing global in `pg` changes.
 */
export class TrekPostgreSqlDriver extends PostgreSqlDriver {
  constructor(config: Configuration) {
    super(config);
    // PostgreSqlDriver's constructor hardcodes its connection class, as
    // SqliteDriver's does (`db/orm-driver.ts`); replaced before anything connects.
    (this as unknown as { connection: PostgreSqlConnection }).connection = new Int8NumberConnection(config);
  }
}
