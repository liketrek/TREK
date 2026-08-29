import { AppConfigModule } from '../app-config/app-config.module';
import { EphemeralTokenModule } from '../auth/ephemeral-token.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { AllowedFileTypesModule } from './allowed-file-types.module';
import { AllowedFileTypesService } from './allowed-file-types.service';
import { FilesDownloadController } from './files-download.controller';
import { MAX_VIDEO_SIZE } from './files.constants';
import { FilesController } from './files.controller';
import { filesUploadFileFilter } from './files.controller';
import { FilesRpc } from './files.rpc';
import { FilesService } from './files.service';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [StorageModule, AllowedFileTypesModule],
      inject: [StorageService, AllowedFileTypesService],
      useFactory: (storage: StorageService, allowedTypes: AllowedFileTypesService) =>
        buildStorageUploadOptions(storage, {
          category: 'files',
          // Allow up to the video cap; non-video files are still held to
          // MAX_FILE_SIZE by the per-type guard in the upload handler (#823).
          maxSize: MAX_VIDEO_SIZE,
          defParamCharset: 'utf8', // parity with legacy routes/files.ts — preserve non-ASCII original filenames
          fileFilter: filesUploadFileFilter(allowedTypes),
        }),
    }),
    StorageModule,
    EphemeralTokenModule,
    PermissionsModule,
    AppConfigModule,
    RealtimeModule,
    PluginGuardsModule,
  ],
  controllers: [FilesController, FilesDownloadController],
  providers: [FilesService, FilesRpc],
  exports: [FilesService],
})
export class FilesModule {}
