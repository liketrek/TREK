import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { TripAccessService } from './trip-access.service';
import { TripMembershipService } from './trip-membership.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/** Trip membership joins. No controller of its own — the HTTP surface lives with
 *  auth, oidc and trip-invite, which all import this for the join itself. Kept
 *  separate so those three (plus the plugin host) share one implementation
 *  without AuthModule and TripInviteModule importing each other.
 *
 *  MikroOrmModule.forFeature([Trips, TripMembers]) only — NO service import
 *  (Plan 3c Task 1 ruling): five modules import THIS module, so a new service
 *  import here would close a cycle. `EntityManager`/repository resolution
 *  comes entirely from the ORM's own `@Global()` core module + this
 *  `forFeature` registration, keeping this module a leaf.
 *
 *  TripAccessService is the trip-visibility read every other domain asks
 *  instead of injecting TripsRepository for it. */
@Module({
  imports: [MikroOrmModule.forFeature([Trips, TripMembers])],
  providers: [TripMembershipService, TripAccessService],
  exports: [TripMembershipService, TripAccessService],
})
export class TripMembershipModule {}
