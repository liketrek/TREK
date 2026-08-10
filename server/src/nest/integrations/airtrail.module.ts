import { Module } from '@nestjs/common';
import { AirtrailController } from './airtrail.controller';
import { AirtrailImportController } from './airtrail-import.controller';
import { AirtrailClient } from './airtrail.client';
import { AirtrailService } from './airtrail.service';
import { AirtrailSyncService } from './airtrail-sync.service';
import { AirtrailImportService } from './airtrail-import.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { ReservationsModule } from '../reservations/reservations.module';

/**
 * AirTrail integration domain. The connection lives under
 * /api/integrations/airtrail; the flight import is trip-scoped under
 * /api/trips/:tripId/reservations/import/airtrail.
 *
 * The logic used to be plain functions over the better-sqlite3 singleton in
 * services/airtrail/*, the last thing left in that directory. It is four
 * providers now: the HTTP client, the credential/settings service, the two-way
 * sync and the importer.
 *
 * It imports ReservationsModule because the pull applies remote changes through
 * the real reservation update path. The trigger in the other direction stays a
 * seam on purpose - see airtrail.bridge.ts.
 */
@Module({
  imports: [PermissionsModule, AddonsModule, AuditModule, ReservationsModule],
  controllers: [AirtrailController, AirtrailImportController],
  providers: [AirtrailClient, AirtrailService, AirtrailSyncService, AirtrailImportService],
  exports: [AirtrailSyncService],
})
export class AirtrailModule {}
