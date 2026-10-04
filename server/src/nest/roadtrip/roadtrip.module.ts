import { ChargingMcp } from './charging.mcp';
import { ChargingService } from './charging.service';
import { ChargingController } from './charging.controller';
import { ChargingLookupController } from './charging-lookup.controller';
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
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RoadtripHazardsController } from './roadtrip-hazards.controller';
import { RoadtripHazardsService } from './roadtrip-hazards.service';
import { RoadtripHazardsMcp } from './roadtrip-hazards.mcp';
import { Trips } from '../../db/entities/Trips.entity';
import { Days } from '../../db/entities/Days.entity';
import { Places } from '../../db/entities/Places.entity';
import { Users } from '../../db/entities/Users.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import { RoadtripDayTracks } from '../../db/entities/RoadtripDayTracks.entity';
import { RoadtripPreferences } from '../../db/entities/RoadtripPreferences.entity';
import { RoadtripDayBoundaries } from '../../db/entities/RoadtripDayBoundaries.entity';
import { Plugins } from '../../db/entities/Plugins.entity';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import { ReservationDayPositions } from '../../db/entities/ReservationDayPositions.entity';

/** Road trip domain (#1797): the points a drive is routed through. Registered in AppModule. */
@Module({
  // McpShared brings the tool guards, Auth the demo check, Permissions the trip guard,
  // Addons the enabled-check the MCP tools gate on (the controller has @RequireAddon).
  //
  // `MikroOrmModule.forFeature(...)` (Plan 3d Task 1) registers every
  // repository this module's own providers `@InjectRepository` — a
  // `forFeature` registration only reaches providers declared in ITS OWN
  // `providers` array (`AssignmentsDomainModule`'s docstring), so the four
  // new roadtrip repositories plus `Trips`/`Days`/`Places`/`Users`/
  // `DayAssignments` (read through `TripsRepository.findAccessible`,
  // `DaysRepository.existsInTrip`/`listPlanDays`, `PlacesRepository
  // .isTrackInTrip`/`findChargingProbe`, `UsersRepository.getRole`,
  // `DayAssignmentsRepository.findInTrip`/`listRoadtripVisits`) all need
  // their own entry here, even though `PlacesModule`/`AssignmentsModule`
  // already register some of the same entities for THEIR OWN providers.
  // `Plugins` (Plan 3j Task 3): `RoadtripRouterService`'s RRT1/RRT2 call
  // `declaredProfiles`, now `PluginsRepository`-typed; `PluginsRuntimeModule`
  // registers the same entity but does not export the repository token.
  // `DayAccommodations`/`Reservations`/`ReservationEndpoints`/
  // `ReservationDayPositions`: `RoadtripPlanService`'s RPL3-RPL5 reads (the
  // booked nights and the carrier bookings that seam the drive) plus the RPL6
  // terminal and RS19 day-position reads it joins onto them.
  imports: [
    McpSharedModule,
    PermissionsModule,
    AuthModule,
    AddonsModule,
    RealtimeModule,
    SettingsModule,
    PluginsRuntimeModule,
    MapsModule, PlacesModule, AssignmentsModule,
    MikroOrmModule.forFeature([Trips, Days, Places, Users, DayAssignments, RoadtripVias, RoadtripDayTracks, RoadtripPreferences, RoadtripDayBoundaries, Plugins, DayAccommodations, Reservations, ReservationEndpoints, ReservationDayPositions]),
  ],
  controllers: [ChargingController, ChargingLookupController, GoogleRouteController, RoadtripSearchController, RoadtripPreferencesController, RoadtripController, DayBoundariesController, RoadtripHazardsController],
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
