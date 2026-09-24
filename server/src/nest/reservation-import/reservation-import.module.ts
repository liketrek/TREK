import { Module } from '@nestjs/common';
import { ReservationImportController } from './reservation-import.controller';
import { ReservationImportMcp } from './reservation-import.mcp';
import { BookingImportModule } from '../booking-import/booking-import.module';
import { AirtrailModule } from '../integrations/airtrail.module';
import { AddonsModule } from '../addons/addons.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuthModule } from '../auth/auth.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';

/**
 * The one route prefix that turns something external into reservations.
 *
 * It owns the controller and nothing else: the file-upload pipeline stays in
 * booking-import/ and the AirTrail pipeline in integrations/, because those are
 * where their own domains live. What moved here is the HTTP surface they were
 * both declaring separately. ReservationImportMcp is the second surface over
 * the same prefix, so it lives with the controller for the same reason.
 *
 * AuthModule and McpSharedModule are the tool's demo check and its
 * permission/broadcast guards; neither is @Global, so both are named here.
 */
@Module({
  imports: [BookingImportModule, AirtrailModule, AddonsModule, PermissionsModule, AuthModule, McpSharedModule],
  controllers: [ReservationImportController],
  providers: [ReservationImportMcp],
})
export class ReservationImportModule {}
