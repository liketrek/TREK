import { Module } from '@nestjs/common';
import { PackingController } from './packing.controller';
import { AdminPackingTemplatesController } from './admin-packing-templates.controller';
import { PackingMcp } from './packing.mcp';
import { PackingService } from './packing.service';
import { PackingRpc } from './packing.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AddonsModule } from '../addons/addons.module';

/** Packing domain (S2 — Phase 2 trip sub-domain). Registered in AppModule.
 *  Exports PackingService for in-container consumers (TripsService bundle,
 *  PackingRpc). */
@Module({
  imports: [PermissionsModule, AuthModule, RealtimeModule, PluginGuardsModule, AddonsModule, AuditModule],
  controllers: [PackingController, AdminPackingTemplatesController],
  providers: [PackingService, PackingMcp, PackingRpc],
  exports: [PackingService],
})
export class PackingModule {}
