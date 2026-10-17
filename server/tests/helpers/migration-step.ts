/**
 * A bare MikroORM instance (no entities) wired only for driving the numbered
 * migration chain in `src/db/migrations/` against a throwaway `:memory:` db —
 * for tests that need to observe ONE specific migration's effect in isolation:
 * migrate to the step immediately before it, seed rows with raw SQL, apply
 * just that one step, assert.
 *
 * Same shape as `tests/unit/db/restore-migrates-forward.test.ts`'s own
 * `ormFor()`, minus the seeder extension (these tests never seed) and pointed
 * at `:memory:` instead of a temp file — nothing here needs a second process
 * to open the same file, so raw SQL runs over the ORM's own connection
 * (`rawExec`/`rawQuery` below) instead of a probe `Database` handle.
 */
import type { Configuration } from '@mikro-orm/core';
import type { Migration } from '@mikro-orm/migrations';
import { Migrator } from '@mikro-orm/migrations';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { MikroORM } from '@mikro-orm/sqlite';

import path from 'node:path';

const MIGRATIONS = path.join(__dirname, '../../src/db/migrations');

export async function createMigrationOrm(): Promise<MikroORM> {
  return MikroORM.init({
    entities: [],
    discovery: { warnWhenNoEntities: false },
    extensions: [Migrator],
    migrations: { path: MIGRATIONS, pathTs: MIGRATIONS, snapshot: false, silent: true },
    dbName: ':memory:',
  });
}

export function migratorOf(orm: MikroORM): Migrator {
  return orm.config.getExtension('@mikro-orm/migrator') as Migrator;
}

/** Migrate up to and including the named migration (its `Migration<...>` class name). */
export async function migrateTo(orm: MikroORM, name: string): Promise<void> {
  await migratorOf(orm).up({ to: name });
}

/** The full pending list on a fresh db, in application order — index by class name. */
export async function pendingNames(orm: MikroORM): Promise<string[]> {
  return (await migratorOf(orm).getPending()).map((m) => m.name);
}

/** Raw SQL over the ORM's own connection (no entities are registered). */
export async function rawExec(orm: MikroORM, sql: string, params: unknown[] = []): Promise<void> {
  await orm.em.getConnection().execute(sql, params);
}

export async function rawQuery<T = unknown>(orm: MikroORM, sql: string, params: unknown[] = []): Promise<T[]> {
  return (await orm.em.getConnection().execute(sql, params)) as T[];
}

/**
 * Constructs and runs ONE migration class directly against the ORM's driver,
 * bypassing the Migrator's `mikro_orm_migrations` bookkeeping entirely — for a
 * test that needs to invoke a migration's `up()` a second time (idempotency /
 * replay-safety guards) without the Migrator's own "already applied, skip"
 * short-circuit getting in the way.
 */
export async function runMigrationDirect(
  orm: MikroORM,
  MigrationClass: new (driver: AbstractSqlDriver, config: Configuration) => Migration,
): Promise<void> {
  const migration = new MigrationClass(orm.em.getDriver(), orm.config);
  await migration.up();
}
