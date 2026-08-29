import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { CollabController, collabNoteFileFilter, MAX_NOTE_FILE_SIZE } from './collab.controller';
import { CollabMcp } from './collab.mcp';
import { CollabRpc } from './collab.rpc';
import { CollabService } from './collab.service';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [StorageModule],
      inject: [StorageService],
      useFactory: (storage: StorageService) =>
        buildStorageUploadOptions(storage, {
          category: 'files',
          maxSize: MAX_NOTE_FILE_SIZE,
          defParamCharset: 'utf8', // parity with legacy routes/collab.ts — preserve non-ASCII original filenames
          fileFilter: collabNoteFileFilter,
        }),
    }),
    StorageModule,
    McpSharedModule,
    NotificationsModule,
    PermissionsModule,
    AuthModule,
    RealtimeModule,
    PluginGuardsModule,
    AddonsModule,
    RateLimitModule,
  ],
  controllers: [CollabController],
  providers: [CollabService, CollabMcp, CollabRpc],
  // For in-container consumers (CollabRpc).
  exports: [CollabService],
})
export class CollabModule {}
