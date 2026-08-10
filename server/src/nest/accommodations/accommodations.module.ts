import { Module } from '@nestjs/common';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsService } from './accommodations.service';
import { AccommodationsRpc } from './accommodations.rpc';
import { AccommodationsMcp } from './accommodations.mcp';
import { PlacesModule } from '../places/places.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';

/**
 * Accommodations. One fachlichkeit, one module: the routes used to sit in
 * reservations/ while the SQL sat on DaysService, so neither module owned the
 * thing outright and every call crossed a domain boundary to reach its own data.
 *
 * It imports neither days nor reservations. The stay rows reference days by id,
 * which is a foreign key, not a module edge. PlacesModule is here only because
 * create_place_accommodation writes a place and a stay in one transaction --
 * the same reason DaysMcp could drop it.
 */
@Module({
  imports: [PermissionsModule, RealtimeModule, PluginGuardsModule, DatabaseModule, PlacesModule, AuthModule],
  controllers: [AccommodationsController],
  providers: [AccommodationsService, AccommodationsRpc, AccommodationsMcp],
  exports: [AccommodationsService],
})
export class AccommodationsModule {}
