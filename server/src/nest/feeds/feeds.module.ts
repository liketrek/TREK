import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { DatabaseModule } from '../database/database.module';
import { FeedsService } from './feeds.service';
import { FeedsPublicController, TripFeedTokenController, UserFeedTokenController } from './feeds.controller';

@Module({
  // Calendars, not the trip aggregate: feeds only ever needed an ICS string, and
  // importing TripsModule for it pulled budget, packing, places and the rest in.
  imports: [CalendarModule, DatabaseModule],
  controllers: [FeedsPublicController, TripFeedTokenController, UserFeedTokenController],
  providers: [FeedsService],
})
export class FeedsModule {}
