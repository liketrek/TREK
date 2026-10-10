import { UnitOfWork } from './unit-of-work';
import { Global, Module } from '@nestjs/common';

/**
 * The ORM-side container module: the home of providers that depend on MikroORM
 * itself rather than on the raw better-sqlite3 handle `DatabaseModule` owns.
 *
 * Deliberately separate from `DatabaseModule`, which the e2e suites that
 * compose `DatabaseModule` without the ORM build standalone
 * (`Test.createTestingModule({ imports: [DatabaseModule, ...] })`)
 * with no ORM in the container: a provider there that injects the core
 * `EntityManager` fails every one of them at `compile()`, because Nest
 * instantiates providers eagerly. Nothing is imported here — the
 * `EntityManager` token comes from `MikroOrmModule.forRoot`, whose
 * `MikroOrmCoreModule` is itself `@Global()`.
 */
@Global()
@Module({ providers: [UnitOfWork], exports: [UnitOfWork] })
export class OrmModule {}
