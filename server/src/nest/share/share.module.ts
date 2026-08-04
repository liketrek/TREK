import { Module } from '@nestjs/common';
import { TripShareController, SharedController } from './share.controller';
import { ShareService } from './share.service';
import { ShareMcp } from './share.mcp';
import { SettingsModule } from '../settings/settings.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SettingsModule, PermissionsModule, AuthModule],
  controllers: [TripShareController, SharedController],
  providers: [ShareService, ShareMcp],
})
export class ShareModule {}
