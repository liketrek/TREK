import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { Categories } from '../../db/entities/Categories.entity';
import { CollectionPlaces } from '../../db/entities/CollectionPlaces.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { PlaceFieldOrigin } from '../../db/entities/PlaceFieldOrigin.entity';
import { PlaceRatings } from '../../db/entities/PlaceRatings.entity';
import { Places } from '../../db/entities/Places.entity';
import { Tags } from '../../db/entities/Tags.entity';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { PluginGuardsModule } from '../../nest-rpc/plugin-guards.module';
import { AccommodationsDomainModule } from '../accommodations/accommodations-domain.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { MAX_PLACE_IMAGE_SIZE } from '../common/place-image-upload';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { MapsModule } from '../maps/maps.module';
import { McpAppsModule } from '../mcp-apps/mcp-apps.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlaceContribModule } from '../place-contrib/place-contrib.module';
import { PlaceImportModule } from '../place-import/place-import.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { UnsplashModule } from '../unsplash/unsplash.module';
import { PlaceOriginsService } from './place-origins.service';
import { PlacesStorageRefsService } from './places-storage-refs.service';
import { PlacesController } from './places.controller';
import { PlacesMcp } from './places.mcp';
import { PlacesRpc } from './places.rpc';
import { PlacesService } from './places.service';
import { TripMapMcp } from './trip-map.mcp';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

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
    TripMembershipModule,
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
    // PlaceImportModule reads the GPX/KML files and shared lists this domain imports.
    PlaceImportModule,
    McpSharedModule,
    PermissionsModule,
    QueryHelpersModule,
    MapsModule,
    // McpAppsModule for get_trip_map, whose tiles follow the user's map settings.
    McpAppsModule,
    AppConfigModule,
    UnsplashModule,
    PlacePhotosModule,
    JourneyDomainModule,
    RealtimeModule,
    PluginGuardsModule,
    AssignmentsDomainModule,
    AccommodationsDomainModule,
    // Every place write records where its shareable details came from, and the
    // user's values go to the community enrichment's queue there.
    PlaceContribModule,
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
    // `CollectionsModule` import, so it creates no cycle: `CollectionsModule`
    // imports this module for copyToTrip's journey hook, and this side reaches
    // the collections table only through `forFeature`.
    MikroOrmModule.forFeature([
      Places,
      Tags,
      PlaceRatings,
      TripMembers,
      DayAssignments,
      Trips,
      Categories,
      BudgetItems,
      CollectionPlaces,
      PlaceFieldOrigin,
    ]),
  ],
  controllers: [PlacesController],
  providers: [PlacesService, PlacesMcp, TripMapMcp, PlacesRpc, PlaceOriginsService, PlacesStorageRefsService],
  // The origin bookkeeping too: the booking import writes places as well.
  exports: [PlacesService, PlaceOriginsService],
})
export class PlacesModule {}
