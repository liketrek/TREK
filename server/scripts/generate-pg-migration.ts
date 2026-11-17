/**
 * Prints the Postgres side of a new migration: the `postgres` array of its
 * `engineDdl(this, { sqlite: [...], postgres: [...] })` call
 * (src/db/migration-utils.ts).
 *
 * A migration after the Postgres baseline's cut runs on both engines, and the
 * Postgres result has to be exactly what MikroORM generates from the entities
 * (PARITY-PG). So the Postgres DDL is not written by hand: this script builds
 * a scratch database the way a boot builds an empty one (the baseline, then
 * every migration after its cut) but stops before the target migration, asks
 * MikroORM's comparator what still separates it from the entities, drops what
 * changes nothing by the rules PARITY-PG uses
 * (src/db/engine/postgres/entity-schema-diff.ts), and prints the rest.
 *
 * The routine: change the entities, write the migration's SQLite statements
 * as `engineDdl(this, { sqlite: [...], postgres: [] })`, run this, paste what
 * it prints as the `postgres` array. Nothing is written to the repository.
 *
 * It needs a Postgres server where it may create and drop a database:
 * TREK_TEST_DB_URL or --url. The scratch database is dropped again however
 * the run ends.
 *
 * Usage:
 *   npm run gen:pg-migration                                   # the newest migration
 *   npm run gen:pg-migration -- --migration=<ClassName>         # another one
 *   npm run gen:pg-migration -- --url=postgres://user:pw@host:5432/postgres
 */
import { buildOrmConfig } from '../src/db/engine';
import { readPostgresBaseline } from '../src/db/engine/postgres/baseline';
import { diffAgainstEntities, remainingStatements } from '../src/db/engine/postgres/entity-schema-diff';
import { PostgresEngine } from '../src/db/engine/postgres/postgres-engine';
import { bootstrapPostgresSchema, defaultPostgresBootstrapDeps } from '../src/db/engine/postgres/schema-bootstrap';
import { knownMigrationNames } from '../src/db/known-migrations';
import { NO_SAFETY_NET } from '../src/db/legacy-baseline';
import { MikroORM, type MigrationObject } from '@mikro-orm/core';
import { MikroORM as PostgresMikroORM } from '@mikro-orm/postgresql';

import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'db', 'migrations');
const TAG = '[gen:pg-migration]';

/** The scratch databases this script creates: a prefix nothing else uses. */
export const SCRATCH_PREFIX = 'trek_gen_pg_migration_';

/** The migration the run is for: `--migration` (a full class name), else the newest one. */
export function pickTarget(known: readonly string[], requested: string | undefined): string {
  const sorted = [...known].sort();
  if (requested === undefined) {
    const newest = sorted.at(-1);
    if (!newest) throw new Error('no migrations found');
    return newest;
  }
  if (!sorted.includes(requested)) {
    throw new Error(
      `--migration=${requested} names no migration in src/db/migrations; pass the class name, e.g. ${sorted.at(-1)}`,
    );
  }
  return requested;
}

/** The migrations a boot runs on Postgres after the baseline's cut and before `target`, in order. */
export function postCutBefore(known: readonly string[], through: string, target: string): string[] {
  return [...known].filter((name) => name > through && name < target).sort();
}

/**
 * One statement as a TypeScript string literal, in the quote that needs fewer
 * escapes (Prettier's choice, so the pasted array passes lint:format as it is).
 */
export function quote(statement: string): string {
  const mark = statement.split("'").length > statement.split('"').length ? '"' : "'";
  const escaped = statement.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').split(mark).join(`\\${mark}`);
  return `${mark}${escaped}${mark}`;
}

/** The statements as the `postgres` member of an engineDdl call, ready to paste. */
export function renderPostgresArray(statements: readonly string[]): string {
  if (statements.length === 0) return 'postgres: [],';
  return ['postgres: [', ...statements.map((statement) => `  ${quote(statement)},`), '],'].join('\n');
}

/** `adminUrl` pointed at `database`, everything else (credentials, host, sslmode) kept. */
export function databaseUrl(adminUrl: string, database: string): string {
  const url = new URL(adminUrl);
  url.pathname = `/${database}`;
  return url.toString();
}

/** Runs one statement on the admin database, outside any transaction (CREATE and DROP DATABASE refuse one). */
async function onAdmin(adminUrl: string, sql: string): Promise<void> {
  const orm = await PostgresMikroORM.init({
    clientUrl: adminUrl,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    pool: { min: 0, max: 1 },
  });
  try {
    await orm.em.getConnection().execute(sql, [], 'run');
  } finally {
    await orm.close(true);
  }
}

/** The migration classes a boot would run, loaded from their files. */
async function loadMigrations(names: readonly string[]): Promise<MigrationObject[]> {
  return Promise.all(
    names.map(async (name) => {
      const module = (await import(pathToFileURL(path.join(MIGRATIONS_DIR, `${name}.ts`)).href)) as Record<
        string,
        unknown
      >;
      const migrationClass = module[name];
      if (typeof migrationClass !== 'function') throw new Error(`${name}.ts does not export the class ${name}`);
      return { name, class: migrationClass as MigrationObject['class'] };
    }),
  );
}

/**
 * Brings the empty database `url` names to the schema a boot leaves before
 * `target`: the engine's own bootstrap (baseline, then the migrations after
 * its cut), offered only the migrations in `before`, with no pre-migrate copy.
 */
async function bootstrapBefore(url: string, before: readonly string[]): Promise<void> {
  const config = buildOrmConfig(new PostgresEngine({ engine: 'postgres', url, poolMax: 2 }));
  const orm = await MikroORM.init({
    ...config,
    // As tests/postgres/build-template.ts: the bootstrap runs SQL, which needs no entity metadata.
    entities: [],
    entitiesTs: [],
    discovery: { warnWhenNoEntities: false },
    migrations: { ...config.migrations, silent: true, migrationsList: await loadMigrations(before) },
  });
  try {
    await bootstrapPostgresSchema(orm, { ...defaultPostgresBootstrapDeps(url), safetyNet: NO_SAFETY_NET });
  } finally {
    await orm.close(true);
  }
}

function argument(argv: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main(argv: readonly string[]): Promise<void> {
  const adminUrl = argument(argv, 'url') ?? process.env.TREK_TEST_DB_URL;
  if (!adminUrl) {
    throw new Error(
      'needs a Postgres server where it may create and drop a scratch database: set TREK_TEST_DB_URL or pass ' +
        '--url=postgres://user:password@host:5432/postgres (locally: docker run --rm -p 5432:5432 ' +
        '-e POSTGRES_PASSWORD=trek postgres:17).',
    );
  }
  const known = [...knownMigrationNames()].sort();
  const target = pickTarget(known, argument(argv, 'migration'));
  const { through } = readPostgresBaseline();
  const before = postCutBefore(known, through, target);
  const scratch = `${SCRATCH_PREFIX}${randomBytes(6).toString('hex')}`;
  const scratchUrl = databaseUrl(adminUrl, scratch);

  console.error(`${TAG} target ${target}; the Postgres baseline stands for everything through ${through}`);
  if (target <= through) {
    console.error(`${TAG} ${target} is at or before the cut: it never runs on Postgres. Comparing the baseline alone.`);
  } else {
    console.error(`${TAG} building ${scratch}: the baseline, then ${before.length} migration(s) after the cut`);
  }

  await onAdmin(adminUrl, `create database "${scratch}"`);
  try {
    await bootstrapBefore(scratchUrl, before);
    const diff = await diffAgainstEntities(scratchUrl);
    const statements = remainingStatements(diff);
    if (!diff.spellingHolds) {
      console.error(
        `${TAG} some default or check statements change the catalogue, so they are part of the change and printed below.`,
      );
    }
    if (statements.some((statement) => statement.includes('?'))) {
      console.error(`${TAG} a statement holds a "?", which the migrator would read as a parameter: rewrite it.`);
    }
    if (statements.length === 0) {
      console.error(
        target <= through
          ? `${TAG} nothing to do: the baseline matches the entities.`
          : `${TAG} nothing to do: Postgres already matches the entities without ${target}; ` +
              'its engineDdl postgres array stays empty.',
      );
    } else if (target <= through) {
      console.error(
        `${TAG} the baseline differs from the entities by the statements below; npm run check:pg-baseline says why.`,
      );
    } else {
      console.error(`${TAG} paste this as the postgres array of the engineDdl call in ${target}:`);
    }
    console.log(renderPostgresArray(statements));
  } finally {
    await onAdmin(adminUrl, `drop database if exists "${scratch}" with (force)`);
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(`${TAG} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
