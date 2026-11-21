import { DatabaseEngineModule } from './database-engine.module';
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
 * instantiates providers eagerly. The `EntityManager` token comes from
 * `MikroOrmModule.forRoot`, whose
 * `MikroOrmCoreModule` is itself `@Global()`. It imports `DatabaseEngineModule`,
 * the engine the unit of work serializes its writes through.
 */
@Global()
@Module({ imports: [DatabaseEngineModule], providers: [UnitOfWork], exports: [UnitOfWork] })
export class OrmModule {}
