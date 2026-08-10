import { Module } from '@nestjs/common';
import { CollabController } from './collab.controller';
import { CollabService } from './collab.service';
import { CollabRpc } from './collab.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CollabMcp } from './collab.mcp';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { AddonsModule } from '../addons/addons.module';

@Module({
  imports: [PermissionsModule, AuthModule, RealtimeModule, PluginGuardsModule, AddonsModule],
  controllers: [CollabController],
  providers: [CollabService, CollabMcp, CollabRpc],
  // For in-container consumers (CollabRpc).
  exports: [CollabService],
})
export class CollabModule {}
