import { Module } from '@nestjs/common';
import { RoadtripController } from './roadtrip.controller';
import { RoadtripService } from './roadtrip.service';
import { RoadtripMcp } from './roadtrip.mcp';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

/** Road trip domain (#1797): the points a drive is routed through. Registered in AppModule. */
@Module({
  // McpShared brings the tool guards, Auth the demo check, Permissions the trip guard.
  imports: [McpSharedModule, PermissionsModule, AuthModule],
  controllers: [RoadtripController],
  providers: [RoadtripService, RoadtripMcp],
  exports: [RoadtripService],
})
export class RoadtripModule {}
