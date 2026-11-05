import { readEnv, type AppEnv } from '../../../app-config';
import { resolveDataPaths } from '../../../app-config/data-paths';
import { CURRENT_SCHEMA_TABLES_SQL } from '../../dialect/catalog';
import { knownMigrationNames } from '../../known-migrations';
import { migrationLabel, REFUSAL, refuseNewerDatabase, type MigrationSafetyNet } from '../../legacy-baseline';
import type { AnyOrm } from '../../orm';
import { listSnapshots, PREFIX, pruneSnapshots, stamp } from '../../pre-migrate-snapshot';
import { readPostgresBaseline, type PostgresBaseline } from './baseline';
import { pgDump } from './pg-tools';
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
 * Creates the schema in an empty Postgres database: the baseline's statements
 * and the record of every migration it stands for, in one transaction (DDL is
 * transactional on Postgres, so the database ends with all of it or none). A
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
  await storage.ensureTable();
  const schema = baseline();
  logger.log(`Creating the schema in an empty Postgres database (through ${migrationLabel(schema.through)})`);
  await connection.transactional(async (trx) => {
    await connection.execute(schema.statements.join(';\n'), [], 'run', trx);
    await Promise.all(schema.migrations.map((name) => storage.logMigration({ name }, trx)));
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
  const historyTable = orm.config.get('migrations').tableName ?? 'mikro_orm_migrations';

  const tables = await currentTables(connection);
  const executed = tables.includes(historyTable) ? (await migrator.getExecuted()).map((row) => row.name) : [];

  if (executed.length === 0) {
    await createFromBaseline(connection, migrator.getStorage(), tables, historyTable, deps.baseline);
  } else {
    await refuseNewerHistory(executed, deps);
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
          `The copy taken right before the newer TREK migrated it is ${match}: stop TREK, empty the database ` +
          '(drop and recreate it), and restore it with pg_restore --no-owner --no-privileges --single-transaction.'
        );
      }
      if (snapshots.length > 0) {
        return `Copies taken before earlier migrations are in ${dataDir()} (${PREFIX}*${DUMP_EXTENSION}), none of them from this release.`;
      }
      return null;
    },
  };
}

/** What a production boot passes: the committed baseline, the migrations on disk, the safety net above. */
export function defaultPostgresBootstrapDeps(url: string): PostgresBootstrapDeps {
  return { baseline: readPostgresBaseline, known: knownMigrationNames(), safetyNet: postgresSafetyNet(url) };
}
