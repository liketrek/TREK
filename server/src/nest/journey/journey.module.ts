import { Module } from '@nestjs/common';
import { JourneyController } from './journey.controller';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyService } from './journey.service';
import { JourneyBookService } from './journey-book.service';
import { AddonsModule } from '../addons/addons.module';
import { MemoriesModule } from '../memories/memories.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyMcp } from './journey.mcp';
import { AuthModule } from '../auth/auth.module';
import { MulterModule } from '@nestjs/platform-express';
import { AllowedFileTypesModule } from '../files/allowed-file-types.module';
import { AllowedFileTypesService } from '../files/allowed-file-types.service';
import { buildJourneyImageUploadOptions } from './journey.controller';

@Module({
  // MemoriesModule: the journey gallery streams provider assets and uploads to Immich.
  imports: [
    MulterModule.registerAsync({
      imports: [AllowedFileTypesModule],
      inject: [AllowedFileTypesService],
      useFactory: (allowedTypes: AllowedFileTypesService) => buildJourneyImageUploadOptions(allowedTypes),
    }),
    AuthModule, AddonsModule, MemoriesModule, JourneyDomainModule],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService, JourneyBookService, JourneyMcp],
})
export class JourneyModule {}
