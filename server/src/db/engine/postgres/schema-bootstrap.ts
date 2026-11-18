import { readEnv, type AppEnv } from '../../../app-config';
import { resolveDataPaths } from '../../../app-config/data-paths';
import { CURRENT_SCHEMA_TABLES_SQL } from '../../dialect/catalog';
import { knownMigrationNames } from '../../known-migrations';
import { migrationLabel, REFUSAL, refuseNewerDatabase, type MigrationSafetyNet } from '../../legacy-baseline';
import type { AnyOrm } from '../../orm';
import { listSnapshots, PREFIX, pruneSnapshots, stamp } from '../../pre-migrate-snapshot';
import { sqliteInstallHoldsAccounts } from '../sqlite/sqlite-source';
import { readPostgresBaseline, type PostgresBaseline } from './baseline';
import { pgDump } from './pg-tools';
import { PRIVILEGED_ROLE_SQL, PRIVILEGED_ROLE_WARNING, refuseUnsupportedServer, serverMajor } from './server-checks';
import type { Connection } from '@mikro-orm/core';
import type { Migrator } from '@mikro-orm/migrations';
import { Logger } from '@nestjs/common';

import fs from 'node:fs';
import path from 'node:path';

const logger = new Logger('DB');

/** A Postgres copy is a pg_dump custom-format archive. */
const DUMP_EXTENSION = '.pgdump';

/** What a Postgres bootstrap reads, passed in so a test can supply its own. */
export interface PostgresBootstrapDeps {
  baseline: () => PostgresBaseline;
  known: Set<string>;
  safetyNet: MigrationSafetyNet;
  /**
   * The SQLite install a boot on a database without TREK data would leave
   * behind: the path of a SQLite file in the data directory that holds
   * accounts, or null when there is none (or the operator said to start
   * anyway). Read only when the database holds no TREK data, so a boot on a
   * database in use never opens the file.
   */
  sqliteLeftBehind: () => string | null;
}

/**
 * The commands that move a SQLite install into Postgres, as the refusal names
 * them: the one the wiki page Database-Postgres gives for a compose install,
 * and the one outside Docker. A test keeps both the same as the page.
 */
export const MOVE_COMMAND_DOCKER =
  'docker compose -f docker-compose.postgres.yml run --rm --user node -w /app/server app ' +
  'node --require tsconfig-paths/register dist/move-to-postgres.js';
export const MOVE_COMMAND_NPM = 'npm run db:move-to-postgres';
const MOVE_COMMAND_HINT = `${MOVE_COMMAND_DOCKER} (${MOVE_COMMAND_NPM} in server/ outside Docker)`;

/**
 * The refusal of a boot that would come up empty on Postgres while `file`
 * holds the install's data.
 */
function leftBehindRefusal(file: string): string {
  return (
    `${REFUSAL} TREK_DB_URL points at a Postgres database that holds no TREK data, while ${file} holds an ` +
    'existing SQLite install with accounts. Starting would bring up a new, empty TREK beside it. To move that ' +
    `install to Postgres, stop TREK and run the move command: ${MOVE_COMMAND_HINT}. The wiki page ` +
    'Database-Postgres ("Moving an existing install to Postgres") has the steps. To start on the empty ' +
    'database on purpose, set TREK_DB_IGNORE_SQLITE_FILE=true; to keep running on SQLite, unset TREK_DB_URL.'
  );
}

/**
 * Whether the database holds an account. A database TREK created always does
 * once its first boot finished; one without is what a move that stopped part
 * of the way, or a first boot that died before seeding, leaves.
 */
async function holdsAccounts(connection: Connection, tables: readonly string[]): Promise<boolean> {
  if (!tables.includes('users')) return false;
  const rows: unknown[] = await connection.execute('select 1 as present from users limit 1');
  return rows.length > 0;
}

/** Refuses the boot when `sqliteLeftBehind` names a SQLite install this boot would leave behind. */
function refuseLeavingSqliteBehind(deps: PostgresBootstrapDeps): void {
  const file = deps.sqliteLeftBehind();
  if (file !== null) throw new Error(leftBehindRefusal(file));
}

/**
 * The tables in the current schema. A database with no TREK migration history
 * must hold none: TREK creates its schema in an empty database and never
 * adopts tables something else made. Read before anything is written, so a
 * refused database is left exactly as it was.
 */
async function currentTables(connection: Connection): Promise<string[]> {
  const rows: Array<{ table_name: string }> = await connection.execute(CURRENT_SCHEMA_TABLES_SQL);
  return rows.map((row) => row.table_name);
}

/**
 * Creates the schema in an empty Postgres database: the migration history's
 * table, the baseline's statements and the record of every migration it
 * stands for, in one transaction (DDL is transactional on Postgres, so the
 * database ends with all of it or none, not even an empty history table). A
 * database holding tables beside no TREK history is refused before anything is
 * written.
 */
async function createFromBaseline(
  connection: Connection,
  storage: ReturnType<Migrator['getStorage']>,
  tables: readonly string[],
  historyTable: string,
  baseline: () => PostgresBaseline,
): Promise<void> {
  const foreign = tables.filter((table) => table !== historyTable);
  if (foreign.length > 0) {
    throw new Error(
      `${REFUSAL} the database holds ${foreign.length} table(s) (${foreign.slice(0, 5).join(', ')}) but no TREK ` +
        'migration history. Point TREK_DB_URL at an empty database.',
    );
  }
  const schema = baseline();
  logger.log(`Creating the schema in an empty Postgres database (through ${migrationLabel(schema.through)})`);
  await connection.transactional(async (trx) => {
    // The history table is created inside the transaction too: MikroORM
    // creates it on the storage's master transaction, and without one it would
    // commit on its own, so a baseline that fails would leave it behind and a
    // later RESTORE_FROM_BACKUP would take the database for one in use.
    storage.setMasterMigration(trx);
    try {
      await storage.ensureTable();
      await connection.execute(schema.statements.join(';\n'), [], 'run', trx);
      await Promise.all(schema.migrations.map((name) => storage.logMigration({ name }, trx)));
    } finally {
      storage.unsetMasterMigration();
    }
  });
}

/**
 * Refuses a database whose recorded history names a migration this build does
 * not know: a newer TREK migrated it. The refusal names the copy taken before
 * that migration, when there is one.
 */
async function refuseNewerHistory(executed: string[], deps: PostgresBootstrapDeps): Promise<void> {
  const thisRelease = migrationLabel([...deps.known].sort().at(-1) ?? '');
  refuseNewerDatabase(executed, deps.known, await deps.safetyNet.restoreHint(thisRelease));
}

/** The migration history's table, without a schema. */
const HISTORY_TABLE = 'mikro_orm_migrations';

/** What the boot reads about the server before it writes anything. */
interface ServerFacts {
  schema: string | null;
  version: string;
  privileged: boolean;
}

/**
 * Refuses a server version TREK does not support, warns about a role that
 * could reach the database host (a restore refuses it), and points MikroORM's
 * migration history at the current schema, where TREK's tables live.
 *
 * The history table is created without a schema, so it lands in the current
 * schema beside the tables, but MikroORM looks for it in `public` unless told
 * otherwise. On a role whose search_path resolves to another schema (a role
 * `trek` with a schema `trek`, which the default `"$user", public` picks) it
 * would find none there on the second boot and try to create it again. The
 * name is qualified here, before the migrator reads it; the migrator reads
 * the option on every use, so a restore's re-bootstrap sets it again alike.
 * Returns the table's name without the schema.
 */
async function checkServerAndPlaceHistory(orm: AnyOrm, connection: Connection): Promise<string> {
  const [facts] = await connection.execute<ServerFacts[]>(
    "select current_schema() as schema, current_setting('server_version_num') as version, " +
      `(${PRIVILEGED_ROLE_SQL}) as privileged`,
  );
  refuseUnsupportedServer(serverMajor(facts?.version));
  if (facts?.privileged) logger.warn(PRIVILEGED_ROLE_WARNING);
  const schema = facts?.schema;
  if (!schema || schema.includes('.')) {
    const why = schema ? `the current schema "${schema}", whose name holds a dot` : 'no current schema';
    throw new Error(
      `${REFUSAL} the role in TREK_DB_URL has ${why}. Set its search_path to a schema TREK may create its tables in.`,
    );
  }
  const migrations = orm.config.get('migrations');
  migrations.tableName = `${schema}.${HISTORY_TABLE}`;
  return HISTORY_TABLE;
}

/**
 * Brings a Postgres database to the current schema: inspect what it holds,
 * then create the schema or verify the history it has, then migrate.
 *
 * - No migration recorded and no table: the baseline is created
 *   (`createFromBaseline`).
 * - No migration recorded but tables present: refused, naming a few of them.
 * - Migrations recorded: refused when one is unknown to this build, else the
 *   pending migrations run, after the safety net. A database the baseline just
 *   created runs the migrations after the baseline's cut without it: there is
 *   nothing yet to lose.
 */
export async function bootstrapPostgresSchema(orm: AnyOrm, deps: PostgresBootstrapDeps): Promise<void> {
  const migrator = orm.config.getExtension('@mikro-orm/migrator') as Migrator;
  const connection = orm.em.getConnection();
  const historyTable = await checkServerAndPlaceHistory(orm, connection);

  const tables = await currentTables(connection);
  const executed = tables.includes(historyTable) ? (await migrator.getExecuted()).map((row) => row.name) : [];

  if (executed.length === 0) {
    // An empty database (a database holding other tables is refused below, with its own message).
    if (tables.every((table) => table === historyTable)) refuseLeavingSqliteBehind(deps);
    await createFromBaseline(connection, migrator.getStorage(), tables, historyTable, deps.baseline);
  } else {
    await refuseNewerHistory(executed, deps);
    // A schema without a single account holds no TREK data either; only then is the SQLite file looked at.
    if (!(await holdsAccounts(connection, tables))) refuseLeavingSqliteBehind(deps);
  }

  const pending = await migrator.getPending();
  if (pending.length === 0) return;
  // Only a database with history has a last migration to label its copy by; a
  // database the baseline just created has nothing yet to lose.
  const latest = [...executed].sort().at(-1);
  if (latest !== undefined) await deps.safetyNet.beforeMigrate(migrationLabel(latest));
  logger.log(`Applying ${pending.length} pending migration(s)`);
  await migrator.up();
}

/** Dumps a killed boot left half-written: never a copy, only disk taken. */
function removeOrphanedPartials(dir: string): void {
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith(PREFIX) && file.endsWith(`${DUMP_EXTENSION}.partial`)) {
      fs.rmSync(path.join(dir, file), { force: true });
    }
  }
}

/**
 * The Postgres safety net before pending migrations, as the SQLite file's
 * (`db/pre-migrate-snapshot.ts`): a `pg_dump` of the database to
 * `<data>/pre-migrate-<schema>-<time>.pgdump`, the newest
 * `TREK_DB_PRE_MIGRATE_SNAPSHOT_KEEP` kept. A copy that cannot be written
 * (pg_dump missing, the data dir full) refuses the boot before anything is
 * migrated, unless `TREK_DB_PRE_MIGRATE_SNAPSHOT=false`. Off under
 * NODE_ENV=test unless a suite asks for it.
 */
export function postgresSafetyNet(
  url: string,
  env: () => AppEnv = readEnv,
  now: () => Date = () => new Date(),
  dataDir: () => string = () => resolveDataPaths(env()).dataDir,
): MigrationSafetyNet {
  return {
    async beforeMigrate(from) {
      const { db, app } = env();
      if (db.preMigrateSnapshot === undefined && app.isTest) return;
      if (db.preMigrateSnapshot === false) {
        logger.warn('TREK_DB_PRE_MIGRATE_SNAPSHOT is off: migrating the Postgres database without a copy');
        return;
      }
      const target = path.join(dataDir(), `${PREFIX}${from ?? 'unversioned'}-${stamp(now())}${DUMP_EXTENSION}`);
      try {
        fs.mkdirSync(dataDir(), { recursive: true });
        removeOrphanedPartials(dataDir());
        await pgDump(url, target, db.pgBinDir);
      } catch (err) {
        throw new Error(
          `${REFUSAL} could not write a copy of the database to ${target} before migrating it ` +
            `(${err instanceof Error ? err.message : String(err)}). Nothing was migrated. Fix that, ` +
            'or set TREK_DB_PRE_MIGRATE_SNAPSHOT=false to migrate without a copy.',
          { cause: err },
        );
      }
      logger.log(`Copy of the database before migrating: ${target}`);
      pruneSnapshots(dataDir(), db.preMigrateSnapshotKeep, DUMP_EXTENSION);
    },

    async restoreHint(thisRelease) {
      const snapshots = listSnapshots(dataDir(), DUMP_EXTENSION);
      const match = snapshots.find((snapshot) => path.basename(snapshot).startsWith(`${PREFIX}${thisRelease}-`));
      if (match) {
        return (
          `The copy taken right before the newer TREK migrated it is ${match}: stop TREK and load it as the wiki ` +
          'page Updating describes ("Rolling back a Postgres update"), which clears the schema and runs ' +
          'pg_restore --no-owner --no-privileges in one transaction with psql.'
        );
      }
      if (snapshots.length > 0) {
        return `Copies taken before earlier migrations are in ${dataDir()} (${PREFIX}*${DUMP_EXTENSION}), none of them from this release.`;
      }
      return null;
    },
  };
}

/**
 * The SQLite install a Postgres boot would leave behind (`PostgresBootstrapDeps.sqliteLeftBehind`):
 * the SQLite file the data directory resolves to (`data/travel.db`), when it
 * holds accounts. A file that cannot be read counts as holding them, so the
 * check fails closed. `TREK_DB_IGNORE_SQLITE_FILE=true` lets the boot through
 * with a warning. Off under NODE_ENV=test, where the data directory is the
 * developer's own.
 */
export function sqliteLeftBehindCheck(
  env: () => AppEnv = readEnv,
  holdsAccounts: (file: string) => boolean = sqliteInstallHoldsAccounts,
): () => string | null {
  return () => {
    const current = env();
    if (current.app.isTest) return null;
    const file = resolveDataPaths(current).dbFile;
    if (!holdsAccounts(file)) return null;
    if (current.db.ignoreSqliteFile) {
      logger.warn(`TREK_DB_IGNORE_SQLITE_FILE is set: starting on Postgres beside the SQLite install in ${file}`);
      return null;
    }
    return file;
  };
}

/** What a production boot passes: the committed baseline, the migrations on disk, the safety net and the check above. */
export function defaultPostgresBootstrapDeps(url: string): PostgresBootstrapDeps {
  return {
    baseline: readPostgresBaseline,
    known: knownMigrationNames(),
    safetyNet: postgresSafetyNet(url),
    sqliteLeftBehind: sqliteLeftBehindCheck(),
  };
}
