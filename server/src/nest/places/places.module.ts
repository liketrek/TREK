import { AppConfigModule } from '../app-config/app-config.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { AuthModule } from '../auth/auth.module';
import { MAX_PLACE_IMAGE_SIZE } from '../common/place-image-upload';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { MapsModule } from '../maps/maps.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { buildStorageUploadOptions } from '../storage/storage-upload.factory';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { UnsplashModule } from '../unsplash/unsplash.module';
import { PlacesController } from './places.controller';
import { PlacesMcp } from './places.mcp';
import { PlacesRpc } from './places.rpc';
import { PlacesService } from './places.service';
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
    McpSharedModule,
    PermissionsModule,
    QueryHelpersModule,
    MapsModule,
    AuthModule,
    AppConfigModule,
    UnsplashModule,
    PlacePhotosModule,
    JourneyDomainModule,
    RealtimeModule,
    PluginGuardsModule,
    AssignmentsDomainModule,
  ],
  controllers: [PlacesController],
  providers: [PlacesService, PlacesMcp, PlacesRpc],
  exports: [PlacesService],
})
export class PlacesModule {}
