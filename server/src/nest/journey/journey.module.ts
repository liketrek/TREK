import { Module } from '@nestjs/common';
import { JourneyController } from './journey.controller';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyService } from './journey.service';
import { JourneyAddonGuard } from './journey-addon.guard';

@Module({
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService, JourneyAddonGuard],
})
export class JourneyModule {}
