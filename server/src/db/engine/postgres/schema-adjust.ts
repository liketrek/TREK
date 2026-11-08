/**
 * How the entities' schema is written in Postgres: the one definition the
 * Postgres baseline (`scripts/generate-pg-baseline.ts`), the schema parity
 * check and the probe (`scripts/pg-probe.ts`) share.
 *
 * The entities are generated from the migrated SQLite schema and a parity
 * test pins them to it (`npm run check:entities`), so they are the one
 * description of the tables both engines can read. MikroORM's schema
 * generator turns them into Postgres DDL after the adjustments below, which
 * keep the storage model the services and the dialect helpers are written
 * for (server/CLAUDE.md, "Storage model"):
 *
 *   - timestamps stay TEXT;
 *   - an INTEGER column is `bigint`: SQLite's INTEGER holds 64 bits, so a
 *     column written with epoch milliseconds or a byte count past 2 GB would
 *     overflow Postgres's 32-bit `integer` (the engine's driver reads
 *     `bigint` back as a number, `postgres-driver.ts`);
 *   - a SQLite-only default (`datetime('now')`, `strftime('%s','now')`,
 *     `CURRENT_TIMESTAMP` in a TEXT column) gets its Postgres equivalent, and
 *     a column declared `COLLATE NOCASE` uses the `nocase` collation
 *     `collateNoCase()` names on Postgres.
 *
 * The baseline keeps the foreign keys; the probe leaves them out, so a
 * statement it sends is never refused only because the sample row it writes
 * points at nothing. The triggers the SQLite schema has are in
 * `postgres-triggers.ts`.
 */
import { pgTimestampText, PG_UTC_NOW } from '../../dialect/platform';
import { DbTimestampType } from '../../types';

/** SQLite's timestamp text on Postgres, for a column default. */
export const PG_NOW_TEXT_DEFAULT = pgTimestampText(PG_UTC_NOW);

/** The case-insensitive collation `collateNoCase()` names on Postgres. */
export const NOCASE_COLLATION_SQL =
  "CREATE COLLATION IF NOT EXISTS nocase (provider = icu, locale = 'und-u-ks-level2', deterministic = false)";

/** The Postgres spelling of a column default the entities carry in SQLite's. */
export function portableDefault(raw: string): string {
  const text = raw
    .trim()
    .replace(/^\((.*)\)$/s, '$1')
    .trim();
  if (/^current_timestamp$/i.test(text) || /^datetime\(\s*'now'\s*\)$/i.test(text)) return PG_NOW_TEXT_DEFAULT;
  if (/^strftime\(\s*'%s'\s*,\s*'now'\s*\)$/i.test(text))
    return 'CAST(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) AS bigint)';
  return raw;
}

/** A column type SQLite stores as its 64-bit INTEGER. */
const INTEGER_TYPE = /^(integer|int)$/i;

/**
 * The subset of MikroORM's property metadata the adjustments read and write.
 * An entity's `props` satisfy it as they are, so no cast is needed.
 */
export interface ColumnMeta {
  name: string;
  defaultRaw?: string;
  collation?: string;
  columnTypes?: string[];
  customType?: unknown;
}

/** A timestamp column becomes text. Returns whether it changed. */
function timestampAsText(column: ColumnMeta): boolean {
  if (!(column.customType instanceof DbTimestampType) || !column.columnTypes) return false;
  column.columnTypes = column.columnTypes.map(() => 'text');
  return true;
}

/** An integer column becomes bigint. Returns whether it changed. */
function integerAsBigint(column: ColumnMeta): boolean {
  if (!column.columnTypes?.some((type) => INTEGER_TYPE.test(type))) return false;
  column.columnTypes = column.columnTypes.map((type) => (INTEGER_TYPE.test(type) ? 'bigint' : type));
  return true;
}

/** A SQLite-only default gets its Postgres spelling. Returns whether it changed. */
function defaultAsPostgres(column: ColumnMeta): boolean {
  if (typeof column.defaultRaw !== 'string') return false;
  const next = portableDefault(column.defaultRaw);
  if (next === column.defaultRaw) return false;
  column.defaultRaw = next;
  return true;
}

/** A NOCASE column uses the `nocase` collation. Returns whether it changed. */
function nocaseAsCollation(column: ColumnMeta): boolean {
  if (column.collation?.toUpperCase() !== 'NOCASE') return false;
  column.collation = 'nocase';
  return true;
}

/**
 * Applies the adjustments above to an entity's properties, in place, and
 * returns the names of the properties it changed, for the log. A timestamp
 * column is text, so the integer adjustment never sees it.
 */
export function applyPostgresColumnAdjustments(properties: readonly ColumnMeta[]): string[] {
  const changed: string[] = [];
  for (const property of properties) {
    const typeChanged = timestampAsText(property) || integerAsBigint(property);
    const defaultChanged = defaultAsPostgres(property);
    const collationChanged = nocaseAsCollation(property);
    if (typeChanged || defaultChanged || collationChanged) changed.push(property.name);
  }
  return changed;
}
