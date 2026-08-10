import { Module } from '@nestjs/common';
import { JourneyController } from './journey.controller';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyService } from './journey.service';
import { AddonsModule } from '../addons/addons.module';
import { MemoriesModule } from '../memories/memories.module';
import { JourneyDomainModule } from './journey-domain.module';
import { JourneyMcp } from './journey.mcp';
import { AuthModule } from '../auth/auth.module';

@Module({
  // MemoriesModule: the journey gallery streams provider assets and uploads to Immich.
  imports: [AuthModule, AddonsModule, MemoriesModule, JourneyDomainModule],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService, JourneyMcp],
})
export class JourneyModule {}
