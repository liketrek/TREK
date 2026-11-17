import { NO_SAFETY_NET } from '../../../legacy-baseline';
import type { AnyOrm } from '../../../orm';
import { SqliteSource } from '../../sqlite/sqlite-source';
import type { PostgresBaseline } from '../baseline';
import { CLEAR_SCHEMA_SQL } from '../clear-schema';
import { PLUGIN_SCHEMA_PREFIX } from '../plugin-schema';
import { bootstrapPostgresSchema } from '../schema-bootstrap';
import { planTrekTables, readTargetSchema, type SourceTables } from './catalog';
import {
  advanceSequences,
  applyDeferred,
  copyTable,
  inOrder,
  MAX_LISTED_PROBLEMS,
  readBack,
  run,
  type CopiedSequence,
  type CopiedTable,
  type Trx,
} from './copy';
import {
  createPluginSchema,
  findPluginDataFiles,
  planPluginData,
  resolveIdentitySequences,
  type PluginPlan,
} from './plugin-data';
import type { AbstractSqlConnection } from '@mikro-orm/sql';

import type { Kysely } from 'kysely';

/**
 * Moves a SQLite install into an empty Postgres database (`npm run
 * db:move-to-postgres`, `dist/move-to-postgres.js` in the image).
 *
 * 1. The SQLite file must be at this build's migration level: an older one is
 *    migrated by starting this TREK on it once, a newer one belongs to the
 *    TREK that wrote it. Nothing else is checked by guess.
 * 2. The Postgres database must hold no table and no plugin schema.
 * 3. The schema is created exactly as a first boot creates it (the engine's
 *    bootstrap: the baseline and the migrations after its cut), without the
 *    seeders, since every row comes from the file.
 * 4. In one transaction: the rows the bootstrap seeded are cleared, every
 *    table is filled in foreign key order, each plugin's `plugin.db` goes into
 *    its schema, the sequences are moved past the copied ids, and every table
 *    is read back and compared with what was sent (row count and a checksum
 *    over all rows). Only a copy that matches is committed.
 * 5. Anything that fails leaves the database as it was found: the
 *    transaction rolls back and the schema the bootstrap created is dropped.
 *
 * The SQLite files are opened read-only and never written. Uploads are not
 * the database's: they stay where the storage driver keeps them.
 */

/** A refusal the operator can act on: printed without a stack. */
export class MoveRefusal extends Error {}

export interface MoveOptions {
  /** The SQLite file to move: `data/travel.db` by default. */
  sqliteFile: string;
  /** Where the plugins keep their data directories (`plugin.db` files). */
  pluginsDataDir: string;
  /** An ORM on the target database, from the Postgres engine's own config. */
  orm: AnyOrm;
  /** The migrations this build ships. */
  known: ReadonlySet<string>;
  baseline: () => PostgresBaseline;
  /** Where progress lines go. */
  log: (line: string) => void;
}

interface MovedTable {
  label: string;
  rows: number;
  checksum: string;
}

export interface MoveSummary {
  sqliteFile: string;
  tables: MovedTable[];
  plugins: Array<{ pluginId: string; schema: string; tables: MovedTable[]; notCarried: string[] }>;
  sequences: number;
  warnings: string[];
  seconds: number;
}

/**
 * Why the SQLite file is not at this build's migration level, or null when it
 * is: it must have recorded exactly the migrations this build ships.
 */
export function migrationLevelProblem(recorded: readonly string[] | null, known: ReadonlySet<string>): string | null {
  const startOnce =
    'Start this TREK version on it once, without TREK_DB_URL, so it brings the file up to date; stop it; then run the move again.';
  if (recorded === null || recorded.length === 0) {
    return `the SQLite file has no TREK migration history (an install from before 5.0, or not a TREK database). ${startOnce}`;
  }
  const unknown = recorded.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    return (
      `a newer TREK migrated the SQLite file (${unknown.length} migration(s) this version does not know, ` +
      `the last ${[...unknown].sort().at(-1)}). Run the move with the TREK version that last ran on it.`
    );
  }
  const have = new Set(recorded);
  const missing = [...known].filter((name) => !have.has(name));
  if (missing.length > 0) {
    return `the SQLite file is ${missing.length} migration(s) behind this TREK version. ${startOnce}`;
  }
  return null;
}

function listed(problems: readonly string[], total: number): string {
  const lines = problems.map((problem) => `  - ${problem}`);
  if (total > problems.length) lines.push(`  - and ${total - problems.length} more`);
  return lines.join('\n');
}

/** Refuses a database that holds a table or a plugin schema: the move fills an empty database only. */
async function refuseNonEmptyTarget(db: Kysely<object>): Promise<void> {
  const tables = await run<{ table_name: string }>(
    db,
    'select table_name from information_schema.tables where table_schema = current_schema() order by table_name limit 5',
  );
  const schemas = await run<{ nspname: string }>(
    db,
    'select nspname from pg_namespace where starts_with(nspname, $1) order by nspname limit 5',
    [PLUGIN_SCHEMA_PREFIX],
  );
  const found = [...tables.map((row) => row.table_name), ...schemas.map((row) => `schema ${row.nspname}`)];
  if (found.length === 0) return;
  throw new MoveRefusal(
    `The Postgres database is not empty (${found.join(', ')}). The move fills an empty database only, so it never ` +
      'mixes two installs. Point TREK_DB_URL at a new, empty database. If an earlier move stopped part of the way, ' +
      'drop that database and create it again.',
  );
}

/** Opens every plugin's data file and plans its copy; the sources stay open for the copy. */
function planPlugins(root: string, warnings: string[]): Array<{ source: SqliteSource; plan: PluginPlan }> {
  const { files, skipped } = findPluginDataFiles(root);
  for (const file of skipped) warnings.push(`${file} is in a directory whose name is no plugin id; it was not moved.`);
  const plugins: Array<{ source: SqliteSource; plan: PluginPlan }> = [];
  for (const { pluginId, file } of files) {
    const source = SqliteSource.open(file);
    plugins.push({ source, plan: planPluginData(pluginId, source) });
  }
  return plugins;
}

/** Compares a copied table with what Postgres holds now: the SQLite count, the rows sent and the checksum. */
async function verify(trx: Trx, copied: CopiedTable, sqliteCount: number): Promise<string | null> {
  const back = await readBack(trx, copied.spec);
  if (back.rows !== sqliteCount || copied.rows !== sqliteCount) {
    return `${copied.spec.label}: the SQLite file holds ${sqliteCount} rows, ${copied.rows} were sent, Postgres holds ${back.rows}`;
  }
  if (back.checksum !== copied.checksum)
    return `${copied.spec.label}: the rows Postgres holds differ from the rows sent`;
  return null;
}

/** Everything the copy transaction does, in order; throws on the first thing that does not hold. */
async function copyAll(
  trx: Trx,
  source: SqliteSource,
  plugins: ReadonlyArray<{ source: SqliteSource; plan: PluginPlan }>,
  options: MoveOptions,
  summary: MoveSummary,
): Promise<void> {
  await run(trx, "set local bytea_output = 'hex'");
  const sourceTables: SourceTables = new Map(
    source.tables().map((table) => [table, source.columns(table).map((column) => column.name)]),
  );
  const plan = planTrekTables(await readTargetSchema(trx), sourceTables);
  if (plan.problems.length > 0) {
    throw new MoveRefusal(
      `The SQLite file and this TREK's Postgres schema differ:\n${listed(plan.problems, plan.problems.length)}`,
    );
  }
  // The bootstrap's own rows (default settings, addons, providers) give way to the file's.
  await run(trx, `truncate table ${plan.specs.map((spec) => spec.target).join(', ')}`);

  const copied: CopiedTable[] = [];
  let refused = 0;
  const copyOne = (from: SqliteSource) => async (spec: CopiedTable['spec']) => {
    options.log(`Copying ${spec.label}`);
    const result = await copyTable(trx, from, spec, { insert: refused === 0 });
    refused += result.problemCount;
    copied.push(result);
  };
  await inOrder(plan.specs, copyOne(source));
  // Once a value was refused nothing more is inserted, so there are no rows to point at each other.
  if (refused === 0) await inOrder(copied, (table) => applyDeferred(trx, table));

  const sequences: CopiedSequence[] = [...plan.sequences];
  const pluginTables = new Map<string, CopiedTable[]>();
  await inOrder(plugins, async ({ source: pluginSource, plan: pluginPlan }) => {
    if (refused > 0) return;
    await createPluginSchema(trx, pluginPlan);
    const before = copied.length;
    await inOrder(pluginPlan.specs, copyOne(pluginSource));
    pluginTables.set(pluginPlan.pluginId, copied.slice(before));
  });
  if (refused > 0) {
    const problems = copied.flatMap((table) => table.problems).slice(0, MAX_LISTED_PROBLEMS);
    throw new MoveRefusal(
      `${refused} value(s) in the SQLite file cannot be stored in Postgres exactly; nothing was written:\n` +
        `${listed(problems, refused)}\nCorrect those rows (or ask for help with them), then run the move again.`,
    );
  }

  options.log('Moving the id sequences past the copied rows');
  summary.sequences = await advanceSequences(trx, sequences, source.autoincrementSeen());
  await inOrder(plugins, async ({ source: pluginSource, plan: pluginPlan }) => {
    summary.sequences += await advanceSequences(
      trx,
      await resolveIdentitySequences(trx, pluginPlan),
      pluginSource.autoincrementSeen(),
    );
  });

  options.log('Verifying every table');
  const mismatches: string[] = [];
  const sourceOf = (table: CopiedTable) =>
    plugins.find(({ plan: pluginPlan }) => pluginPlan.specs.includes(table.spec))?.source ?? source;
  await inOrder(copied, async (table) => {
    const mismatch = await verify(trx, table, sourceOf(table).count(table.spec.source));
    if (mismatch) mismatches.push(mismatch);
  });
  if (mismatches.length > 0) {
    throw new Error(
      `The copy does not match the SQLite file; nothing was written:\n${listed(mismatches, mismatches.length)}`,
    );
  }

  const moved = (table: CopiedTable): MovedTable => ({
    label: table.spec.source,
    rows: table.rows,
    checksum: table.checksum,
  });
  const pluginCopies = new Set([...pluginTables.values()].flat());
  summary.tables = copied.filter((table) => !pluginCopies.has(table)).map(moved);
  summary.plugins = plugins.map(({ plan: pluginPlan }) => ({
    pluginId: pluginPlan.pluginId,
    schema: pluginPlan.schema,
    tables: (pluginTables.get(pluginPlan.pluginId) ?? []).map(moved),
    notCarried: pluginPlan.notCarried,
  }));
  const unsafe = copied.filter((table) => table.unsafeIntegers > 0);
  for (const table of unsafe) {
    summary.warnings.push(
      `${table.spec.label} holds ${table.unsafeIntegers} integer(s) beyond 2^53, which TREK refuses to read on Postgres.`,
    );
  }
}

/**
 * Drops what the bootstrap created after a move failed (the database was
 * empty before it, so everything in its schema is the move's). When even that
 * fails, the error says so, since the database then needs dropping by hand.
 */
async function emptyAgain(db: Kysely<object>, failure: unknown): Promise<void> {
  try {
    await run(db, CLEAR_SCHEMA_SQL);
  } catch (err) {
    throw new Error(
      `The move failed (${failure instanceof Error ? failure.message : String(failure)}), and the schema it had created ` +
        `could not be dropped (${err instanceof Error ? err.message : String(err)}). Drop the Postgres database and ` +
        'create it again before the next attempt.',
      { cause: err },
    );
  }
}

/** Runs the move. Throws a `MoveRefusal` for what the operator can fix, and leaves the target as it found it. */
export async function moveSqliteToPostgres(options: MoveOptions): Promise<MoveSummary> {
  const started = Date.now();
  const summary: MoveSummary = {
    sqliteFile: options.sqliteFile,
    tables: [],
    plugins: [],
    sequences: 0,
    warnings: [],
    seconds: 0,
  };
  const db = (options.orm.em.getConnection() as AbstractSqlConnection).getClient<object>();
  let source: SqliteSource;
  try {
    source = SqliteSource.open(options.sqliteFile);
  } catch (err) {
    throw new MoveRefusal(
      `Cannot read the SQLite file ${options.sqliteFile}: ${err instanceof Error ? err.message : String(err)}. ` +
        'Stop TREK first, and point --from at the file if it is not data/travel.db.',
    );
  }
  const plugins: Array<{ source: SqliteSource; plan: PluginPlan }> = [];
  try {
    const level = migrationLevelProblem(source.migrationNames(), options.known);
    if (level) throw new MoveRefusal(`Cannot move ${options.sqliteFile}: ${level}`);
    const orphans = source.orphans(MAX_LISTED_PROBLEMS);
    if (orphans.length > 0) {
      throw new MoveRefusal(
        `${options.sqliteFile} holds rows whose reference points at nothing, which Postgres refuses:\n` +
          listed(
            orphans.map((row) => `${row.table} row ${String(row.rowid)} refers to a missing row of ${row.parent}`),
            orphans.length,
          ),
      );
    }
    plugins.push(...planPlugins(options.pluginsDataDir, summary.warnings));
    await refuseNonEmptyTarget(db);

    try {
      options.log('Creating the schema as a first boot does');
      await bootstrapPostgresSchema(options.orm, {
        baseline: options.baseline,
        known: new Set(options.known),
        safetyNet: NO_SAFETY_NET,
        // This is the move itself.
        sqliteLeftBehind: () => null,
      });
      await db.transaction().execute((trx) => copyAll(trx, source, plugins, options, summary));
    } catch (err) {
      // The copy rolled back; what the bootstrap created goes too, so the database is empty again.
      await emptyAgain(db, err);
      throw err;
    }
  } finally {
    source.close();
    for (const plugin of plugins) plugin.source.close();
  }
  summary.seconds = Math.round((Date.now() - started) / 100) / 10;
  return summary;
}

/** The summary the command prints once the move committed. */
export function renderSummary(summary: MoveSummary, target: string): string {
  const rows = summary.tables.reduce((sum, table) => sum + table.rows, 0);
  const lines = [
    `Moved ${summary.sqliteFile} into ${target} in ${summary.seconds} s.`,
    `  ${summary.tables.length} tables, ${rows} rows, each table verified by row count and checksum.`,
    `  ${summary.sequences} id sequence(s) moved past the copied rows.`,
  ];
  for (const table of summary.tables.filter((entry) => entry.rows > 0)) {
    lines.push(`    ${table.label}: ${table.rows}`);
  }
  for (const plugin of summary.plugins) {
    const pluginRows = plugin.tables.reduce((sum, table) => sum + table.rows, 0);
    lines.push(
      `  Plugin ${plugin.pluginId}: ${plugin.tables.length} table(s), ${pluginRows} rows, into schema ${plugin.schema}.`,
    );
    for (const item of plugin.notCarried) lines.push(`    not carried over: ${item}`);
  }
  for (const warning of summary.warnings) lines.push(`  Warning: ${warning}`);
  lines.push(
    '',
    'The SQLite file and the uploads were not changed. Next: set TREK_DB_URL for TREK, start it, sign in and check',
    `your trips. To go back, unset TREK_DB_URL: TREK starts on ${summary.sqliteFile} as before.`,
  );
  return lines.join('\n');
}
