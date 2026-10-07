import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { CalendarModule } from '../calendar/calendar.module';
import { DemoModule } from '../common/demo.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { FeedsPublicController, TripFeedTokenController, UserFeedTokenController } from './feeds.controller';
import { FeedsMcp } from './feeds.mcp';
import { FeedsService } from './feeds.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

@Module({
  // Calendars, not the trip aggregate: feeds only ever needed an ICS string, and
  // importing TripsModule for it pulled budget, packing, places and the rest in.
  // Permissions comes in for TripAccessGuard, which gates the trip feed token.
  // `MikroOrmModule.forFeature([Trips, Users])` registers `TripsRepository`/
  // `UsersRepository` for `FeedsService`'s `@InjectRepository` constructor
  // params (Plan 3d Task 5, FD1–FD11) — the same forFeature + `@InjectRepository`
  // wiring `days.module.ts` documents. The last four are FeedsMcp's:
  // McpSharedModule for the RBAC check the route gets from its guard,
  // AppConfigModule, RealtimeModule and DemoModule because a module graph
  // assembled without AppModule (the e2e harnesses) has to instantiate those
  // @Global modules itself before anything can inject out of them (DemoModule
  // added Plan 3i Task 4 fix wave — FeedsMcp injects DemoService).
  imports: [
    CalendarModule,
    PermissionsModule,
    McpSharedModule,
    AppConfigModule,
    RealtimeModule,
    DemoModule,
    MikroOrmModule.forFeature([Trips, Users]),
  ],
  controllers: [FeedsPublicController, TripFeedTokenController, UserFeedTokenController],
  providers: [FeedsService, FeedsMcp],
})
export class FeedsModule {}
