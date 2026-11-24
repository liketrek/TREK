import { FlightLiveStates } from '../../db/entities/FlightLiveStates.entity';
import { AirportsModule } from '../airports/airports.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SettingsModule } from '../settings/settings.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { FlightLivePollService } from './flight-live-poll.service';
import { FlightLiveController } from './flight-live.controller';
import { FlightLiveFeedService } from './flight-live.feeds';
import { FlightLiveJob } from './flight-live.job';
import { FlightLiveMcp } from './flight-live.mcp';
import { FlightLiveService } from './flight-live.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Live flight status (flight-live): where a booked flight is, from the keyless
 * ADS-B feeds. The REST read and its MCP twin, the minute poll on the
 * scheduler, and the notices when a flight departs, lands or runs late.
 * Registered in AppModule.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([FlightLiveStates]),
    AppConfigModule,
    AirportsModule,
    NotificationsModule,
    PermissionsModule,
    SchedulingModule,
    SettingsModule,
    TripMembershipModule,
  ],
  controllers: [FlightLiveController],
  providers: [FlightLiveService, FlightLivePollService, FlightLiveFeedService, FlightLiveJob, FlightLiveMcp],
})
export class FlightLiveModule {}
