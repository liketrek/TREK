import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Places } from '../../db/entities/Places.entity';
import { Tags } from '../../db/entities/Tags.entity';
import { PlaceRatings } from '../../db/entities/PlaceRatings.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Categories } from '../../db/entities/Categories.entity';
import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { PlacesRpc } from './places.rpc';
import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PlacesMcp } from './places.mcp';
import { PermissionsModule } from '../permissions/permissions.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { AccommodationsDomainModule } from '../accommodations/accommodations-domain.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { UnsplashModule } from '../unsplash/unsplash.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { MapsModule } from '../maps/maps.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { MulterModule } from '@nestjs/platform-express';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { MAX_PLACE_IMAGE_SIZE } from '../common/place-image-upload';

/**
 * Places domain (S8 — Phase 2 trip sub-domain). Depends on L4 Categories + L5
 * Tags for the joined projections, and on MapsModule for places.mcp.ts's
 * search_place tool. Exports PlacesService for the in-container consumers —
 * TripsService's trip summary, DaysMcp's place-accommodation creation,
 * BookingImportService and the plugin RPC surface, PlacesRpc. There
 * is no places.bridge.ts: nothing outside the container consumes this domain.
 */
@Module({
  imports: [
    // Module-level options deliberately carry NO fileFilter: the GPX/KML import
    // route keeps its inline memoryStorage config and would inherit a
    // module-level filter via the interceptor's shallow merge — the image
    // route passes PLACE_IMAGE_FILE_FILTER inline instead.
    MulterModule.registerAsync({
      imports: [StorageModule],
      inject: [StorageService],
      useFactory: (storage: StorageService) =>
        buildStorageUploadOptions(storage, { category: 'places', maxSize: MAX_PLACE_IMAGE_SIZE }),
    }),
    StorageModule,
    // AccommodationsDomainModule: deleting a place takes the nights booked at it with
    // it, and the cascade behind a stay belongs to the domain that owns it.
    McpSharedModule, PermissionsModule, QueryHelpersModule, MapsModule, AppConfigModule, UnsplashModule, PlacePhotosModule, JourneyDomainModule, RealtimeModule, PluginGuardsModule, AssignmentsDomainModule, AccommodationsDomainModule,
    // Plan 3c Task 4: `PlacesService`'s and `PlacesMcp`'s own `@InjectRepository`
    // constructor params (`PlacesRepository`, `TagsRepository`,
    // `PlaceRatingsRepository`, `TripMembersRepository`,
    // `DayAssignmentsRepository`, `TripsRepository`) — registered directly on
    // THIS module (not a sibling domain module's `exports`), matching
    // `AssignmentsDomainModule`'s own `MikroOrmModule.forFeature(...)`
    // precedent: a `forFeature` registration only reaches providers declared
    // in the SAME module. Plan 3c Task 5 adds `CategoriesRepository` for
    // PL33's `importKmlPlaces` folder → category lookup. Plan 3h Task 6 adds
    // `CollectionPlaces` for SV-PI2 (`reclaimPlaceImage`'s second existence
    // check) — a read-only cross-domain repository reference, not a
    // `CollectionsModule` import, so it creates no cycle (`CollectionsModule`
    // does not import `PlacesModule` either — both sides reach the other's
    // table only through `forFeature`).
    MikroOrmModule.forFeature([Places, Tags, PlaceRatings, TripMembers, DayAssignments, Trips, Categories, BudgetItems, CollectionPlaces]),
  ],
  controllers: [PlacesController],
  providers: [PlacesService, PlacesMcp, PlacesRpc],
  exports: [PlacesService],
})
export class PlacesModule {}
