import { Module } from '@nestjs/common';
import { JourneyDomainModule } from '../journey/journey-domain.module';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { PlacesRpc } from './places.rpc';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PlacesMcp } from './places.mcp';
import { PermissionsModule } from '../permissions/permissions.module';
import { AppConfigModule } from '../app-config/app-config.module';
import { UnsplashModule } from '../unsplash/unsplash.module';
import { PlacePhotosModule } from '../place-photos/place-photos.module';
import { QueryHelpersModule } from '../query-helpers/query-helpers.module';
import { MapsModule } from '../maps/maps.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Places domain (S8 — Phase 2 trip sub-domain). Depends on L4 Categories + L5
 * Tags for the joined projections, and on MapsModule for places.mcp.ts's
 * search_place tool. Exports PlacesService for the in-container consumers —
 * TripsService's trip summary, DaysMcp's place-accommodation creation,
 * BookingImportService and the plugin RPC surface, PlacesRpc. There
 * is no places.bridge.ts: nothing outside the container consumes this domain.
 */
@Module({
  imports: [PermissionsModule, QueryHelpersModule, MapsModule, AuthModule, AppConfigModule, UnsplashModule, PlacePhotosModule, JourneyDomainModule, RealtimeModule, PluginGuardsModule],
  controllers: [PlacesController],
  providers: [PlacesService, PlacesMcp, PlacesRpc],
  exports: [PlacesService],
})
export class PlacesModule {}
