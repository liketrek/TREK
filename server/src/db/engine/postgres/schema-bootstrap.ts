import { readEnv, type AppEnv } from '../../../app-config';
import { knownMigrationNames } from '../../known-migrations';
import { migrationLabel, REFUSAL, refuseNewerDatabase, type MigrationSafetyNet } from '../../legacy-baseline';
import type { AnyOrm } from '../../orm';
import { readPostgresBaseline, type PostgresBaseline } from './baseline';
import type { Connection } from '@mikro-orm/core';
import type { Migrator } from '@mikro-orm/migrations';
import { Logger } from '@nestjs/common';

const logger = new Logger('DB');

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
    refuseNewerDatabase(executed, deps.known);
  }

  const pending = await migrator.getPending();
  if (pending.length === 0) return;
  // A database created just now holds nothing a migration could lose.
  if (!created) await deps.safetyNet.beforeMigrate(migrationLabel([...executed].sort().at(-1) as string));
  logger.log(`Applying ${pending.length} pending migration(s)`);
  await migrator.up();
}

/**
 * The Postgres safety net before pending migrations. This release cannot copy
 * a Postgres database (the SQLite engine's `VACUUM INTO` has no Postgres
 * equivalent short of `pg_dump`), so it refuses unless the operator turned
 * the copy off: fail closed, rather than migrate with nothing to go back to.
 * Off under NODE_ENV=test unless a suite asks for it, as on SQLite.
 */
export function postgresSafetyNet(env: () => AppEnv = readEnv): MigrationSafetyNet {
  return {
    async beforeMigrate() {
      const { db, app } = env();
      if (db.preMigrateSnapshot === undefined && app.isTest) return;
      if (db.preMigrateSnapshot === false) {
        logger.warn('TREK_DB_PRE_MIGRATE_SNAPSHOT is off: migrating the Postgres database without a copy');
        return;
      }
      throw new Error(
        `${REFUSAL} migrations are pending and TREK cannot copy a Postgres database before migrating it in this ` +
          'release. Back it up with pg_dump, then start once with TREK_DB_PRE_MIGRATE_SNAPSHOT=false.',
      );
    },
    restoreHint: async () => null,
  };
}

/** What a production boot passes: the committed baseline, the migrations on disk, the safety net above. */
export function defaultPostgresBootstrapDeps(): PostgresBootstrapDeps {
  return { baseline: readPostgresBaseline, known: knownMigrationNames(), safetyNet: postgresSafetyNet() };
}
