import type { EntityClass, EntityRepository, GetRepository } from '@mikro-orm/core';
import { MikroORM, type EntityManager } from '@mikro-orm/sqlite';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import type { DynamicModule } from '@nestjs/common';
import type Database from 'better-sqlite3';
import { ALL_ENTITIES } from '../../src/db/entities';
import { createBoundSqliteDriver } from '../../src/db/orm-driver';
import mikroOrmConfig from '../../src/mikro-orm.config';

export interface TestOrm {
  orm: MikroORM;
  /** The global, context-resolving EntityManager; `clear()` empties its identity map. */
  em: EntityManager;
  repo<T extends object>(entity: EntityClass<T>): GetRepository<T, EntityRepository<T>>;
  clear(): void;
  /** Closes the ORM only — the better-sqlite3 handle stays open for the caller. */
  close(): Promise<void>;
}

/**
 * An ORM over a test database the caller already opened (usually
 * `createTestDb()`), so factories can keep inserting with raw SQL through the
 * same handle and the ORM sees those rows.
 *
 * `allowGlobalContext` defaults to true here and only here: a test builds a
 * service with `t.repo(X)` and calls it without an HTTP request around it.
 * Production keeps the default (false), which is what `withRequestContext` in
 * `src/nest/database/request-context.ts` is for.
 *
 * `em` and `repo()` hand out the ORM's global EntityManager rather than a fork
 * on purpose: a forked EntityManager has `useContext: false`, so its
 * `getContext()` returns itself and ignores `TransactionContext`. A `t.repo(X)`
 * built on a fork and used inside `uow.transactional` would write outside the
 * open transaction, on a second connection the transaction is holding, and
 * deadlock on Kysely's connection mutex. The helper therefore hands out the
 * same context-resolving global EM that Nest injects into services, which
 * resolves the transactional fork the way production does.
 *
 * `close()` on the underlying MikroORM connection ignores the `force` flag and
 * always tears down its Kysely client — what actually keeps the handle open
 * is `NonClosingSqliteDriver` in `../../src/db/orm-driver.ts`, which
 * `createBoundSqliteDriver` hands MikroORM in place of Kysely's stock
 * `SqliteDriver`; its `destroy()` is a no-op, so this `close()` never reaches
 * the handle at all.
 */
export async function createTestOrm(
  db: Database.Database,
  options: { allowGlobalContext?: boolean } = {},
): Promise<TestOrm> {
  const orm = await MikroORM.init({
    entities: [...ALL_ENTITIES],
    driver: createBoundSqliteDriver(() => db),
    dbName: ':memory:',
    allowGlobalContext: options.allowGlobalContext ?? true,
    discovery: { warnWhenNoEntities: false },
  });
  return {
    orm,
    em: orm.em,
    repo: (entity) => orm.em.getRepository(entity),
    clear: () => orm.em.clear(),
    close: async () => {
      // The `force` flag is irrelevant here — MikroORM's connection.close()
      // always destroys its Kysely client either way. It's the driver's
      // `destroy()` being a no-op (see the docstring above) that keeps the
      // handle open, not this call site.
      await orm.close(false);
    },
  };
}

/**
 * `MikroOrmModule.forRoot`, bound to a suite's own better-sqlite3 handle the
 * same way `createTestOrm` is, for the partial `Test.createTestingModule`
 * e2e harnesses (`imports: [DatabaseModule, RealtimeModule, SomeModule]`)
 * that don't go through `buildApp()`.
 *
 * `buildApp()` always registers `MikroOrmModule.forRoot` (D5), so any domain
 * module that uses `@InjectRepository`/`MikroOrmModule.forFeature` needs an
 * `EntityManager` provider in the graph to resolve at all — a partial harness
 * that composes such a module without this fails Nest's DI at `compile()`,
 * not at the assertion. `allowGlobalContext` is left at its production
 * default (`false`): these are real HTTP requests through
 * `createNestApplication()`, so `registerRequestContext` (the NestJS
 * integration's default) forks a context-resolving EntityManager per request
 * — no test-only global context needed here.
 *
 * Built from `src/mikro-orm.config.ts` (spread, then overridden only on
 * `driver`/`dbName`/`discovery`) rather than a hand-rolled options object, so
 * this stays in lockstep with production instead of being a second copy of
 * the config that can silently drift.
 *
 * UPLOADS-P16 (Phase 1 ledger, entries 102–103): this is the one place the
 * harness and production provide the per-request fork differently, on
 * purpose. The `@mikro-orm/nestjs` auto middleware behind
 * `registerRequestContext` was the root cause of UPLOADS-P16 (its Nest-11
 * `{*all}` route throws on a malformed `%`-encoded path before any TREK
 * handler runs), so `buildApp()` turns it off in `app.module.ts` and mounts
 * a pathless `withRequestContext` middleware (`mikroOrmRequestContext`,
 * bootstrap.ts) instead. A partial harness has no bootstrap.ts to mount
 * that middleware, so it keeps the module default, which forks the same
 * per-request EntityManager for every well-formed path these suites send.
 * The malformed-escape case itself is only reachable through `buildApp()`
 * and is covered there (uploads-static.test.ts, UPLOADS-P16).
 */
// The spread also carries production's `extensions` (Migrator, SeedManager),
// `migrations` and `seeder` settings into the harness; only the driver, the
// database name, the entity list and discovery noise are overridden.
export function createTestMikroOrmModule(db: Database.Database): DynamicModule | Promise<DynamicModule> {
  return MikroOrmModule.forRoot({
    ...mikroOrmConfig,
    entities: [...ALL_ENTITIES],
    driver: createBoundSqliteDriver(() => db),
    dbName: ':memory:',
    discovery: { warnWhenNoEntities: false },
  });
}
