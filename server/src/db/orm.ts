import { withRequestContext } from '../nest/database/request-context';
import { runDemoSeed } from './database';
import { ensureEmailCaseIndex } from './email-case-index';
import { migrateToHead, NO_SAFETY_NET } from './legacy-baseline';
import { preMigrateSnapshot } from './pre-migrate-snapshot';
import type { AnyEntity, EntityClass, EntityManager, EntitySchema, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import type { Migrator } from '@mikro-orm/migrations';

/**
 * Schema ownership at startup. The migrator is async, so the schema is brought
 * to head from `DatabaseLifecycle.open()`, which `buildApp()` calls before
 * anything reads the database. Nothing runs at module load.
 */

/**
 * Whatever MikroORM instance this process holds.
 *
 * Widened on the entity list because Nest's `MikroORM` token resolves to the
 * class's own `readonly` form while a direct `init()` yields the mutable one;
 * nothing here reads that parameter.
 */
export type AnyOrm = MikroORM<
  IDatabaseDriver,
  EntityManager<IDatabaseDriver>,
  readonly (string | EntityClass<AnyEntity> | EntitySchema)[]
>;

/**
 * Migrate to head, then seed. Safe to call again, both halves are idempotent.
 *
 * `snapshot: false` skips the pre-migration copy (`pre-migrate-snapshot.ts`).
 * Only the reopen after a restore passes it: the file it migrates was just
 * unpacked from a backup archive, which is still there to go back to.
 */
export async function runSchemaBootstrap(orm: AnyOrm, { snapshot }: { snapshot: boolean }): Promise<void> {
  const migrator = orm.config.getExtension('@mikro-orm/migrator') as Migrator;
  const connection = orm.em.getConnection();
  // A database the retired positional runner migrated has no migrator rows yet;
  // what it already has is recorded in the same transaction as the run, or the
  // run would replay the whole history over it (see legacy-baseline.ts). Every
  // other database just gets its pending migrations.
  await migrateToHead(
    connection,
    migrator,
    undefined,
    undefined,
    snapshot ? preMigrateSnapshot(connection) : NO_SAFETY_NET,
  );
  await finishSchemaBootstrap(orm);
}

/**
 * What every engine does once its schema is at head: the deferred index, the
 * seeders, the demo seed. Idempotent, like the migration step before it.
 */
export async function finishSchemaBootstrap(orm: AnyOrm): Promise<void> {
  // The one index a migration may have had to defer (see email-case-index.ts).
  await ensureEmailCaseIndex(orm.em.getConnection());

  const defaultSeeder = orm.config.get('seeder').defaultSeeder;
  if (defaultSeeder) await orm.seeder.seedString(defaultSeeder);

  // Demo data depends on the seeded categories (hard-coded ids under an FK), so
  // it can only run once the seeders above have.
  //
  // Plan 3c Task 0b (R9): wrapping the call HERE, the one place
  // `runSchemaBootstrap` already has `orm` in scope, covers BOTH of
  // `runDemoSeed`'s real call sites at once (`DatabaseLifecycle.open()` at
  // boot and its restore hook in `reopen()`, both of which only ever reach
  // `runDemoSeed` through this function) with no second wrapper to keep in
  // sync.
  //
  // Plan 3i Task 3: `runDemoSeed` (and `seedDemoData` beneath it, converted
  // onto `DemoRepository`) is `async` now — this call is awaited so a
  // rejection surfaces here rather than becoming an unhandled promise
  // rejection, and so the seed genuinely completes before
  // `runSchemaBootstrap` (and therefore `buildApp()`/this hook's own
  // restore path) returns to its caller, the same completion guarantee the
  // fully-synchronous version had by construction.
  await withRequestContext(orm, () => runDemoSeed());
}
