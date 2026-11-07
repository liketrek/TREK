import { SqliteMaintenance } from '../../db/engine/sqlite/sqlite-maintenance';
import { MaintenanceRepository } from '../../db/repositories/MaintenanceRepository';
import { EntityManager } from '@mikro-orm/core';
import { Module } from '@nestjs/common';

/**
 * Provides `MaintenanceRepository`, the home of the few whole-database
 * statements no entity can express (the readiness ping, the plugin-table
 * erasure), and `SqliteMaintenance`, the SQLite file's own (the WAL
 * checkpoint, `VACUUM INTO`).
 *
 * Factories over the context-resolving global `EntityManager`, the same one
 * Nest injects into every service, so each resolves the request or
 * transaction fork that is active when a method runs. The class itself stays
 * free of Nest, like every other file under `db/`.
 */
@Module({
  providers: [
    {
      provide: MaintenanceRepository,
      useFactory: (em: EntityManager) => new MaintenanceRepository(em),
      inject: [EntityManager],
    },
    {
      provide: SqliteMaintenance,
      useFactory: (em: EntityManager) => new SqliteMaintenance(em),
      inject: [EntityManager],
    },
  ],
  exports: [MaintenanceRepository, SqliteMaintenance],
})
export class MaintenanceModule {}
