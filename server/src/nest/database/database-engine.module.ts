import { readEnv, type DbSettings } from '../../app-config';
import { resolveEngine, type DatabaseEngine } from '../../db/engine';
import { Module } from '@nestjs/common';

/** `readEnv().db`, read once per container: what decides which engine runs and its settings. */
export const DATABASE_SETTINGS = Symbol('DATABASE_SETTINGS');

/**
 * The one `DatabaseEngine` of this process. Every injector (the lifecycle, the
 * unit of work, the backup port and its adapters) gets this instance, so the
 * state an engine keeps (Postgres's reopen hook) is the same wherever it is used.
 */
export const DATABASE_ENGINE = Symbol('DATABASE_ENGINE');

/**
 * Provides the engine and its settings. Not global: each module that needs
 * the engine imports it, and Nest keeps one instance per container.
 */
@Module({
  providers: [
    { provide: DATABASE_SETTINGS, useFactory: (): DbSettings => readEnv().db },
    {
      provide: DATABASE_ENGINE,
      useFactory: (db: DbSettings): DatabaseEngine => resolveEngine(db),
      inject: [DATABASE_SETTINGS],
    },
  ],
  exports: [DATABASE_SETTINGS, DATABASE_ENGINE],
})
export class DatabaseEngineModule {}
