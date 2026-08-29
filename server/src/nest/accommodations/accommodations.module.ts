import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlacesModule } from '../places/places.module';
import { PluginGuardsModule } from '../plugins/host/plugin-guards.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AccommodationsController } from './accommodations.controller';
import { AccommodationsMcp } from './accommodations.mcp';
import { AccommodationsRpc } from './accommodations.rpc';
import { AccommodationsService } from './accommodations.service';
import { Module } from '@nestjs/common';

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
  imports: [
    McpSharedModule,
    PermissionsModule,
    RealtimeModule,
    PluginGuardsModule,
    DatabaseModule,
    PlacesModule,
    AuthModule,
  ],
  controllers: [AccommodationsController],
  providers: [AccommodationsService, AccommodationsRpc, AccommodationsMcp],
  exports: [AccommodationsService],
})
export class AccommodationsModule {}
