import { Module } from '@nestjs/common';
import { BudgetModule } from '../budget/budget.module';
import { CollabModule } from '../collab/collab.module';
import { DaysModule } from '../days/days.module';
import { FilesModule } from '../files/files.module';
import { PackingModule } from '../packing/packing.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { TodoModule } from '../todo/todo.module';
import { VacayModule } from '../vacay/vacay.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';
import { PlacesModule } from '../places/places.module';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { AppConfigModule } from '../app-config/app-config.module';
import { TripsMcp } from './trips.mcp';
import { AuthModule } from '../auth/auth.module';

/** Trips aggregate root (C1 — Phase 3). Uses exact strangler prefixes so it does
 *  not capture the nested sub-domain mounts (collab, files, ...). */
@Module({
  imports: [TodoModule, PackingModule, FilesModule, ReservationsModule, DaysModule, PermissionsModule, AuditModule, BudgetModule, CollabModule, VacayModule, PlacesModule, AuthModule, AppConfigModule],
  controllers: [TripsController],
  providers: [TripsService, TripsMcp],
  // Exported for FeedsModule (ICS feeds) and PluginsModule (RPC host injection).
  exports: [TripsService],
})
export class TripsModule {}
