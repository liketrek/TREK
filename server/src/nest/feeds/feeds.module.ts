import { Module } from '@nestjs/common';
import { AppConfigModule } from '../app-config/app-config.module';
import { CalendarModule } from '../calendar/calendar.module';
import { DatabaseModule } from '../database/database.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { FeedsService } from './feeds.service';
import { FeedsMcp } from './feeds.mcp';
import { FeedsPublicController, TripFeedTokenController, UserFeedTokenController } from './feeds.controller';

@Module({
  // Calendars, not the trip aggregate: feeds only ever needed an ICS string, and
  // importing TripsModule for it pulled budget, packing, places and the rest in.
  // Permissions comes in for TripAccessGuard, which gates the trip feed token.
  // The last three are FeedsMcp's: McpSharedModule for the RBAC check the route
  // gets from its guard, AppConfigModule and RealtimeModule because a module
  // graph assembled without AppModule (the e2e harnesses) has to instantiate
  // those two @Global modules itself before anything can inject out of them.
  imports: [CalendarModule, DatabaseModule, PermissionsModule, McpSharedModule, AppConfigModule, RealtimeModule],
  controllers: [FeedsPublicController, TripFeedTokenController, UserFeedTokenController],
  providers: [FeedsService, FeedsMcp],
})
export class FeedsModule {}
