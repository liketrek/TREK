import { AppSettings } from '../../db/entities/AppSettings.entity';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { Users } from '../../db/entities/Users.entity';
import { AddonsModule } from '../addons/addons.module';
import { AuditModule } from '../audit/audit.module';
import { UserConnectionRepositoriesModule } from '../database/user-connection-repositories.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ReservationsReadModule } from '../reservations/reservations-read.module';
import { AirtrailLinkService } from './airtrail-link.service';
import { AirtrailClient } from './airtrail.client';
import { AirtrailService } from './airtrail.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * The AirTrail pieces ReservationsModule may inject: the HTTP client, the
 * credential/settings service and the link lifecycle (incl. the write-back
 * trigger the reservations controller fires). Deliberately does NOT import
 * ReservationsModule — reservation reads go through the leaf
 * ReservationsReadModule — so ReservationsModule → AirtrailCoreModule carries
 * no cycle. The pull (AirtrailSyncService), which does need
 * ReservationsService, lives one level up in AirtrailModule.
 *
 * `MikroOrmModule.forFeature([Users, Reservations, ReservationEndpoints,
 * AppSettings])` (Plan 3h Task 4): `AirtrailService`'s entire credential
 * surface lives on `Users` (R7 — AirTrail owns zero tables of its own);
 * `AirtrailLinkService` reaches `Reservations`/`ReservationEndpoints` for its
 * bookkeeping and `AppSettings` for the sync-enabled kill-switch. Only
 * entity classes are imported here, not their owning Nest modules — no new
 * module edge, so no cycle risk.
 */
@Module({
  imports: [
    AuditModule,
    AddonsModule,
    RealtimeModule,
    ReservationsReadModule,
    UserConnectionRepositoriesModule,
    MikroOrmModule.forFeature([Users, Reservations, ReservationEndpoints, AppSettings]),
  ],
  providers: [AirtrailClient, AirtrailService, AirtrailLinkService],
  exports: [AirtrailClient, AirtrailService, AirtrailLinkService],
})
export class AirtrailCoreModule {}
