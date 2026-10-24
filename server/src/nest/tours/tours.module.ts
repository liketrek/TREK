import { CollectionTours } from '../../db/entities/CollectionTours.entity';
import { Places } from '../../db/entities/Places.entity';
import { TourActivities } from '../../db/entities/TourActivities.entity';
import { TourActivityExclusions } from '../../db/entities/TourActivityExclusions.entity';
import { TourChangeSteps } from '../../db/entities/TourChangeSteps.entity';
import { TourDrafts } from '../../db/entities/TourDrafts.entity';
import { TourObstacleReviews } from '../../db/entities/TourObstacleReviews.entity';
import { TourPackingLinks } from '../../db/entities/TourPackingLinks.entity';
import { TourSourceHints } from '../../db/entities/TourSourceHints.entity';
import { TourSources } from '../../db/entities/TourSources.entity';
import { TourStationVisits } from '../../db/entities/TourStationVisits.entity';
import { TourTypes } from '../../db/entities/TourTypes.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { AddonsModule } from '../addons/addons.module';
import { AssignmentsDomainModule } from '../assignments/assignments-domain.module';
import { CollectionsModule } from '../collections/collections.module';
import { MapsModule } from '../maps/maps.module';
import { McpSharedModule } from '../mcp-shared/mcp-shared.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OverpassModule } from '../overpass/overpass.module';
import { PackingModule } from '../packing/packing.module';
import { PaddleObstaclesModule } from '../paddle-obstacles/paddle-obstacles.module';
import { PaddleRoutingModule } from '../paddle-routing/paddle-routing.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PlaceImportModule } from '../place-import/place-import.module';
import { PlacesModule } from '../places/places.module';
import { RoadtripModule } from '../roadtrip/roadtrip.module';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { SkiRoutingModule } from '../ski-routing/ski-routing.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';
import { WandererModule } from '../wanderer/wanderer.module';
import { WeatherModule } from '../weather/weather.module';
import { CityWalkBriefingService } from './city-walk-briefing.service';
import { CityWalkFootWayService } from './city-walk-foot-way.service';
import { CityWalkMcp } from './city-walk.mcp';
import { CollectionTourTakeOverController, CollectionToursController } from './collection-tours.controller';
import { CollectionToursMcp } from './collection-tours.mcp';
import { CollectionToursService } from './collection-tours.service';
import { HikePlanMcp } from './hike-plan.mcp';
import { HikePlanService } from './hike-plan.service';
import { HikeRoutingService } from './hike-routing.service';
import { HikeWaysMcp } from './hike-ways.mcp';
import { HikeWaysService } from './hike-ways.service';
import { SportTourCreateService } from './sport-tour-create.service';
import { TourActivitiesController } from './tour-activities.controller';
import { TourActivitiesMcp } from './tour-activities.mcp';
import { TourActivitiesService } from './tour-activities.service';
import { TourActivityStatsController } from './tour-activity-stats.controller';
import { TourActivityStatsMcp } from './tour-activity-stats.mcp';
import { TourActivityStatsService } from './tour-activity-stats.service';
import { TourChangePreviewService } from './tour-change-preview.service';
import { TourChangeSaveService } from './tour-change-save.service';
import { TourChangeUndoMcp } from './tour-change-undo.mcp';
import { TourChangeUndoService } from './tour-change-undo.service';
import { TourChangeMcp } from './tour-change.mcp';
import { TourDetailsService } from './tour-details.service';
import { TourDraftsController } from './tour-drafts.controller';
import { TourDraftsService } from './tour-drafts.service';
import { TourEditMcp } from './tour-edit.mcp';
import { TourGpxExportService } from './tour-gpx-export.service';
import { TourHorseRoutesController } from './tour-horse-routes.controller';
import { TourHorseRoutesService } from './tour-horse-routes.service';
import { TourLibraryController, TourTakeOverController } from './tour-library.controller';
import { TourLibraryMcp } from './tour-library.mcp';
import { TourLibraryService } from './tour-library.service';
import { TourObstacleReviewsService } from './tour-obstacle-reviews.service';
import { TourPackingLinkController } from './tour-packing-link.controller';
import { TourPackingLinkService } from './tour-packing-link.service';
import { TourPackingMcp } from './tour-packing.mcp';
import { PaddleCheckCache } from './tour-paddle-check.cache';
import { TourPaddleCheckService } from './tour-paddle-check.service';
import { TourPaddlePlanService } from './tour-paddle-plan.service';
import { TourPlanMcp } from './tour-plan.mcp';
import { TourPoiSearchController } from './tour-poi-search.controller';
import { TourPoiSearchService } from './tour-poi-search.service';
import { TourSkiController } from './tour-ski.controller';
import { TourSkiService } from './tour-ski.service';
import { TourSportWritesMcp } from './tour-sport-writes.mcp';
import { TourStopsMcp } from './tour-stops.mcp';
import { TourStopsService } from './tour-stops.service';
import { TourTrailDetailsService } from './tour-trail-details.service';
import { TourTrailGradeController } from './tour-trail-grade.controller';
import { TourTrailGradeService } from './tour-trail-grade.service';
import { TourVisitsController } from './tour-visits.controller';
import { TourVisitsService } from './tour-visits.service';
import { TourWalkImportController } from './tour-walk-import.controller';
import { TourWalkImportMcp } from './tour-walk-import.mcp';
import { TourWalkImportService } from './tour-walk-import.service';
import { ToursImportController } from './tours-import.controller';
import { ToursWandererController } from './tours-wanderer.controller';
import { ToursWandererMcp } from './tours-wanderer.mcp';
import { ToursWandererService } from './tours-wanderer.service';
import { ToursController } from './tours.controller';
import { ToursMcp } from './tours.mcp';
import { ToursService } from './tours.service';
import { WandererWatchController } from './wanderer-watch.controller';
import { WandererWatchJob } from './wanderer-watch.job';
import { WandererWatchService } from './wanderer-watch.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

/**
 * Tours domain: an isolated bounded context that reads GPX through PlaceImportModule and
 * persists the places through PlacesService (PlacesModule). The tour SQL lives in
 * the Tours and TourWaypoints repositories; the owning place's route columns go
 * through PlacesRepository, registered here because forFeature only reaches
 * this module's own providers. A Google Maps walking route is read into the
 * stops of a city walk through PlaceImportModule as well (CW-07), its short
 * link followed by the narrow resolver there (CW-06). A city walk an assistant
 * prepares from a briefing reads the day and places of the trip through the
 * tours' own repositories, is planned on foot by RoadtripModule's router and
 * is created through ToursService (CW-11). A hike an assistant plans with the
 * traveller is proposed, created, changed or taken in from a GPX file through
 * the same writes, its way planned on the server by HikeRoutingService (a
 * round of a wished length and the other ways of a leg found by HikeWaysService
 * with the planner's own search), its
 * day read from WeatherModule's detailed weather and the places along it from
 * the tours' own search; one created on a day is put there through
 * AssignmentsService in the same write. A bike tour or a run goes the same
 * way for its profile, and a paddle or ski tour an assistant planned is saved
 * after PaddleRoutingModule's or SkiRoutingModule's router planned its legs again. A
 * change to a saved city walk an assistant prepares for review is laid onto
 * its saved points and planned on foot by the same router, and saves nothing
 * (MCP-T02); once the traveller
 * confirmed it, it is saved through the tour's own write, which records the
 * step for a later undo (MCP-T03). The recorded tracks assigned to a tour
 * (ACT-01) are read with its detail and written through
 * TourActivitiesService, over the day assignments the visits repository reads.
 * The user's own activity sums across their trips (STA-02) are read by
 * TourActivityStatsService, over the trips TripMembershipModule says they can
 * open, with the tours the user left out of them. Whole tours kept in a
 * collection (LIB-03) are this domain's own rows; the collection's roles and
 * its live notice to its members come from CollectionsService. A tour points at
 * the packing list of its trip (P2D-XD-01) through a row of its own; the list
 * and who sees which of its items stay PackingService's. The optional watch
 * over a user's own wanderer snapshots (WAN-02) reads through WandererService,
 * keeps its hints in this domain's own rows, tells the user through
 * NotificationsService and runs hourly on SchedulingModule's registrar. The
 * planner's unsaved draft lives on the account, one per user and trip, in this
 * domain's own rows.
 */
@Module({
  imports: [
    PlacesModule,
    PlaceImportModule,
    PermissionsModule,
    TripMembershipModule,
    // The take-over tool checks 'place_edit' on the trip it writes into (LIB-02).
    McpSharedModule,
    // PLN-02 searches places along a tour through the map search.
    MapsModule,
    // BIK-05 reads the trail grades along a mountain bike tour from OpenStreetMap,
    // HOR-01 the signposted horse routes around a ride.
    OverpassModule,
    AddonsModule,
    // The wanderer import reads trails through the caller's own connection.
    WandererModule,
    // The obstacle data a paddle tour's checklist reads (PAD-06, PAD-09).
    PaddleObstaclesModule,
    // A city walk prepared over MCP is planned on foot by the router the road trip uses (CW-11),
    // and a hike planned on the server under its hiking limit, with its heights and the ways under it.
    RoadtripModule,
    // A saved change takes the stages a tour no longer has off their days (MDT-02).
    AssignmentsDomainModule,
    // A collection keeps whole tours (LIB-03): its roles decide who sees, keeps and removes one.
    CollectionsModule,
    // A tour's packing link is read against the items Packing lets the user see (P2D-XD-01).
    PackingModule,
    // The wanderer watch tells the user of a new hint (WAN-02) and runs as a cron.
    NotificationsModule,
    SchedulingModule,
    // A proposed hike's day reads the detailed weather at its highest point: sun, hours and warnings.
    WeatherModule,
    // A paddle or ski tour the assistant planned is planned again by its own router when it is saved.
    PaddleRoutingModule,
    SkiRoutingModule,
    MikroOrmModule.forFeature([
      CollectionTours,
      Tours,
      TourTypes,
      TourWaypoints,
      TourSources,
      TourSourceHints,
      TourObstacleReviews,
      TourPackingLinks,
      TourStationVisits,
      TourChangeSteps,
      TourDrafts,
      TourActivities,
      TourActivityExclusions,
      Places,
    ]),
  ],
  controllers: [
    // The static `from-collection` and `take-over` routes before ToursController's `:placeId`.
    CollectionTourTakeOverController,
    TourHorseRoutesController,
    TourTakeOverController,
    TourActivitiesController,
    TourActivityStatsController,
    TourDraftsController,
    TourPoiSearchController,
    TourSkiController,
    TourTrailGradeController,
    TourVisitsController,
    TourWalkImportController,
    ToursController,
    ToursImportController,
    ToursWandererController,
    TourLibraryController,
    CollectionToursController,
    TourPackingLinkController,
    WandererWatchController,
  ],
  providers: [
    ToursService,
    TourPaddlePlanService,
    PaddleCheckCache,
    TourPaddleCheckService,
    TourObstacleReviewsService,
    TourGpxExportService,
    TourHorseRoutesService,
    ToursWandererService,
    TourLibraryService,
    TourPoiSearchService,
    TourSkiService,
    TourTrailGradeService,
    // P8, P9: a tour's words, times and colour, and the trail details along a saved one.
    TourDetailsService,
    TourTrailDetailsService,
    TourVisitsService,
    TourWalkImportService,
    CityWalkFootWayService,
    CityWalkBriefingService,
    HikeRoutingService,
    HikePlanService,
    HikeWaysService,
    SportTourCreateService,
    TourChangePreviewService,
    TourChangeSaveService,
    TourChangeUndoService,
    TourStopsService,
    TourDraftsService,
    TourActivitiesService,
    TourActivityStatsService,
    CollectionToursService,
    TourPackingLinkService,
    WandererWatchService,
    WandererWatchJob,
    ToursMcp,
    TourLibraryMcp,
    TourWalkImportMcp,
    CityWalkMcp,
    HikePlanMcp,
    TourPlanMcp,
    TourChangeMcp,
    TourChangeUndoMcp,
    TourActivitiesMcp,
    TourActivityStatsMcp,
    CollectionToursMcp,
    TourPackingMcp,
    TourEditMcp,
    TourSportWritesMcp,
    HikeWaysMcp,
    ToursWandererMcp,
    // P6: a found place taken into a saved hike or city walk, and out again.
    TourStopsMcp,
  ],
})
export class ToursModule {}
