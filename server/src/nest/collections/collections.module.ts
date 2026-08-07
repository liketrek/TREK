import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { AppConfigModule } from '../app-config/app-config.module';
import { CollectionsMcp } from './collections.mcp';
import { AddonsModule } from '../addons/addons.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';

/** Collections domain (saved-places library). Registered in AppModule.
 *  Exports CollectionsService for in-container consumers (PluginsModule's
 *  RPC host deps factory). */
@Module({
  imports: [AddonsModule, PermissionsModule, AuthModule, AppConfigModule],
  controllers: [CollectionsController],
  providers: [CollectionsService, CollectionsMcp],
  exports: [CollectionsService],
})
export class CollectionsModule {}
