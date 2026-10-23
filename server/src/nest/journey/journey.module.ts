import { Users } from '../../db/entities/Users.entity';
import { AddonsModule } from '../addons/addons.module';
import { UserConnectionRepositoriesModule } from '../database/user-connection-repositories.module';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { AllowedFileTypesService } from '../files/allowed-file-types.service';
import { MemoriesModule } from '../memories/memories.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { JourneyBookDesignModule } from './journey-book-design.module';
import { JourneyBookModule } from './journey-book.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyMapController } from './journey-map.controller';
import { JourneyMapMcp } from './journey-map.mcp';
import { JourneyPhotoCaptureModule } from './journey-photo-capture.module';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyTracksMcp } from './journey-tracks.mcp';
import { JourneyController } from './journey.controller';
import { journeyImageFileFilter, journeyUploadFilename } from './journey.controller';
import { JourneyMcp } from './journey.mcp';
import { JourneyService } from './journey.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  // MemoriesModule: the journey gallery streams provider assets and uploads to Immich.
  imports: [
    MulterModule.registerAsync({
      imports: [StorageModule, AllowedFileTypesModule],
      inject: [StorageService, AllowedFileTypesService],
      // NO defParamCharset here — deliberate, documented asymmetry with the
      // trip-file options (see journey.controller.ts).
      useFactory: (storage: StorageService, allowedTypes: AllowedFileTypesService) =>
        buildStorageUploadOptions(storage, {
          category: 'journey',
          maxSize: 20 * 1024 * 1024,
          fileFilter: journeyImageFileFilter(allowedTypes),
          filename: journeyUploadFilename,
        }),
    }),
    StorageModule,
    AddonsModule,
    MemoriesModule,
    JourneyDomainModule,
    JourneyPhotoCaptureModule,
    // The Studio book: its service (the book routes below) and its MCP tools.
    JourneyBookModule,
    // The assistant's whole-book design: its tools, its draft routes and the apply.
    JourneyBookDesignModule,
    // JourneyService's JV1 read (`UserImmichRepository.getImmichAutoUpload`).
    UserConnectionRepositoriesModule,
    // Plan 3g Task 3: `JourneyService` (JV1, now through the module above)
    // constructed HERE — `@InjectRepository` resolves from this module's own
    // `forFeature` graph, not from `AuthModule`'s (which registers `Users`
    // for its own providers only, per that module's own docstring). The
    // book's repository moved with `JourneyBookService` to JourneyBookModule.
    MikroOrmModule.forFeature([Users]),
  ],
  controllers: [JourneyController, JourneyMapController, JourneyPublicController],
  providers: [JourneyService, JourneyMcp, JourneyMapMcp, JourneyTracksMcp],
})
export class JourneyModule {}
