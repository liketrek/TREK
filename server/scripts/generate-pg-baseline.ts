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
 * through the migrator, written through `engineDdl` with the Postgres side
 * from `npm run gen:pg-migration`, and `--check` verifies the manifest, that
 * every SQLite trigger still has its port, and lists the migrations after the
 * cut. Rewriting a frozen baseline moves the cut, so the default mode refuses
 * it and only `--move-cut` does it. That is safe because lint:dialect holds
 * every migration after POSTGRES_FIRST_CUT to the post-cut rules wherever the
 * cut stands, so an install created from the old baseline still reaches the
 * same schema through the migrator.
 *
 * Usage:
 *   node --import tsx scripts/generate-pg-baseline.ts              # rewrite server/assets/postgres/ (not while frozen)
 *   node --import tsx scripts/generate-pg-baseline.ts --move-cut   # rewrite it over the migrations after the cut
 *   node --import tsx scripts/generate-pg-baseline.ts --check      # exit 1 when it drifted (CI)
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
 * The migrations after the committed baseline's cut, in order: what a boot
 * runs on Postgres through the migrator, each written through `engineDdl`
 * (lint:dialect) and held by PARITY-PG. While there is one, the baseline is
 * frozen. `known` is every migration on disk.
 */
export function postCutMigrations(committed: PostgresBaseline, known: readonly string[]): string[] {
  return known.filter((name) => name > committed.through).sort();
}

/**
 * What `--check` holds, as the problems it finds, each with what to do about
 * it. Every manifest must name migrations that exist and every migration up to
 * `through`. While no migration is newer than the committed baseline
 * (`through` matches), the baseline is not frozen: it must be exactly what the
 * entities generate, and each SQLite trigger needs a port. Once a newer
 * migration lands, the baseline is frozen: Postgres reaches the newer schema
 * through that migration, so only the manifest is checked here, and
 * `checkMode` lists the migrations after the cut.
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
  if (missing.length > 0) {
    problems.push(
      `the manifest names migrations that are not in src/db/migrations: ${missing.join(', ')}. ` +
        'A migration that has shipped is never renamed or deleted; restore it under its name.',
    );
  }
  const unlisted = generated.migrations.filter(
    (name) => name <= committed.through && !committed.migrations.includes(name),
  );
  if (unlisted.length > 0) {
    problems.push(
      `migrations that sort before the cut (${committed.through}) are not in the manifest: ${unlisted.join(', ')}. ` +
        `Postgres would never run them; give each a name that sorts after ${generated.through}.`,
    );
  }
  const frozen = committed.through !== generated.through;
  if (!frozen && !matches) {
    problems.push(
      'server/assets/postgres/ is not what the entities, POSTGRES_TRIGGERS and the reference rows the migrations ' +
        'insert generate now, and no migration follows its cut: run npm run gen:pg-baseline and commit ' +
        'server/assets/postgres/.',
    );
  }
  // Frozen or not: the entities carry no triggers, so this is the only check
  // that a trigger a migration leaves on SQLite exists on Postgres too.
  problems.push(...triggerPortProblems(sqliteTriggers, Object.keys(POSTGRES_TRIGGERS), frozen));
  return problems;
}

/**
 * Why the default mode refuses to rewrite the baseline, or null when it may:
 * the migrations after the committed cut. Rewriting the baseline would move
 * the cut over them, which only `--move-cut` does.
 */
export function cutMoveRefusal(committed: PostgresBaseline, known: readonly string[]): string | null {
  const after = postCutMigrations(committed, known);
  if (after.length === 0) return null;
  return (
    `the baseline is frozen at ${committed.through}, and ${after.length} migration(s) follow its cut: ` +
    `${after.join(', ')}. A Postgres install created from it reaches them through the migrator, so the baseline ` +
    'is not regenerated for them: write their schema change through engineDdl with the postgres member that npm ' +
    'run gen:pg-migration prints (server/CLAUDE.md, SQL dialect, Migrations). To fold them into a new baseline on ' +
    'purpose, run npm run gen:pg-baseline -- --move-cut.'
  );
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
 * what keeps the hand-written ports level with the migrations. `frozen` says
 * a migration follows the baseline's cut, so the fix goes into that
 * migration rather than into a regenerated baseline.
 */
export function triggerPortProblems(
  sqliteTriggers: readonly string[],
  ported: readonly string[],
  frozen = false,
): string[] {
  const problems: string[] = [];
  const missing = sqliteTriggers.filter((name) => !ported.includes(name));
  if (missing.length > 0) {
    problems.push(
      frozen
        ? `SQLite triggers without a Postgres port in POSTGRES_TRIGGERS: ${missing.join(', ')}. A migration after ` +
            "the baseline's cut created them, and a trigger after the cut has no Postgres port (server/CLAUDE.md, " +
            'SQL dialect, Migrations): take it out of the migration and do its work in the repository instead.'
        : `SQLite triggers without a Postgres port in POSTGRES_TRIGGERS: ${missing.join(', ')}. Add each one's ` +
            'function and trigger to src/db/engine/postgres/postgres-triggers.ts, then run npm run gen:pg-baseline.',
    );
  }
  const stale = ported.filter((name) => !sqliteTriggers.includes(name));
  if (stale.length > 0) {
    problems.push(
      frozen
        ? `POSTGRES_TRIGGERS ports triggers the migrations no longer create: ${stale.join(', ')}. A migration ` +
            "after the baseline's cut dropped them on SQLite: drop them on Postgres in the postgres member of its " +
            'engineDdl call too, and remove them from src/db/engine/postgres/postgres-triggers.ts.'
        : `POSTGRES_TRIGGERS ports triggers the migrations no longer create: ${stale.join(', ')}. Remove them from ` +
            'src/db/engine/postgres/postgres-triggers.ts, then run npm run gen:pg-baseline.',
    );
  }
  return problems;
}

/**
 * The default mode: writes the baseline the entities and the migrations
 * describe, refused while the committed one is frozen unless `moveCut`.
 */
async function writeMode(moveCut: boolean): Promise<void> {
  const known = [...knownMigrationNames()].sort();
  const refusal = cutMoveRefusal(readPostgresBaseline(), known);
  if (refusal && !moveCut) {
    console.error(`[generate-pg-baseline] ${refusal}`);
    process.exit(1);
  }
  const { baseline } = await generateBaseline();
  writePostgresBaseline(baseline);
  console.log(`[generate-pg-baseline] wrote ${baseline.statements.length} statements through ${baseline.through}`);
}

/** `--check` (CI): exits 1, naming every problem, when the committed baseline has drifted. */
async function checkMode(): Promise<void> {
  const { baseline: generated, sqliteTriggers } = await generateBaseline();
  const committed = readPostgresBaseline();
  const problems = checkBaseline(committed, generated, baselineMatches(generated), sqliteTriggers);
  const after = postCutMigrations(committed, generated.migrations);
  if (after.length > 0) {
    // Frozen: say so, and what keeps those migrations right on Postgres, whether or not the manifest passed.
    console.log(
      `[generate-pg-baseline] --check: the baseline is frozen at ${committed.through}. ${after.length} migration(s) ` +
        `run on Postgres after its cut, through the migrator: ${after.join(', ')}. Each writes its schema change ` +
        'through engineDdl (lint:dialect) and PARITY-PG in the Postgres lane holds the result against the entities; ' +
        'the baseline is not regenerated for them.',
    );
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`[generate-pg-baseline] ${problem}`);
    process.exit(1);
  }
  console.log(
    after.length > 0
      ? `[generate-pg-baseline] --check: the manifest lists every migration through ${committed.through}`
      : '[generate-pg-baseline] --check: the Postgres baseline matches the entities and the migrations',
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes('--check')) await checkMode();
  else await writeMode(args.includes('--move-cut'));
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
