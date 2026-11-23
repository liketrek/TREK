import { SqliteSource, type SqliteColumn, type SqliteIndex } from '../../sqlite/sqlite-source';
import { isPluginId, pluginSchemaName, quotePluginSchema } from '../plugin-schema';
import { PG_NOW_TEXT_DEFAULT, portableDefault } from '../schema-adjust';
import { inOrder, quoteIdentifier, run, type CopiedSequence, type TableSpec, type Trx } from './copy';
import type { ColumnKind } from './values';

import fs from 'node:fs';
import path from 'node:path';

/**
 * A plugin's own database (`db:own`) moved from its `plugin.db` file into the
 * schema TREK gives it on Postgres (`plugin-schema.ts`), so a plugin finds its
 * rows where the Postgres store (`plugin-data-store.ts`) reads them.
 *
 * A plugin's tables are its own, created by its own SQL, so the move derives
 * each Postgres table from the SQLite one: the column's type from SQLite's
 * type affinity (and from the values it holds where the affinity leaves it
 * open), NOT NULL, the primary key, a default that has a Postgres spelling,
 * and the indexes over plain columns. The plugin's migration record
 * (`_plugin_migrations`) is copied as it is, so the plugin does not run its
 * migrations again over the copied tables. What has no Postgres counterpart
 * here (foreign keys between its tables, views, triggers, partial or
 * expression indexes, other defaults) is not created and is listed in the
 * summary, and so is a key SQLite compared with `NOCASE` or `RTRIM`, which
 * Postgres compares exactly. The file itself stays where it is, untouched.
 *
 * The rows are the plugin's, so none is changed on the way: every value must
 * come back from the Postgres store with the type and bytes it has in the
 * file, or the move refuses before it writes anything and lists the value
 * (`PLUGIN_RULES` in `values.ts`, checked by `checkPluginData` in `move.ts`).
 */

/** The plugin store's own record of the migrations it ran, created exactly as the store creates it. */
const LEDGER = '_plugin_migrations';
const LEDGER_DDL = (schema: string) => `create table ${schema}.${LEDGER} (id text primary key, applied_at bigint)`;

/** The Postgres type the move gives each kind. */
const PG_TYPE: Record<ColumnKind, string> = {
  integer: 'bigint',
  float: 'double precision',
  text: 'text',
  json: 'jsonb',
  bytes: 'bytea',
};

/**
 * The kind of a plugin's column, by SQLite's affinity rules (the declared
 * type's text decides, in this order: INT, then CHAR/CLOB/TEXT, then BLOB or
 * none, then REAL/FLOA/DOUB, else NUMERIC). An INTEGER, TEXT or REAL affinity
 * names the type the plugin asked for. Where the affinity leaves the storage
 * open (BLOB or none, or NUMERIC), the values the column holds decide: the
 * kind that hands every one of them back to the plugin as it reads it from
 * SQLite (an INTEGER or a REAL as a number, TEXT as a string, a BLOB as a
 * Buffer). A column whose values no single kind hands back like that still
 * gets one, and the move refuses each value it would change
 * (`PLUGIN_RULES` in `values.ts`); nothing is converted to fit.
 */
export function pluginColumnKind(declaredType: string, storage: ReadonlySet<string>): ColumnKind {
  const declared = declaredType.toUpperCase();
  const only = (...classes: string[]) => storage.size > 0 && [...storage].every((value) => classes.includes(value));
  if (declared.includes('INT')) return 'integer';
  if (/CHAR|CLOB|TEXT/.test(declared)) return 'text';
  const blob = declared.includes('BLOB') || declared.trim() === '';
  if (!blob && /REAL|FLOA|DOUB/.test(declared)) return 'float';
  if (only('integer')) return 'integer';
  if (only('integer', 'real')) return 'float';
  if (only('blob')) return 'bytes';
  // Empty, or text, or a mix: a column declared BLOB with no values keeps bytes for what the plugin writes later.
  return storage.size === 0 && declared.includes('BLOB') ? 'bytes' : 'text';
}

const NUMBER_LITERAL = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const INTEGER_LITERAL = /^[+-]?\d+$/;
const STRING_LITERAL = /^'(?:[^']|'')*'$/s;

/** A number literal as a default of `kind`, only where the column stores it as SQLite does. */
function numberDefault(text: string, kind: ColumnKind): string | null {
  switch (kind) {
    case 'integer':
      // A fraction in a bigint column would be rounded, where SQLite keeps it.
      return INTEGER_LITERAL.test(text) ? text : null;
    case 'float':
      return text;
    case 'text':
      return `'${text}'`;
    default:
      return null;
  }
}

/**
 * The Postgres spelling of a column default, or null when it has none the move
 * can trust: a default must give the plugin the value SQLite gives it, and must
 * be one Postgres takes for the column's type, so a default that fits neither
 * is listed as not carried over instead of failing the move or changing.
 */
export function pluginDefault(sql: string | null, kind: ColumnKind): string | null {
  if (sql === null) return null;
  const text = sql
    .trim()
    .replace(/^\((.*)\)$/s, '$1')
    .trim();
  const ported = portableDefault(text);
  // The time as text belongs in a text column; the seconds since 1970 fit any column but bytes.
  if (ported === PG_NOW_TEXT_DEFAULT) return kind === 'text' ? ported : null;
  if (ported !== text) return kind === 'bytes' ? null : ported;
  if (/^null$/i.test(text)) return 'null';
  if (NUMBER_LITERAL.test(text)) return numberDefault(text, kind);
  if (/^(true|false)$/i.test(text)) return kind === 'integer' ? (/^true$/i.test(text) ? '1' : '0') : null;
  if (STRING_LITERAL.test(text)) return kind === 'text' ? text : null;
  return null;
}

/** One plugin's database as the move plans to copy it. */
export interface PluginPlan {
  pluginId: string;
  file: string;
  schema: string;
  /** The DDL that creates its tables and indexes, in order. */
  ddl: string[];
  specs: TableSpec[];
  sequences: CopiedSequence[];
  /** What the move does not carry over, for the summary. */
  notCarried: string[];
}

function columnDdl(column: SqliteColumn, kind: ColumnKind, identity: boolean, notes: string[], table: string): string {
  const parts = [quoteIdentifier(column.name), PG_TYPE[kind]];
  if (identity) parts.push('generated by default as identity');
  if (column.notNull && !identity) parts.push('not null');
  if (column.defaultSql !== null && !identity) {
    const value = pluginDefault(column.defaultSql, kind);
    if (value === null) notes.push(`the default ${column.defaultSql} of ${table}.${column.name}`);
    else parts.push(`default ${value}`);
  }
  return parts.join(' ');
}

function indexDdl(index: SqliteIndex, target: string, notes: string[], table: string): string | null {
  // Postgres compares the copied text exactly, so a key SQLite compared ignoring case or trailing spaces
  // (`COLLATE NOCASE`, `RTRIM`) is created, or kept as the primary key, but enforces less than it did.
  if (index.collations.length > 0) {
    notes.push(
      `the collation ${index.collations.join(', ')} of the ${index.origin === 'pk' ? 'primary key' : `index ${index.name}`} ` +
        `on ${table} (Postgres compares its values exactly)`,
    );
  }
  if (index.origin === 'pk') return null;
  if (index.partial || index.columns === null) {
    notes.push(`the index ${index.name} on ${table} (partial or over an expression)`);
    return null;
  }
  const columns = index.columns.map(quoteIdentifier).join(', ');
  // The plugin's own name, for a later migration to find; a UNIQUE constraint's index has none of its own.
  const name = index.origin === 'c' ? `${quoteIdentifier(index.name)} ` : '';
  return `create ${index.unique ? 'unique ' : ''}index ${name}on ${target} (${columns})`;
}

/** Plans the copy of one plugin's `plugin.db`: what to create in its schema and what to fill. */
export function planPluginData(pluginId: string, source: SqliteSource): PluginPlan {
  const schemaName = pluginSchemaName(pluginId);
  const schema = quotePluginSchema(schemaName);
  const plan: PluginPlan = {
    pluginId,
    file: source.file,
    schema: schemaName,
    ddl: [`create schema ${schema}`],
    specs: [],
    sequences: [],
    notCarried: [],
  };
  for (const item of source.viewsAndTriggers()) plan.notCarried.push(`the ${item.type} ${item.name}`);
  const tables = source.tables();
  if (!tables.includes(LEDGER)) plan.ddl.push(LEDGER_DDL(schema));
  for (const table of tables) {
    const target = `${schema}.${quoteIdentifier(table)}`;
    const label = `plugin ${pluginId}: ${table}`;
    const columns = source.columns(table);
    if (table === LEDGER) {
      plan.ddl.push(LEDGER_DDL(schema));
      plan.specs.push({
        source: table,
        target,
        label,
        columns: [
          { name: 'id', kind: 'text' },
          { name: 'applied_at', kind: 'integer' },
        ],
        deferred: [],
        primaryKey: ['id'],
        exact: true,
        uniqueKeys: [],
      });
      continue;
    }
    const keys = columns.filter((column) => column.primaryKey > 0).sort((a, b) => a.primaryKey - b.primaryKey);
    const kinds = columns.map((column) =>
      pluginColumnKind(column.declaredType, source.storageClasses(table, column.name)),
    );
    // SQLite's rowid alias: the one INTEGER PRIMARY KEY column, which hands out its own ids.
    const rowid = keys.length === 1 && keys[0].declaredType.toUpperCase() === 'INTEGER' ? keys[0].name : null;
    const definitions = columns.map((column, index) =>
      columnDdl(column, kinds[index], column.name === rowid, plan.notCarried, table),
    );
    if (keys.length > 0) definitions.push(`primary key (${keys.map((key) => quoteIdentifier(key.name)).join(', ')})`);
    plan.ddl.push(`create table ${target} (${definitions.join(', ')})`);
    for (const index of source.indexes(table)) {
      const ddl = indexDdl(index, target, plan.notCarried, table);
      if (ddl) plan.ddl.push(ddl);
    }
    plan.specs.push({
      source: table,
      target,
      label,
      columns: columns.map((column, index) => ({ name: column.name, kind: kinds[index] })),
      deferred: [],
      primaryKey: keys.map((key) => key.name),
      // A plugin's values are never changed (`PLUGIN_RULES`), so no key of its tables can break on the way.
      exact: true,
      uniqueKeys: [],
    });
    // The identity's sequence is named by Postgres; resolveIdentitySequences reads it once the table exists.
    if (rowid) plan.sequences.push({ table, target, column: rowid, sequence: '' });
  }
  return plan;
}

/** A plugin's data file under the plugins' data directory, by plugin id. */
interface PluginDataFile {
  pluginId: string;
  file: string;
}

/**
 * The `plugin.db` files under `root`, one per plugin directory. A directory
 * whose name is no plugin id cannot have a schema, and is reported instead.
 */
export function findPluginDataFiles(root: string): { files: PluginDataFile[]; skipped: string[] } {
  if (!fs.existsSync(root)) return { files: [], skipped: [] };
  const files: PluginDataFile[] = [];
  const skipped: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(root, entry.name, 'plugin.db');
    if (!entry.isDirectory() || !fs.existsSync(file)) continue;
    if (isPluginId(entry.name)) files.push({ pluginId: entry.name, file });
    else skipped.push(file);
  }
  return { files, skipped };
}

/** Creates a plugin's schema, tables and indexes in the move's transaction. */
export async function createPluginSchema(trx: Trx, plan: PluginPlan): Promise<void> {
  await inOrder(plan.ddl, async (statement) => {
    try {
      await run(trx, statement);
    } catch (err) {
      throw new Error(
        `Postgres refused the table of plugin ${plan.pluginId} (${statement}): ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  });
}

/** The plan's identity columns with the sequence Postgres gave each, read from the catalog. */
export async function resolveIdentitySequences(trx: Trx, plan: PluginPlan): Promise<CopiedSequence[]> {
  const resolved: CopiedSequence[] = [];
  await inOrder(plan.sequences, async (entry) => {
    const [row] = await run<{ sequence: string | null }>(trx, 'select pg_get_serial_sequence($1, $2) as sequence', [
      entry.target,
      entry.column,
    ]);
    if (row?.sequence) resolved.push({ ...entry, sequence: row.sequence });
  });
  return resolved;
}
