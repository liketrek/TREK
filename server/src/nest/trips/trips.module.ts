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
import { TripsRpc } from './trips.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { UnsplashModule } from '../unsplash/unsplash.module';
import { TripsMcp } from './trips.mcp';
import { AuthModule } from '../auth/auth.module';
import { CalendarModule } from '../calendar/calendar.module';
import { AccommodationsModule } from '../accommodations/accommodations.module';
import { TripMembersModule } from '../trip-members/trip-members.module';
import { TripReadModelModule } from '../trip-read-model/trip-read-model.module';

/** Trips aggregate root (C1 — Phase 3). Uses exact strangler prefixes so it does
 *  not capture the nested sub-domain mounts (collab, files, ...). */
@Module({
  imports: [TodoModule, PackingModule, FilesModule, ReservationsModule, DaysModule, PermissionsModule, AuditModule, BudgetModule, CollabModule, VacayModule, PlacesModule, AuthModule, AppConfigModule, UnsplashModule, RealtimeModule, PluginGuardsModule, TripMembershipModule, CalendarModule, AccommodationsModule, TripMembersModule, TripReadModelModule],
  controllers: [TripsController],
  providers: [TripsService, TripsMcp, TripsRpc],
  // Exported for FeedsModule (ICS feeds) and PluginsModule (RPC host injection).
  exports: [TripsService],
})
export class TripsModule {}
