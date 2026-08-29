import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { SettingsModule } from '../settings/settings.module';
import { StorageModule } from '../storage/storage.module';
import { TripShareController, SharedController } from './share.controller';
import { ShareMcp } from './share.mcp';
import { ShareService } from './share.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    McpSharedModule,
    SettingsModule,
    PermissionsModule,
    QueryHelpersModule,
    AuthModule,
    PlacePhotosModule,
    StorageModule,
  ],
  controllers: [TripShareController, SharedController],
  providers: [ShareService, ShareMcp],
})
export class ShareModule {}
