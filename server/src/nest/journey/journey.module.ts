import { Module } from '@nestjs/common';
import { JourneyController } from './journey.controller';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyService } from './journey.service';
import { AddonsModule } from '../addons/addons.module';
import { MemoriesModule } from '../memories/memories.module';

@Module({
  // MemoriesModule: the journey gallery streams provider assets and uploads to Immich.
  imports: [AddonsModule, MemoriesModule],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService],
})
export class JourneyModule {}
