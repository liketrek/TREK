import { Module } from '@nestjs/common';
import { CollabController } from './collab.controller';
import { CollabService } from './collab.service';
import { CollabMcp } from './collab.mcp';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PermissionsModule, AuthModule],
  controllers: [CollabController],
  providers: [CollabService, CollabMcp],
  // For in-container consumers (PluginHostDepsFactory).
  exports: [CollabService],
})
export class CollabModule {}
