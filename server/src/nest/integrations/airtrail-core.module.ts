import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ReservationsReadModule } from '../reservations/reservations-read.module';
import { AirtrailLinkService } from './airtrail-link.service';
import { AirtrailClient } from './airtrail.client';
import { AirtrailService } from './airtrail.service';
import { Module } from '@nestjs/common';

/**
 * The AirTrail pieces ReservationsModule may inject: the HTTP client, the
 * credential/settings service and the link lifecycle (incl. the write-back
 * trigger the reservations controller fires). Deliberately does NOT import
 * ReservationsModule — reservation reads go through the leaf
 * ReservationsReadModule — so ReservationsModule → AirtrailCoreModule carries
 * no cycle. The pull (AirtrailSyncService), which does need
 * ReservationsService, lives one level up in AirtrailModule.
 */
@Module({
  imports: [AuditModule, AddonsModule, RealtimeModule, ReservationsReadModule],
  providers: [AirtrailClient, AirtrailService, AirtrailLinkService],
  exports: [AirtrailClient, AirtrailService, AirtrailLinkService],
})
export class AirtrailCoreModule {}
