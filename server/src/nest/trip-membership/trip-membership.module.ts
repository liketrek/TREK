import { Module } from '@nestjs/common';
import { TripMembershipService } from './trip-membership.service';

/** Trip membership joins. No controller of its own — the HTTP surface lives with
 *  auth, oidc and trip-invite, which all import this for the join itself. Kept
 *  separate so those three (plus the plugin host) share one implementation
 *  without AuthModule and TripInviteModule importing each other. */
@Module({
  providers: [TripMembershipService],
  exports: [TripMembershipService],
})
export class TripMembershipModule {}
