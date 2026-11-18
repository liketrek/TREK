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
  listLines,
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
import { FIX_IN_SQLITE_FILE, MoveRefusal } from './refusal';
import type { AbstractSqlConnection } from '@mikro-orm/sql';

import type { Kysely } from 'kysely';

/**
 * Moves a SQLite install into an empty Postgres database (`npm run
 * db:move-to-postgres`, `dist/move-to-postgres.js` in the image).
 *
 * 1. The SQLite file must be at this build's migration level: an older one is
 *    migrated by starting this TREK on it once, a newer one belongs to the
 *    TREK that wrote it. Nothing else is checked by guess.
 * 2. Every plugin's data must move unchanged (`PLUGIN_RULES` in `values.ts`):
 *    a value Postgres cannot hand back to the plugin as it is (a NUL, text
 *    whose bytes are not UTF-8, a column whose values mix types) is listed,
 *    before anything is written.
 * 3. The Postgres database must hold no table and no plugin schema.
 * 4. The schema is created exactly as a first boot creates it (the engine's
 *    bootstrap: the baseline and the migrations after its cut), without the
 *    seeders, since every row comes from the file.
 * 5. In one transaction: the rows the bootstrap seeded are cleared, every
 *    table is filled in foreign key order, each plugin's `plugin.db` goes into
 *    its schema, the sequences are moved past the copied ids, and every table
 *    is read back and compared with the SQLite file (row count and a checksum
 *    over all rows, built from the values read from SQLite). Only a copy that
 *    matches is committed.
 * 6. Anything that fails leaves the database as it was found: the
 *    transaction rolls back and the schema the bootstrap created is dropped.
 *
 * Nothing is changed silently. A NUL character in TREK's own text, which TREK
 * no longer stores and drops on its next write, refuses the move unless the
 * operator passes `dropNul` (`--drop-nul`); then each value that lost one is
 * listed in the summary.
 *
 * The SQLite files are opened read-only and never written. Uploads are not
 * the database's: they stay where the storage driver keeps them.
 */

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
  /** Drop NUL characters from TREK's own text and JSON instead of refusing them (`--drop-nul`). */
  dropNul?: boolean;
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
  /** Every value of TREK's own tables from which `--drop-nul` removed NUL characters: table, row and column. */
  nulDropped: string[];
  warnings: string[];
  seconds: number;
}

/** What the operator can do about a NUL in TREK's own data, for a refusal that lists one. */
const TREK_NUL_REMEDY =
  'TREK no longer stores this character and drops it on its next write. Run the move again with --drop-nul ' +
  'to drop it now; the summary then lists every value it changed.';

/** What the operator can do about plugin data that cannot move unchanged. */
const PLUGIN_DATA_REMEDY =
  "A plugin's own data moves exactly as the plugin stored it, or not at all: Postgres text cannot hold a NUL " +
  'character (U+0000), and each column becomes one Postgres type, which hands every value back to the plugin as ' +
  "that type. Change those values in the plugin's plugin.db (through the plugin, or with the sqlite3 tool while " +
  'TREK is stopped), or uninstall the plugin and remove its data directory, then run the move again.';

/**
 * What a difference between the two schemas means and what the operator can
 * do, for a file already at this build's migration level (the level is
 * checked first, so the start that brought it there ran every migration,
 * including the one that adds the columns an old upgrade skipped).
 */
export const SCHEMA_DIFFERENCE_REMEDY =
  "The SQLite file is at this TREK version's migration level, so its tables should match this schema exactly. " +
  'A table or column only Postgres has is one the SQLite install never got: an install upgraded before 5.0 can ' +
  'have skipped some, and the start that brought the file to this level added every column it could; TREK names ' +
  'the rest in its start log ("[DB] The database lacks ..."). A table or column only the SQLite file has was ' +
  "added outside TREK's migrations, by hand or by a development build. TREK cannot correct either on its own: " +
  'keep running TREK on SQLite, which still works, and please report this message, with that line of the start ' +
  'log if there is one.';

/** What a column of this TREK's own Postgres schema that the move cannot copy means: the file is not at fault. */
export const SCHEMA_BUG_REMEDY =
  "These come from this TREK version's own Postgres schema, not from the SQLite file, so this is a bug in TREK. " +
  'Keep running TREK on SQLite, which still works, and please report this message.';

/**
 * The refusal for a SQLite file whose tables do not pair with the schema, or
 * null when they do: the tables and columns only one side has, with what
 * that means, and apart from them what the schema itself holds that the move
 * cannot copy, which is TREK's own fault.
 */
export function schemaRefusal(differences: readonly string[], problems: readonly string[]): string | null {
  const parts: string[] = [];
  if (differences.length > 0) {
    parts.push(
      `The SQLite file and this TREK's Postgres schema differ; nothing was written:\n` +
        `${listLines(differences, differences.length)}\n${SCHEMA_DIFFERENCE_REMEDY}`,
    );
  }
  if (problems.length > 0) {
    parts.push(
      `This TREK's Postgres schema holds what the move cannot copy; nothing was written:\n` +
        `${listLines(problems, problems.length)}\n${SCHEMA_BUG_REMEDY}`,
    );
  }
  return parts.length > 0 ? parts.join('\n') : null;
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

/**
 * Reads every plugin table and checks that each value moves unchanged, before
 * anything is written: a refusal lists plugin, table, row and column of each
 * value that would not.
 */
async function checkPluginData(plugins: ReadonlyArray<{ source: SqliteSource; plan: PluginPlan }>): Promise<void> {
  const checked: CopiedTable[] = [];
  await inOrder(plugins, (plugin) =>
    inOrder(plugin.plan.specs, async (spec) => {
      checked.push(await copyTable(null, plugin.source, spec));
    }),
  );
  const total = checked.reduce((sum, table) => sum + table.problemCount, 0);
  if (total === 0) return;
  const problems = checked.flatMap((table) => table.problems).slice(0, MAX_LISTED_PROBLEMS);
  throw new MoveRefusal(
    `${total} value(s) in plugin data cannot move to Postgres unchanged; nothing was written:\n` +
      `${listLines(problems, total)}\n${PLUGIN_DATA_REMEDY}`,
  );
}

/** Compares a copied table with what Postgres holds now: the SQLite count, the rows sent and the checksum. */
async function verify(trx: Trx, copied: CopiedTable, sqliteCount: number): Promise<string | null> {
  const back = await readBack(trx, copied.spec);
  if (back.rows !== sqliteCount || copied.rows !== sqliteCount) {
    return `${copied.spec.label}: the SQLite file holds ${sqliteCount} rows, ${copied.rows} were sent, Postgres holds ${back.rows}`;
  }
  if (back.checksum !== copied.checksum)
    return `${copied.spec.label}: the rows Postgres holds differ from the rows of the SQLite file`;
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
  const refusal = schemaRefusal(plan.differences, plan.problems);
  if (refusal) throw new MoveRefusal(refusal);
  // The bootstrap's own rows (default settings, addons, providers) give way to the file's.
  await run(trx, `truncate table ${plan.specs.map((spec) => spec.target).join(', ')}`);

  const copied: CopiedTable[] = [];
  let refused = 0;
  let nulRefused = 0;
  const copyOne = (from: SqliteSource) => async (spec: CopiedTable['spec']) => {
    options.log(`Copying ${spec.label}`);
    const result = await copyTable(trx, from, spec, { insert: refused === 0, dropNul: options.dropNul });
    refused += result.problemCount;
    nulRefused += result.nulRefused;
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
    const nul = nulRefused > 0 ? `${nulRefused} of them hold a NUL character (U+0000). ${TREK_NUL_REMEDY}\n` : '';
    const others =
      refused > nulRefused ? `${nulRefused > 0 ? 'Correct the others' : 'Correct them'} ${FIX_IN_SQLITE_FILE}` : '';
    throw new MoveRefusal(
      `${refused} value(s) in the SQLite file cannot be stored in Postgres exactly; nothing was written:\n` +
        `${listLines(problems, refused)}\n${nul}${others}`.trimEnd(),
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
      `The copy does not match the SQLite file; nothing was written:\n${listLines(mismatches, mismatches.length)}`,
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
  summary.nulDropped = copied.flatMap((table) => table.nulDropped.map((value) => value.where));
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
    nulDropped: [],
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
          listLines(
            orphans.map((row) => `${row.table} row ${String(row.rowid)} refers to a missing row of ${row.parent}`),
            orphans.length,
          ),
      );
    }
    plugins.push(...planPlugins(options.pluginsDataDir, summary.warnings));
    await checkPluginData(plugins);
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
  if (summary.nulDropped.length > 0) {
    lines.push(`  --drop-nul removed NUL characters (U+0000) from ${summary.nulDropped.length} value(s):`);
    for (const value of summary.nulDropped) lines.push(`    ${value}`);
  }
  for (const warning of summary.warnings) lines.push(`  Warning: ${warning}`);
  lines.push(
    '',
    'The SQLite file and the uploads were not changed. Next: set TREK_DB_URL for TREK, start it, sign in and check',
    `your trips. To go back, unset TREK_DB_URL: TREK starts on ${summary.sqliteFile} as before.`,
  );
  return lines.join('\n');
}
