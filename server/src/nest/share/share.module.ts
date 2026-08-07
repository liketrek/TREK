import { Module } from '@nestjs/common';
import { TripShareController, SharedController } from './share.controller';
import { ShareService } from './share.service';
import { ShareMcp } from './share.mcp';
import { SettingsModule } from '../settings/settings.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SettingsModule, PermissionsModule, QueryHelpersModule, AuthModule],
  controllers: [TripShareController, SharedController],
  providers: [ShareService, ShareMcp],
})
export class ShareModule {}
