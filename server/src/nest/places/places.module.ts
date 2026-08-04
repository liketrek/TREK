import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { PlacesService } from './places.service';
import { PlacesMcp } from './places.mcp';
import { PermissionsModule } from '../permissions/permissions.module';
import { MapsModule } from '../maps/maps.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Places domain (S8 — Phase 2 trip sub-domain). Depends on L4 Categories + L5
 * Tags for the joined projections, and on MapsModule for places.mcp.ts's
 * search_place tool. Exports PlacesService for the in-container consumers —
 * TripsService's trip summary, DaysMcp's place-accommodation creation,
 * BookingImportService and the plugin RPC host's PluginHostDepsFactory. There
 * is no places.bridge.ts: nothing outside the container consumes this domain.
 */
@Module({
  imports: [PermissionsModule, MapsModule, AuthModule],
  controllers: [PlacesController],
  providers: [PlacesService, PlacesMcp],
  exports: [PlacesService],
})
export class PlacesModule {}
