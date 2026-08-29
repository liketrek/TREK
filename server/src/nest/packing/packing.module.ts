import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminPackingTemplatesController } from './admin-packing-templates.controller';
import { PackingController } from './packing.controller';
import { PackingMcp } from './packing.mcp';
import { PackingRpc } from './packing.rpc';
import { PackingService } from './packing.service';
import { Module } from '@nestjs/common';

/** Packing domain (S2 — Phase 2 trip sub-domain). Registered in AppModule.
 *  Exports PackingService for in-container consumers (TripsService bundle,
 *  PackingRpc). */
@Module({
  imports: [
    McpSharedModule,
    NotificationsModule,
    PermissionsModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
    AddonsModule,
    AuditModule,
  ],
  controllers: [PackingController, AdminPackingTemplatesController],
  providers: [PackingService, PackingMcp, PackingRpc],
  exports: [PackingService],
})
export class PackingModule {}
