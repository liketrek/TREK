import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { FeedsPublicController, TripFeedTokenController, UserFeedTokenController } from './feeds.controller';

@Module({
  controllers: [FeedsPublicController, TripFeedTokenController, UserFeedTokenController],
  providers: [FeedsService],
})
export class FeedsModule {}
