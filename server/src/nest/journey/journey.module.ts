import { Module } from '@nestjs/common';
import { JourneyController } from './journey.controller';
import { JourneyPublicController } from './journey-public.controller';
import { JourneyService } from './journey.service';
import { AddonsModule } from '../addons/addons.module';

@Module({
  imports: [AddonsModule],
  controllers: [JourneyController, JourneyPublicController],
  providers: [JourneyService],
})
export class JourneyModule {}
