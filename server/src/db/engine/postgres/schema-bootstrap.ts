import { readEnv, type AppEnv } from '../../../app-config';
import { resolveDataPaths } from '../../../app-config/data-paths';
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
  const rows: Array<{ table_name: string }> = await connection.execute(
    'select table_name from information_schema.tables where table_schema = current_schema() order by table_name',
  );
  return rows.map((row) => row.table_name);
}

/**
 * Brings a Postgres database to the current schema.
 *
 * - No migration recorded and no table: the baseline runs and every migration
 *   it stands for is recorded as executed, in one transaction (DDL is
 *   transactional on Postgres, so the database ends with all of it or none).
 * - No migration recorded but tables present: refused, naming a few of them.
 * - Migrations recorded: refused when one is unknown to this build (a newer
 *   TREK migrated it), else the pending migrations run, after the safety net.
 *   A database the baseline just created runs the migrations after the
 *   baseline's cut without it: there is nothing yet to lose.
 */
export async function bootstrapPostgresSchema(orm: AnyOrm, deps: PostgresBootstrapDeps): Promise<void> {
  const migrator = orm.config.getExtension('@mikro-orm/migrator') as Migrator;
  const connection = orm.em.getConnection();
  const storage = migrator.getStorage();
  const historyTable = orm.config.get('migrations').tableName ?? 'mikro_orm_migrations';
  const tables = await currentTables(connection);
  const executed = tables.includes(historyTable) ? (await migrator.getExecuted()).map((row) => row.name) : [];
  const created = executed.length === 0;

  if (created) {
    const foreign = tables.filter((table) => table !== historyTable);
    if (foreign.length > 0) {
      throw new Error(
        `${REFUSAL} the database holds ${foreign.length} table(s) (${foreign.slice(0, 5).join(', ')}) but no TREK ` +
          'migration history. Point TREK_DB_URL at an empty database.',
      );
    }
    await storage.ensureTable();
    const baseline = deps.baseline();
    logger.log(`Creating the schema in an empty Postgres database (through ${migrationLabel(baseline.through)})`);
    await connection.transactional(async (trx) => {
      // One round trip: without parameters pg sends it as a simple query, which may hold many statements.
      await connection.execute(baseline.statements.join(';\n'), [], 'run', trx);
      await Promise.all(baseline.migrations.map((name) => storage.logMigration({ name }, trx)));
    });
  } else {
    const thisRelease = migrationLabel([...deps.known].sort().at(-1) ?? '');
    refuseNewerDatabase(executed, deps.known, await deps.safetyNet.restoreHint(thisRelease));
  }

  const pending = await migrator.getPending();
  if (pending.length === 0) return;
  // A database created just now holds nothing a migration could lose.
  if (!created) await deps.safetyNet.beforeMigrate(migrationLabel([...executed].sort().at(-1) as string));
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
