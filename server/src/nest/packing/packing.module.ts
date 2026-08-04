import { Module } from '@nestjs/common';
import { PackingController } from './packing.controller';
import { PackingMcp } from './packing.mcp';
import { PackingService } from './packing.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

/** Packing domain (S2 — Phase 2 trip sub-domain). Registered in AppModule.
 *  Exports PackingService for in-container consumers (TripsService bundle,
 *  PluginHostDepsFactory). */
@Module({
  imports: [PermissionsModule, AuthModule],
  controllers: [PackingController],
  providers: [PackingService, PackingMcp],
  exports: [PackingService],
})
export class PackingModule {}
