/**
 * Generates the Postgres baseline: the schema a fresh Postgres database starts
 * from (src/db/engine/postgres/baseline.ts says how a boot uses it).
 *
 * The entities describe the migrated SQLite schema and are pinned to it
 * (`check:entities`), so the baseline is MikroORM's schema generator over the
 * entities, for the Postgres platform, after the adjustments every Postgres
 * schema in this repository shares (src/db/engine/postgres/schema-adjust.ts):
 * TEXT timestamps, portable defaults, the `nocase` collation. Unlike the
 * probe's schema it keeps the foreign keys. No database is needed: the
 * generator reads only the metadata and the platform.
 *
 * The baseline stands for every migration up to the newest one when it was
 * generated (`through`). Once a migration lands after it, the baseline is
 * frozen like a shipped migration: the newer migration runs on Postgres
 * through the migrator, and `--check` only verifies the manifest.
 *
 * Usage:
 *   node --import tsx scripts/generate-pg-baseline.ts           # rewrite server/assets/postgres/
 *   node --import tsx scripts/generate-pg-baseline.ts --check   # exit 1 when it drifted (CI)
 */
import {
  baselineMatches,
  readPostgresBaseline,
  writePostgresBaseline,
  type PostgresBaseline,
} from '../src/db/engine/postgres/baseline';
import { POSTGRES_TRIGGERS } from '../src/db/engine/postgres/postgres-triggers';
import { applyPostgresColumnAdjustments, NOCASE_COLLATION_SQL } from '../src/db/engine/postgres/schema-adjust';
import { splitStatements } from '../src/db/engine/postgres/sql-split';
import { ALL_ENTITIES } from '../src/db/entities';
import { knownMigrationNames } from '../src/db/known-migrations';
import { migrateTempDb, tempDbPath } from './generate-entities';
import { MikroORM } from '@mikro-orm/postgresql';

import Database from 'better-sqlite3';
import fs from 'node:fs';

/** What one pass over the migrated SQLite database yields: the baseline, and the triggers the migrations leave there. */
interface BaselinePass {
  baseline: PostgresBaseline;
  sqliteTriggers: string[];
}

/** The baseline the entities and the migrations on disk describe now, from one migration of the SQLite database. */
async function generateBaseline(known: Set<string> = knownMigrationNames()): Promise<BaselinePass> {
  const migrations = [...known].sort();
  const through = migrations.at(-1);
  if (!through) throw new Error('no migrations found');
  const orm = await MikroORM.init({
    clientUrl: 'postgresql://generator@localhost/trek',
    entities: [...ALL_ENTITIES],
    discovery: { warnWhenNoEntities: false },
  });
  try {
    for (const meta of orm.getMetadata().getAll().values()) applyPostgresColumnAdjustments(meta.props);
    const migrated = await readMigratedSqlite();
    const statements = [
      NOCASE_COLLATION_SQL,
      ...splitStatements(await orm.schema.getCreateSchemaSQL({ wrap: false })),
      ...migrated.tables.flatMap((table) => rowStatements(table.name, table.rows)),
      ...Object.values(POSTGRES_TRIGGERS).flat(),
    ];
    return { baseline: { through, migrations, statements }, sqliteTriggers: migrated.triggers };
  } finally {
    await orm.close();
  }
}

/**
 * What `--check` holds, as the problems it finds. Every manifest must name
 * migrations that exist and every migration up to `through`. While no migration
 * is newer than the committed baseline (`through` matches), the baseline is
 * not frozen: it must be exactly what the entities generate, and each SQLite
 * trigger needs a port. Once a newer migration lands, the baseline is frozen
 * and only the manifest is checked.
 */
export function checkBaseline(
  committed: PostgresBaseline,
  generated: PostgresBaseline,
  matches: boolean,
  sqliteTriggers: readonly string[],
): string[] {
  const known = new Set(generated.migrations);
  const problems: string[] = [];
  const missing = committed.migrations.filter((name) => !known.has(name));
  if (missing.length > 0) problems.push(`the baseline names migrations that do not exist: ${missing.join(', ')}`);
  const unlisted = generated.migrations.filter(
    (name) => name <= committed.through && !committed.migrations.includes(name),
  );
  if (unlisted.length > 0)
    problems.push(`migrations up to ${committed.through} are missing from it: ${unlisted.join(', ')}`);
  const frozen = committed.through !== generated.through;
  if (frozen) return problems;
  if (!matches) problems.push('the entities generate a different schema; run npm run gen:pg-baseline');
  problems.push(...triggerPortProblems(sqliteTriggers, Object.keys(POSTGRES_TRIGGERS)));
  return problems;
}

/** Migration bookkeeping: the baseline's manifest stands for it on Postgres. */
const BOOKKEEPING_TABLES = new Set(['mikro_orm_migrations', 'migrations', 'schema_version']);

type Row = Record<string, unknown>;

/** What the migrations leave in a SQLite database: its triggers, and the rows they insert, table by table in creation order. */
interface MigratedSchema {
  triggers: string[];
  tables: Array<{ name: string; rows: Row[] }>;
}

/** The tables and triggers of a SQLite database in creation order, each as its type and name. */
function listSchemaObjects(conn: Database.Database): Array<{ type: string; name: string }> {
  return conn
    .prepare(
      "select type, name from sqlite_master where type in ('table', 'trigger') and name not like 'sqlite_%' order by rowid",
    )
    .all() as Array<{ type: string; name: string }>;
}

/** Reads a migrated SQLite database, read-only. */
function readMigratedSchema(dbPath: string): MigratedSchema {
  const conn = new Database(dbPath, { readonly: true });
  try {
    const objects = listSchemaObjects(conn);
    const tables = objects
      .filter((object) => object.type === 'table' && !BOOKKEEPING_TABLES.has(object.name))
      .map((object) => ({
        name: object.name,
        rows: conn.prepare(`select * from "${object.name}" order by rowid`).all() as Row[],
      }))
      .filter((table) => table.rows.length > 0);
    const triggers = objects
      .filter((object) => object.type === 'trigger')
      .map((object) => object.name)
      .sort();
    return { triggers, tables };
  } finally {
    conn.close();
  }
}

/** Migrates a temporary SQLite database and reads what the migrations leave in it; the file is removed afterwards. */
async function readMigratedSqlite(): Promise<MigratedSchema> {
  const dbPath = tempDbPath();
  try {
    await migrateTempDb(dbPath);
    return readMigratedSchema(dbPath);
  } finally {
    fs.rmSync(dbPath, { force: true });
  }
}

/** A value as a Postgres literal the column's own type takes in: quoted text, which Postgres casts on insert. */
function literal(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (Buffer.isBuffer(value)) throw new Error('a migration inserted binary data, which the baseline cannot carry');
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * The rows a migration inserted into `table` (reference data such as the tour
 * types and the provider catalogues), as the statements that put them in a
 * Postgres database the baseline creates, then move the table's id sequence,
 * if it has one, past them. A migration up to the cut never runs on Postgres,
 * so without these the database would start without what every SQLite
 * install has before its first seeder.
 */
export function rowStatements(table: string, rows: readonly Row[]): string[] {
  if (rows.length === 0) return [];
  const columns = Object.keys(rows[0]);
  const values = rows.map((row) => `(${columns.map((column) => literal(row[column])).join(', ')})`);
  const statements = [
    `insert into "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) values ${values.join(', ')}`,
  ];
  if (rows.every((row) => typeof row.id === 'number')) {
    statements.push(
      `select setval(seq, greatest(max_id, 1)) from (select pg_get_serial_sequence('"${table}"', 'id') as seq, ` +
        `max("id") as max_id from "${table}") ids where seq is not null`,
    );
  }
  return statements;
}

/**
 * The SQLite triggers without a Postgres port in `POSTGRES_TRIGGERS`, and the
 * ports whose trigger is gone. The entities carry no triggers, so this is
 * what keeps the hand-written ports level with the migrations.
 */
export function triggerPortProblems(sqliteTriggers: readonly string[], ported: readonly string[]): string[] {
  const problems: string[] = [];
  const missing = sqliteTriggers.filter((name) => !ported.includes(name));
  if (missing.length > 0)
    problems.push(`SQLite triggers without a Postgres port in POSTGRES_TRIGGERS: ${missing.join(', ')}`);
  const stale = ported.filter((name) => !sqliteTriggers.includes(name));
  if (stale.length > 0)
    problems.push(`POSTGRES_TRIGGERS ports triggers the migrations no longer create: ${stale.join(', ')}`);
  return problems;
}

/** The default mode: writes the baseline the entities and the migrations describe. */
async function writeMode(): Promise<void> {
  const { baseline } = await generateBaseline();
  writePostgresBaseline(baseline);
  console.log(`[generate-pg-baseline] wrote ${baseline.statements.length} statements through ${baseline.through}`);
}

/** `--check` (CI): exits 1, naming every problem, when the committed baseline has drifted. */
async function checkMode(): Promise<void> {
  const { baseline: generated, sqliteTriggers } = await generateBaseline();
  const committed = readPostgresBaseline();
  const problems = checkBaseline(committed, generated, baselineMatches(generated), sqliteTriggers);
  if (problems.length > 0) {
    for (const problem of problems) console.error(`[generate-pg-baseline] ${problem}`);
    process.exit(1);
  }
  console.log('[generate-pg-baseline] --check: the Postgres baseline matches the entities and the migrations');
}

async function main(): Promise<void> {
  if (process.argv.slice(2).includes('--check')) await checkMode();
  else await writeMode();
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
