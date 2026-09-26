import { Module } from '@nestjs/common';
import { JourneyController } from './journey.controller';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyService } from './journey.service';
import { JourneyBookService } from './journey-book.service';
import { AddonsModule } from '../addons/addons.module';
import { MemoriesModule } from '../memories/memories.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyPhotoCaptureModule } from './journey-photo-capture.module';
import { JourneyMcp } from './journey.mcp';
import { AuthModule } from '../auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { AllowedFileTypesService } from '../files/allowed-file-types.service';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { journeyImageFileFilter, journeyUploadFilename } from './journey.controller';

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
    AuthModule, AddonsModule, MemoriesModule, JourneyDomainModule, JourneyPhotoCaptureModule],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService, JourneyBookService, JourneyMcp],
})
export class JourneyModule {}
