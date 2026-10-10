/**
 * The Postgres schema the probe runs against, derived from the entities.
 *
 * The entities are generated from the migrated SQLite schema and a parity
 * test pins them to it (`npm run check:entities`), so they are the one
 * description of the tables both engines can read. MikroORM's schema
 * generator turns them into Postgres DDL after three adjustments that keep
 * the probe about the SQL the repositories send, not about the storage
 * decisions a real Postgres port still has to make:
 *
 *   - timestamps stay TEXT, the storage model the services and the dialect
 *     helpers are written for (server/CLAUDE.md, "Storage model");
 *   - a SQLite-only default (`datetime('now')`, `strftime('%s','now')`) gets
 *     its Postgres equivalent, and a column declared `COLLATE NOCASE` uses
 *     the `nocase` collation `collateNoCase()` names on Postgres;
 *   - no foreign keys, so a statement is never refused only because the
 *     sample row it writes points at nothing (every statement meets empty
 *     tables).
 *
 * Unique and partial unique indexes stay, because `ON CONFLICT` needs them.
 */
import { pgTimestampText, PG_UTC_NOW } from '../../src/db/dialect/platform';

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

/**
 * Splits generated DDL into single statements on `;` outside quotes, so one
 * statement Postgres refuses does not take the rest of the schema with it.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  for (const char of sql) {
    if (quote) {
      if (char === quote) quote = null;
      current += char;
    } else if (char === "'" || char === '"') {
      quote = char;
      current += char;
    } else if (char === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((statement) => !/^set\s/i.test(statement));
}

/** The subset of MikroORM's property metadata the schema adjustments touch. */
export interface ColumnMeta {
  name: string;
  defaultRaw?: string;
  collation?: string;
  columnTypes?: string[];
  customType?: { constructor: { name: string } };
}

/**
 * Applies the adjustments above to one entity's properties in place:
 * timestamp columns become `text`, SQLite-only defaults and the NOCASE
 * collation their Postgres spelling. Returns the names of the properties
 * it changed, for the log.
 */
export function adjustColumns(properties: readonly ColumnMeta[]): string[] {
  const changed: string[] = [];
  for (const property of properties) {
    let touched = false;
    if (property.customType?.constructor.name === 'DbTimestampType' && property.columnTypes) {
      property.columnTypes = property.columnTypes.map(() => 'text');
      touched = true;
    }
    if (typeof property.defaultRaw === 'string') {
      const next = portableDefault(property.defaultRaw);
      if (next !== property.defaultRaw) {
        property.defaultRaw = next;
        touched = true;
      }
    }
    if (property.collation?.toUpperCase() === 'NOCASE') {
      property.collation = 'nocase';
      touched = true;
    }
    if (touched) changed.push(property.name);
  }
  return changed;
}
