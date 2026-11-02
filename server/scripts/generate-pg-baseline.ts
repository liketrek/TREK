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
import { baselineMatches, readPostgresBaseline, writePostgresBaseline, type PostgresBaseline } from '../src/db/engine/postgres/baseline';
import {
  adjustColumns,
  NOCASE_COLLATION_SQL,
  POSTGRES_TRIGGERS,
  splitStatements,
  type ColumnMeta,
} from '../src/db/engine/postgres/schema-adjust';
import { ALL_ENTITIES } from '../src/db/entities';
import { knownMigrationNames } from '../src/db/known-migrations';
import type { EntityProperty } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { migrateTempDb, tempDbPath } from './generate-entities';

import Database from 'better-sqlite3';
import fs from 'node:fs';

/** The baseline the entities and the migrations on disk describe now. */
export async function generatePostgresBaseline(known: Set<string> = knownMigrationNames()): Promise<PostgresBaseline> {
  const migrations = [...known].sort();
  const through = migrations.at(-1);
  if (!through) throw new Error('no migrations found');
  const orm = await MikroORM.init({
    // Never contacted: init() only discovers metadata, and the schema generator needs nothing else.
    clientUrl: 'postgresql://generator@localhost/trek',
    entities: [...ALL_ENTITIES],
    discovery: { warnWhenNoEntities: false },
  });
  try {
    for (const meta of orm.getMetadata().getAll().values()) adjustColumns(meta.props as EntityProperty[] as ColumnMeta[]);
    const migrated = await readMigratedSqlite();
    const statements = [
      NOCASE_COLLATION_SQL,
      ...splitStatements(await orm.schema.getCreateSchemaSQL({ wrap: false })),
      ...migrated.tables.flatMap((table) => rowStatements(table.name, table.rows)),
      ...Object.values(POSTGRES_TRIGGERS).flat(),
    ];
    return { through, migrations, statements };
  } finally {
    await orm.close();
  }
}

/**
 * What `--check` holds. While no migration is newer than the committed
 * baseline, the baseline must be exactly what the entities generate. Once one
 * is, the baseline is frozen and only its manifest is checked: every migration
 * it names exists, and it names every migration up to `through`.
 */
export function checkBaseline(committed: PostgresBaseline, generated: PostgresBaseline, matches: boolean): string[] {
  const known = new Set(generated.migrations);
  const problems: string[] = [];
  const missing = committed.migrations.filter((name) => !known.has(name));
  if (missing.length > 0) problems.push(`the baseline names migrations that do not exist: ${missing.join(', ')}`);
  const unlisted = generated.migrations.filter((name) => name <= committed.through && !committed.migrations.includes(name));
  if (unlisted.length > 0) problems.push(`migrations up to ${committed.through} are missing from it: ${unlisted.join(', ')}`);
  if (committed.through === generated.through && !matches) {
    problems.push('the entities generate a different schema; run npm run gen:pg-baseline');
  }
  return problems;
}

/** Migration bookkeeping: the baseline's manifest stands for it on Postgres. */
const BOOKKEEPING_TABLES = new Set(['mikro_orm_migrations', 'migrations', 'schema_version']);

type Row = Record<string, unknown>;

/** What the migrations leave in a SQLite database: its triggers, and the rows they insert, table by table in creation order. */
async function readMigratedSqlite(): Promise<{ triggers: string[]; tables: Array<{ name: string; rows: Row[] }> }> {
  const dbPath = tempDbPath();
  try {
    await migrateTempDb(dbPath);
    const conn = new Database(dbPath, { readonly: true });
    try {
      const objects = conn
        .prepare("select type, name from sqlite_master where type in ('table', 'trigger') and name not like 'sqlite_%' order by rowid")
        .all() as Array<{ type: string; name: string }>;
      const tables = objects
        .filter((object) => object.type === 'table' && !BOOKKEEPING_TABLES.has(object.name))
        .map((object) => ({ name: object.name, rows: conn.prepare(`select * from "${object.name}" order by rowid`).all() as Row[] }))
        .filter((table) => table.rows.length > 0);
      const triggers = objects.filter((object) => object.type === 'trigger').map((object) => object.name).sort();
      return { triggers, tables };
    } finally {
      conn.close();
    }
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
  const statements = [`insert into "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) values ${values.join(', ')}`];
  // A text key (addons.id) has no sequence; a numeric one may.
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
  if (missing.length > 0) problems.push(`SQLite triggers without a Postgres port in POSTGRES_TRIGGERS: ${missing.join(', ')}`);
  const stale = ported.filter((name) => !sqliteTriggers.includes(name));
  if (stale.length > 0) problems.push(`POSTGRES_TRIGGERS ports triggers the migrations no longer create: ${stale.join(', ')}`);
  return problems;
}

async function main(): Promise<void> {
  const generated = await generatePostgresBaseline();
  if (!process.argv.slice(2).includes('--check')) {
    writePostgresBaseline(generated);
    console.log(`[generate-pg-baseline] wrote ${generated.statements.length} statements through ${generated.through}`);
    return;
  }
  const committed = readPostgresBaseline();
  const problems = checkBaseline(committed, generated, baselineMatches(generated));
  // Once frozen, a later migration's trigger reaches Postgres through the migrator, not this list.
  if (committed.through === generated.through) {
    problems.push(...triggerPortProblems((await readMigratedSqlite()).triggers, Object.keys(POSTGRES_TRIGGERS)));
  }
  if (problems.length > 0) {
    for (const problem of problems) console.error(`[generate-pg-baseline] ${problem}`);
    process.exit(1);
  }
  console.log('[generate-pg-baseline] --check: the Postgres baseline matches the entities and the migrations');
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
