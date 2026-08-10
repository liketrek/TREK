import { Module } from '@nestjs/common';
import { ReservationImportController } from './reservation-import.controller';
import { BookingImportModule } from '../booking-import/booking-import.module';
import { AirtrailModule } from '../integrations/airtrail.module';
import { AddonsModule } from '../addons/addons.module';
import { PermissionsModule } from '../permissions/permissions.module';

/**
 * The one route prefix that turns something external into reservations.
 *
 * It owns the controller and nothing else: the file-upload pipeline stays in
 * booking-import/ and the AirTrail pipeline in integrations/, because those are
 * where their own domains live. What moved here is the HTTP surface they were
 * both declaring separately.
 */
@Module({
  imports: [BookingImportModule, AirtrailModule, AddonsModule, PermissionsModule],
  controllers: [ReservationImportController],
})
export class ReservationImportModule {}
