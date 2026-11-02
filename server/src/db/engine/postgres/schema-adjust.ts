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
 * points at nothing.
 */
import { pgTimestampText, PG_UTC_NOW } from '../../dialect/platform';

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
 * The SQLite schema's triggers, as Postgres writes them: a trigger function
 * and the trigger that runs it, under the SQLite trigger's name. The entities
 * describe tables only, so the baseline adds these after the tables, and
 * `check:pg-baseline` fails while a trigger in the migrated SQLite schema has
 * no entry here.
 */
export const POSTGRES_TRIGGERS: Readonly<Record<string, readonly string[]>> = {
  // A deleted stay releases the day stops it claimed (no foreign key holds the link).
  trg_release_stop_on_stay_delete: [
    `CREATE FUNCTION trg_release_stop_on_stay_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE day_assignments SET accommodation_id = NULL WHERE accommodation_id = OLD.id;
  RETURN OLD;
END
$$`,
    'CREATE TRIGGER trg_release_stop_on_stay_delete AFTER DELETE ON day_accommodations ' +
      'FOR EACH ROW EXECUTE FUNCTION trg_release_stop_on_stay_delete()',
  ],
  // A place that moved or was renamed drops the region it was resolved to (#2527).
  trg_place_regions_follow_place: [
    `CREATE FUNCTION trg_place_regions_follow_place() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM place_regions WHERE place_id = NEW.id;
  RETURN NEW;
END
$$`,
    'CREATE TRIGGER trg_place_regions_follow_place AFTER UPDATE OF lat, lng, address ON places FOR EACH ROW ' +
      'WHEN (OLD.lat IS DISTINCT FROM NEW.lat OR OLD.lng IS DISTINCT FROM NEW.lng OR OLD.address IS DISTINCT FROM NEW.address) ' +
      'EXECUTE FUNCTION trg_place_regions_follow_place()',
  ],
};

/**
 * Splits generated DDL into single statements on `;` outside quotes and
 * `$$` bodies, so one statement Postgres refuses does not take the rest of the
 * schema with it.
 */
export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let quote: '"' | "'" | '$$' | null = null;
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const dollar = sql.startsWith('$$', i);
    if (quote === '$$') {
      if (dollar) {
        quote = null;
        current += '$';
        i++;
      }
      current += char;
    } else if (quote) {
      if (char === quote) quote = null;
      current += char;
    } else if (dollar) {
      quote = '$$';
      current += '$$';
      i++;
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

/** A column type SQLite stores as its 64-bit INTEGER. */
const INTEGER_TYPE = /^(integer|int)$/i;

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
 * timestamp columns become `text`, integer columns `bigint`, SQLite-only defaults and the NOCASE
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
    } else if (property.columnTypes?.some((type) => INTEGER_TYPE.test(type))) {
      property.columnTypes = property.columnTypes.map((type) => (INTEGER_TYPE.test(type) ? 'bigint' : type));
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
