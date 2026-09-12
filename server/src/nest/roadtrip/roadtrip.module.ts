import { ChargingMcp } from './charging.mcp';
import { ChargingService } from './charging.service';
import { ChargingController } from './charging.controller';
import { GoogleRouteService } from './google-route.service';
import { GoogleRouteController } from './google-route.controller';
import { GoogleRouteMcp } from './google-route.mcp';
import { PlacesModule } from '../places/places.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { AddonsModule } from '../addons/addons.module';
import { AuthModule } from '../auth/auth.module';
import { MapsModule } from '../maps/maps.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PluginsRuntimeModule } from '../plugins/plugins-runtime.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SettingsModule } from '../settings/settings.module';
import { DayBoundariesController } from './day-boundaries.controller';
import { DayBoundariesMcp } from './day-boundaries.mcp';
import { DayBoundariesService } from './day-boundaries.service';
import { RoadtripPlanService } from './roadtrip-plan.service';
import { RoadtripPlanningMcp } from './roadtrip-planning.mcp';
import { RoadtripPreferencesController } from './roadtrip-preferences.controller';
import { RoadtripPreferencesMcp } from './roadtrip-preferences.mcp';
import { RoadtripPreferencesService } from './roadtrip-preferences.service';
import { RoadtripRouterService } from './roadtrip-router.service';
import { RoadtripController } from './roadtrip.controller';
import { RoadtripMcp } from './roadtrip.mcp';
import { RoadtripService } from './roadtrip.service';
import { RoadtripSearchService } from './roadtrip-search.service';
import { RoadtripSearchController } from './roadtrip-search.controller';
import { Module } from '@nestjs/common';
import { RoadtripHazardsController } from './roadtrip-hazards.controller';
import { RoadtripHazardsService } from './roadtrip-hazards.service';
import { RoadtripHazardsMcp } from './roadtrip-hazards.mcp';

/** Road trip domain (#1797): the points a drive is routed through. Registered in AppModule. */
@Module({
  // McpShared brings the tool guards, Auth the demo check, Permissions the trip guard,
  // Addons the enabled-check the MCP tools gate on (the controller has @RequireAddon).
  imports: [
    McpSharedModule,
    PermissionsModule,
    AuthModule,
    AddonsModule,
    RealtimeModule,
    SettingsModule,
    PluginsRuntimeModule,
    MapsModule, PlacesModule, AssignmentsModule,
  ],
  controllers: [ChargingController, GoogleRouteController, RoadtripSearchController, RoadtripPreferencesController, RoadtripController, DayBoundariesController, RoadtripHazardsController],
  providers: [ChargingMcp, ChargingService, GoogleRouteService, GoogleRouteMcp,
    RoadtripSearchService,
    RoadtripHazardsService,
    RoadtripHazardsMcp,
    RoadtripService,
    RoadtripMcp,
    DayBoundariesService,
    DayBoundariesMcp,
    RoadtripPreferencesService,
    RoadtripPreferencesMcp,
    RoadtripRouterService,
    RoadtripPlanService,
    RoadtripPlanningMcp,
  ],
  exports: [RoadtripService],
})
export class RoadtripModule {}
