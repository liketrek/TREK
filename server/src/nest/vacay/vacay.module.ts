import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { VacayController } from './vacay.controller';
import { VacayMcp } from './vacay.mcp';
import { VacayRpc } from './vacay.rpc';
import { VacayService } from './vacay.service';
import { Module } from '@nestjs/common';

/**
 * Vacay addon domain (S1 — Phase 2 trip sub-domain). Registered in AppModule.
 * VacayService is exported for the plugin host surface (VacayRpc);
 * VacayMcp carries the DI-discovered MCP tools/resources.
 */
@Module({
  imports: [NotificationsModule, AuthModule, PluginGuardsModule, AddonsModule],
  controllers: [VacayController],
  providers: [VacayService, VacayMcp, VacayRpc],
  exports: [VacayService],
})
export class VacayModule {}
