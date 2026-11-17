import { nulFreeJson, stripNul, withNulFreeParameters } from '../../nul-free';
import { sendMarkedQueriesExtended } from './extended-query';
import { SqliteNullOrderPlatform, withSqliteNullOrder } from './null-order';
import { type Configuration, type TransformContext } from '@mikro-orm/core';
import { PostgreSqlConnection, PostgreSqlDriver } from '@mikro-orm/postgresql';

/** The `pg` pool event a new client is handed to before anyone uses it. */
interface ClientEvents {
  on(event: 'connect', listener: (client: { query: (...args: unknown[]) => unknown }) => void): void;
}

/** `int8` (bigint), a `pg_type.oid`: every integer column and every `count(*)` on Postgres. */
const INT8_OID = 20;
/** `numeric`: what `sum()` of a bigint and `avg()` answer. */
const NUMERIC_OID = 1700;

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

/**
 * Reads a `numeric` as a number, as SQLite answers `sum()` and `avg()`. `NaN`
 * and the infinities are refused, as is an integral result past 2^53, which is
 * refused like a bigint; a fraction is a double, the precision SQLite's REAL has.
 */
export function parseNumeric(text: string): number {
  const value = Number(text);
  if (!Number.isFinite(value)) {
    throw new Error(`A numeric of ${text} is not a finite number, which TREK does not read.`);
  }
  if (/^-?\d+$/.test(text) && !Number.isSafeInteger(value)) {
    throw new Error(`A numeric of ${text} is beyond what TREK reads exactly (2^53).`);
  }
  return value;
}

/**
 * MikroORM's `PostgreSqlConnection`, with the pool's own type parsers replaced
 * for `int8` and `numeric`. MikroORM keeps dates as text, so only these two
 * change. `mapOptions` builds the `pg` pool options, whose `types` is the
 * `pg` TypeOverrides, the object that holds the parsers.
 */
class NumberTypesConnection extends PostgreSqlConnection {
  override mapOptions(overrides: Parameters<PostgreSqlConnection['mapOptions']>[0]) {
    const options = super.mapOptions(overrides);
    const types = options.types as { setTypeParser(oid: number, parse: (text: string) => unknown): void };
    types.setTypeParser(INT8_OID, parseInt8);
    types.setTypeParser(NUMERIC_OID, parseNumeric);
    return options;
  }

  /**
   * The pool's Kysely dialect, compiling every ORDER BY with SQLite's NULL
   * position (`null-order.ts`), sending every parameter without NUL
   * (`nul-free.ts`), on a pool whose every client sends the queries
   * `extendedQuery` builds over the extended protocol (`extended-query.ts`).
   */
  override createKyselyDialect(overrides: Parameters<PostgreSqlConnection['createKyselyDialect']>[0]) {
    const given = (overrides ?? {}) as { onPoolCreated?: (pool: unknown) => unknown };
    const onPoolCreated = (pool: unknown) => {
      (pool as ClientEvents).on('connect', sendMarkedQueriesExtended);
      return given.onPoolCreated?.(pool);
    };
    const withHook = { ...given, onPoolCreated } as Parameters<PostgreSqlConnection['createKyselyDialect']>[0];
    return withNulFreeParameters(withSqliteNullOrder(super.createKyselyDialect(withHook))) as ReturnType<
      PostgreSqlConnection['createKyselyDialect']
    >;
  }
}

/**
 * The Postgres platform TREK runs on: ORDER BY with SQLite's NULL position
 * (`null-order.ts`), and no NUL in a string it inlines into a statement or a
 * JSON value it serializes, which Postgres text cannot hold (`nul-free.ts`).
 */
export class TrekPostgreSqlPlatform extends SqliteNullOrderPlatform {
  override escape(value: unknown): string {
    return super.escape(typeof value === 'string' ? stripNul(value) : value);
  }

  override convertJsonToDatabaseValue(value: unknown, context?: TransformContext): unknown {
    return super.convertJsonToDatabaseValue(nulFreeJson(value), context);
  }
}

/**
 * MikroORM's Postgres driver on a connection that reads `bigint` and `numeric`
 * as numbers, and on the platform above with a query compiler that sorts NULLs
 * where SQLite does (`null-order.ts`). The parsers belong to this pool only:
 * nothing global in `pg` changes.
 */
export class TrekPostgreSqlDriver extends PostgreSqlDriver {
  constructor(config: Configuration) {
    super(config);
    // PostgreSqlDriver's constructor hardcodes its connection and platform
    // classes, as SqliteDriver's does (`db/orm-driver.ts`). It keeps both in
    // fields, which are not public, so they are replaced here, before anything
    // connects and before the configuration reads the platform.
    (this as unknown as { connection: PostgreSqlConnection }).connection = new NumberTypesConnection(config);
    (this as unknown as { platform: TrekPostgreSqlPlatform }).platform = new TrekPostgreSqlPlatform();
  }
}
