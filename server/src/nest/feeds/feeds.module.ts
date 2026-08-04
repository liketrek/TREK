import { Module } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { FeedsService } from './feeds.service';
import { FeedsPublicController, TripFeedTokenController, UserFeedTokenController } from './feeds.controller';

@Module({
  imports: [TripsModule],
  controllers: [FeedsPublicController, TripFeedTokenController, UserFeedTokenController],
  providers: [FeedsService],
})
export class FeedsModule {}
