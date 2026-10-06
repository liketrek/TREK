import { JourneyBooks } from '../../db/entities/JourneyBooks.entity';
import { Users } from '../../db/entities/Users.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { AllowedFileTypesService } from '../files/allowed-file-types.service';
import { MemoriesModule } from '../memories/memories.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { JourneyBookService } from './journey-book.service';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyPhotoCaptureModule } from './journey-photo-capture.module';
import { JourneyPublicController } from './journey-public.controller';
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
    AuthModule,
    AddonsModule,
    MemoriesModule,
    JourneyDomainModule,
    JourneyPhotoCaptureModule,
    // Plan 3g Task 3: `JourneyService` (JV1, `UsersRepository.getImmichAutoUpload`)
    // and `JourneyBookService` (JB1-JB7, `JourneyBooksRepository`) both
    // constructed HERE — `@InjectRepository` resolves from this module's own
    // `forFeature` graph, not from `AuthModule`'s (which registers `Users`
    // for its own providers only, per that module's own docstring).
    MikroOrmModule.forFeature([Users, JourneyBooks]),
  ],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService, JourneyBookService, JourneyMcp],
})
export class JourneyModule {}
