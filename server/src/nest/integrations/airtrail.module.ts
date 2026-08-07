import { Module } from '@nestjs/common';
import { AirtrailController } from './airtrail.controller';
import { AirtrailImportController } from './airtrail-import.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { AddonsModule } from '../addons/addons.module';

/**
 * AirTrail integration domain. The connection lives under
 * /api/integrations/airtrail; the flight import is trip-scoped under
 * /api/trips/:tripId/reservations/import/airtrail. Business logic lives in
 * services/airtrail/* (plain functions over better-sqlite3).
 */
@Module({
  imports: [PermissionsModule, AddonsModule],
  controllers: [AirtrailController, AirtrailImportController],
})
export class AirtrailModule {}
