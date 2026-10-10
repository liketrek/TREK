import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { AccommodationsModule } from '../accommodations/accommodations.module';
import { AddonsModule } from '../addons/addons.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { AuditModule } from '../audit/audit.module';
import { BudgetModule } from '../budget/budget.module';
import { CalendarModule } from '../calendar/calendar.module';
import { CollabModule } from '../collab/collab.module';
import { DaysModule } from '../days/days.module';
import { FilesModule } from '../files/files.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PackingModule } from '../packing/packing.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { SettingsModule } from '../settings/settings.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { TodoModule } from '../todo/todo.module';
import { TripMembersModule } from '../trip-members/trip-members.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { TripReadModelModule } from '../trip-read-model/trip-read-model.module';
import { UnsplashModule } from '../unsplash/unsplash.module';
import { VacayModule } from '../vacay/vacay.module';
import { TripPromptsMcp } from './trip-prompts.mcp';
import { TripsController } from './trips.controller';
import { MAX_COVER_SIZE, TRIP_COVER_FILE_FILTER } from './trips.controller';
import { TripsMcp } from './trips.mcp';
import { TripsRpc } from './trips.rpc';
import { TripsService } from './trips.service';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

/** Trips aggregate root (C1 — Phase 3). Uses exact strangler prefixes so it does
 *  not capture the nested sub-domain mounts (collab, files, ...). */
@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [StorageModule],
      inject: [StorageService],
      useFactory: (storage: StorageService) =>
        buildStorageUploadOptions(storage, {
          category: 'covers',
          maxSize: MAX_COVER_SIZE,
          fileFilter: TRIP_COVER_FILE_FILTER,
        }),
    }),
    StorageModule,
    McpSharedModule,
    TodoModule,
    PackingModule,
    FilesModule,
    ReservationsModule,
    DaysModule,
    PermissionsModule,
    AuditModule,
    BudgetModule,
    CollabModule,
    VacayModule,
    PlacesModule,
    AppConfigModule,
    UnsplashModule,
    RealtimeModule,
    PluginGuardsModule,
    AddonsModule,
    TripMembershipModule,
    CalendarModule,
    AccommodationsModule,
    TripMembersModule,
    TripReadModelModule,
    SettingsModule,
  ],
  controllers: [TripsController],
  providers: [TripsService, TripsMcp, TripPromptsMcp, TripsRpc],
  // Exported for FeedsModule (ICS feeds) and PluginsModule (RPC host injection).
  exports: [TripsService],
})
export class TripsModule {}
