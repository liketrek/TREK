import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
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
import { MAX_FILE_SIZE, MAX_VIDEO_SIZE } from './files.constants';
import { TripFiles } from '../../db/entities/TripFiles.entity';
import { FileLinks } from '../../db/entities/FileLinks.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { Places } from '../../db/entities/Places.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { Users } from '../../db/entities/Users.entity';
import { Trips } from '../../db/entities/Trips.entity';

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
          // An operator may raise the document limit past the video cap.
          maxSize: Math.max(MAX_VIDEO_SIZE, MAX_FILE_SIZE),
          defParamCharset: 'utf8', // parity with legacy routes/files.ts — preserve non-ASCII original filenames
          fileFilter: filesUploadFileFilter(allowedTypes),
        }),
    }),
    StorageModule,
    // TripFiles/FileLinks are this domain's own tables (Plan 3e Task 1).
    // Reservations/Places/DayAssignments/BudgetItems/Users are owned
    // elsewhere — registered here only for `findForeignLinkTarget`'s
    // `findTripId` reads and FL28's `UsersRepository.getEmail` (the entity
    // classes only, never the owning module — the `AccommodationsDomainModule`
    // precedent).
    MikroOrmModule.forFeature([TripFiles, FileLinks, Reservations, Places, DayAssignments, BudgetItems, Users, Trips]),
    // AuthModule + McpSharedModule feed FilesMcp's demo and RBAC guards. Neither is
    // @Global, and AuthModule reaches this domain only through the leaf
    // AllowedFileTypesModule, so importing it here stays cycle-free.
    EphemeralTokenModule, PermissionsModule, AppConfigModule, RealtimeModule, PluginGuardsModule, AuthModule, McpSharedModule,
    // FilesMcp's upload tool checks the same extension list as the multipart filter.
    AllowedFileTypesModule],
  controllers: [FilesController, FilesDownloadController],
  providers: [FilesService, FilesRpc, FilesMcp],
  exports: [FilesService],
})
export class FilesModule {}
