import { MaintenanceRepository } from '../../db/repositories/MaintenanceRepository';
import { EntityManager } from '@mikro-orm/core';
import { Module } from '@nestjs/common';

/**
 * Provides `MaintenanceRepository`, the home of the few whole-database
 * statements no entity can express (the readiness ping, the WAL checkpoint,
 * `VACUUM INTO`, the plugin-table erasure).
 *
 * A factory over the context-resolving global `EntityManager`, the same one
 * Nest injects into every service, so the repository resolves the request or
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
  ],
  exports: [MaintenanceRepository],
})
export class MaintenanceModule {}
