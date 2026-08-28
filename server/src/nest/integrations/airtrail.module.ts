import { Module } from '@nestjs/common';
import { AirtrailController } from './airtrail.controller';
import { AirtrailCoreModule } from './airtrail-core.module';
import { AirtrailSyncService } from './airtrail-sync.service';
import { AirtrailSyncJob } from './airtrail-sync.job';
import { AirtrailImportService } from './airtrail-import.service';
import { AirtrailMcp } from './airtrail.mcp';
import { SchedulingModule } from '../scheduling/scheduling.module';
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
 * services/airtrail/*, the last thing left in that directory. The client, the
 * credential/settings service and the link lifecycle (incl. the write-back
 * push) live in AirtrailCoreModule so ReservationsModule can inject them;
 * this module holds what genuinely needs ReservationsService — the pull
 * (remote changes apply through the real reservation update path), its cron
 * and the importer. That split is what retired airtrail.bridge.
 */
@Module({
  imports: [AirtrailCoreModule, PermissionsModule, AddonsModule, AuditModule, ReservationsModule, SchedulingModule],
  controllers: [AirtrailController],
  providers: [AirtrailSyncService, AirtrailSyncJob, AirtrailImportService, AirtrailMcp],
  exports: [AirtrailSyncService, AirtrailImportService],
})
export class AirtrailModule {}
