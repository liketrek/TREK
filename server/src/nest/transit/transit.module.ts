import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import { AppConfigModule } from '../app-config/app-config.module';
import { RateLimitModule } from '../common/rate-limit.module';
import { DaysModule } from '../days/days.module';
import { GoogleQuotaModule } from '../google-quota/google-quota.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { GoogleTransitProvider } from './google-transit.provider';
import { TransitController } from './transit.controller';
import { TransitMcp } from './transit.mcp';
import { TransitService } from './transit.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Transit domain (#1065) — the Transitous/MOTIS proxy, with the optional
 * Google backend (#1699) behind it. TransitMcp carries the
 * decorator-registered MCP tools; DaysModule/ReservationsModule feed
 * create_transit_journey. Exports TransitService for in-container consumers.
 * AppConfigModule provides the transitConfig token (TRANSIT_API_URL) that
 * TransitService injects.
 *
 * MikroOrmModule.forFeature([AppSettings, Users, Trips]): GoogleTransitProvider
 * passes its own AppSettingsRepository/UsersRepository to
 * instance-api-keys.ts's resolveApiKey (Plan 3a Task 5) and, since Plan 4
 * Task 1, to `transit-provider.ts`'s `readTransitProvider`/
 * `writeTransitProvider` too — the SAME `AppSettingsRepository` this module
 * already registers. `transit.mcp.ts`'s own `canAccessTrip` delegate is now
 * `TripsRepository.findAccessible` directly (Plan 4 Task 2).
 */
@Module({
  // DaysModule + ReservationsModule: TransitMcp's create_transit_journey injects both.
  imports: [
    TripMembershipModule,
    AppConfigModule,
    McpSharedModule,
    RateLimitModule,
    DaysModule,
    ReservationsModule,
    MikroOrmModule.forFeature([AppSettings, Users, Trips]),
    GoogleQuotaModule,
  ],
  controllers: [TransitController],
  providers: [TransitService, TransitMcp, GoogleTransitProvider],
  exports: [TransitService],
})
export class TransitModule {}
