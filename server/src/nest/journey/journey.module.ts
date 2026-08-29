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
import { JourneyPublicController } from './journey-public.controller';
import { JourneyController } from './journey.controller';
import { journeyImageFileFilter, journeyUploadFilename } from './journey.controller';
import { JourneyMcp } from './journey.mcp';
import { JourneyService } from './journey.service';
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
  ],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService, JourneyBookService, JourneyMcp],
})
export class JourneyModule {}
