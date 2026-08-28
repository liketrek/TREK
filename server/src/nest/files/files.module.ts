import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesDownloadController } from './files-download.controller';
import { FilesService } from './files.service';
import { FilesRpc } from './files.rpc';
import { FilesMcp } from './files.mcp';
import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { EphemeralTokenModule } from '../auth/ephemeral-token.module';
import { MulterModule } from '@nestjs/platform-express';
import { AllowedFileTypesModule } from './allowed-file-types.module';
import { AllowedFileTypesService } from './allowed-file-types.service';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { filesUploadFileFilter } from './files.controller';
import { MAX_VIDEO_SIZE } from './files.constants';

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
    // AuthModule + McpSharedModule feed FilesMcp's demo and RBAC guards. Neither is
    // @Global, and AuthModule reaches this domain only through the leaf
    // AllowedFileTypesModule, so importing it here stays cycle-free.
    EphemeralTokenModule, PermissionsModule, AppConfigModule, RealtimeModule, PluginGuardsModule, AuthModule, McpSharedModule],
  controllers: [FilesController, FilesDownloadController],
  providers: [FilesService, FilesRpc, FilesMcp],
  exports: [FilesService],
})
export class FilesModule {}
