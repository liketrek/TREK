import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesDownloadController } from './files-download.controller';
import { FilesService } from './files.service';
import { FilesRpc } from './files.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AppConfigModule } from '../app-config/app-config.module';

@Module({
  imports: [PermissionsModule, AppConfigModule, RealtimeModule, PluginGuardsModule],
  controllers: [FilesController, FilesDownloadController],
  providers: [FilesService, FilesRpc],
  exports: [FilesService],
})
export class FilesModule {}
