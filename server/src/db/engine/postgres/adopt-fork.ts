import { FORK_RECONCILIATION, FORK_SCHEMA_MIGRATION_IDS, FORK_TIMING_MIGRATION } from '../../fork-migrations';
import { REFUSAL } from '../../legacy-baseline';
import type { Connection } from '@mikro-orm/core';
import type { Migrator } from '@mikro-orm/migrations';

import fs from 'node:fs';
import path from 'node:path';

const OFFICIAL_POSTGRES_CUT = 'Migration20200101046440_a_trip_owns_its_tags';
const SQLITE_FORK_MIGRATIONS = [
  FORK_RECONCILIATION,
  FORK_TIMING_MIGRATION,
  'Migration20200101046370_retire_fork_web_push',
];

export function needsForkAdoption(executed: readonly string[], known: ReadonlySet<string>): boolean {
  if (!known.has(FORK_RECONCILIATION)) return false;
  const history = new Set(executed);
  const missing = SQLITE_FORK_MIGRATIONS.filter((name) => !history.has(name));
  if (missing.length === 0) return false;
  const officialMigrations = [...known].filter(
    (name) => name <= OFFICIAL_POSTGRES_CUT && !SQLITE_FORK_MIGRATIONS.includes(name),
  );
  if (missing.length !== SQLITE_FORK_MIGRATIONS.length || officialMigrations.some((name) => !history.has(name))) {
    throw new Error(`${REFUSAL} PostgreSQL migration history does not match the official or fork release.`);
  }
  return true;
}

export async function adoptForkPostgres(
  connection: Connection,
  storage: ReturnType<Migrator['getStorage']>,
): Promise<void> {
  const sql = fs.readFileSync(path.join(__dirname, '../../../../assets/postgres/adopt-fork.sql'), 'utf8');
  await connection.transactional(async (trx) => {
    await connection.execute(sql, [], 'run', trx);
    await connection.execute(
      'insert into fork_schema_migrations (id) values ' + FORK_SCHEMA_MIGRATION_IDS.map(() => '(?)').join(', '),
      [...FORK_SCHEMA_MIGRATION_IDS],
      'run',
      trx,
    );
    await Promise.all(SQLITE_FORK_MIGRATIONS.map((name) => storage.logMigration({ name }, trx)));
  });
}
