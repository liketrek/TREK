import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { BudgetModule } from '../budget/budget.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembersController } from './trip-members.controller';
import { TripMembersService } from './trip-members.service';
import { Module } from '@nestjs/common';

/**
 * The member/guest roster of a trip.
 *
 * A sink module: it imports auth (for the plugin-data erasure a deleted guest
 * triggers) and budget (for the expense re-split that goes with it), and nothing
 * imports it back except trips. That is what keeps it legal — trip-membership/
 * next door cannot do the same, because AuthModule imports *that* one, so giving
 * it these dependencies would close the cycle.
 */
@Module({
  imports: [
    NotificationsModule,
    DatabaseModule,
    PermissionsModule,
    RealtimeModule,
    AuditModule,
    AuthModule,
    BudgetModule,
  ],
  controllers: [TripMembersController],
  providers: [TripMembersService],
  exports: [TripMembersService],
})
export class TripMembersModule {}
