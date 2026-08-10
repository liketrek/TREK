import { Module } from '@nestjs/common';
import { JourneyController } from './journey.controller';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyService } from './journey.service';
import { AddonsModule } from '../addons/addons.module';
import { MemoriesModule } from '../memories/memories.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyMcp } from './journey.mcp';

@Module({
  // MemoriesModule: the journey gallery streams provider assets and uploads to Immich.
  imports: [AddonsModule, MemoriesModule, JourneyDomainModule],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService, JourneyMcp],
})
export class JourneyModule {}
