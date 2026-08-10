import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesDownloadController } from './files-download.controller';
import { FilesService } from './files.service';
import { FilesRpc } from './files.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { EphemeralTokenModule } from '../auth/ephemeral-token.module';
import { MulterModule } from '@nestjs/platform-express';
import { AllowedFileTypesModule } from './allowed-file-types.module';
import { AllowedFileTypesService } from './allowed-file-types.service';
import { buildFilesUploadOptions } from './files.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [AllowedFileTypesModule],
      inject: [AllowedFileTypesService],
      useFactory: (allowedTypes: AllowedFileTypesService) => buildFilesUploadOptions(allowedTypes),
    }),
    EphemeralTokenModule, PermissionsModule, AppConfigModule, RealtimeModule, PluginGuardsModule],
  controllers: [FilesController, FilesDownloadController],
  providers: [FilesService, FilesRpc],
  exports: [FilesService],
})
export class FilesModule {}
