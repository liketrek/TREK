import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PluginsRuntimeModule } from '../plugins-runtime.module';
import { AddonsModule } from '../../addons/addons.module';
import { JourneyDomainModule } from '../../journey/journey-domain.module';
import { JourneyEntries } from '../../../db/entities/JourneyEntries.entity';
import { Plugins } from '../../../db/entities/Plugins.entity';
import { Days } from '../../../db/entities/Days.entity';
import { Places } from '../../../db/entities/Places.entity';
import { Trips } from '../../../db/entities/Trips.entity';
import { PlaceDetailsController } from './place-details.controller';
import { PluginSearchController } from './plugin-search.controller';
import { TripWarningsController } from './trip-warnings.controller';
import { TripWarningsMcp } from './trip-warnings.mcp';
import { PluginSearchMcp } from './plugin-search.mcp';
import { PluginPoisController } from './plugin-pois.controller';
import { PluginPoisMcp } from './plugin-pois.mcp';
import { PluginPoisService } from './plugin-pois.service';
import { PluginMcpToolsService } from './plugin-mcp-tools.service';
import { ViewContributionsController } from './view-contributions.controller';
import { TripCardContributionsController } from './trip-card-contributions.controller';
import { PluginPhotosController } from './plugin-photos.controller';
import { PluginCalendarController } from './plugin-calendar.controller';
import { MapMarkersController } from './map-markers.controller';
import { MapLayersController } from './map-layers.controller';
import { PluginRoutesController } from './plugin-routes.controller';
import { DayScheduleController } from './day-schedule.controller';
import { DayTintsController } from './day-tints.controller';
import { PdfSectionsController } from './pdf-sections.controller';
import { AtlasLayersController } from './atlas-layers.controller';
import { JournalEntryRowsController } from './journal-entry-rows.controller';
import { DemoModule } from '../../common/demo.module';

/**
 * The read-only surface plugins contribute to the app: photos, calendar events,
 * place details, search results, explore-pill POI categories, trip warnings, table
 * columns, map markers and layers, routes, day schedules and tints, PDF sections,
 * atlas layers, journal entry rows, trip cards.
 *
 * Every one of these is the same shape — fan out over `providersOf(hook)`, call the
 * hook through `PluginHooks`, normalize and cap what comes back, skip a provider that
 * throws — so they belong together and nowhere else. None of them can install,
 * activate or configure anything, which is why they are separated from the CRUD
 * surface in PluginsModule.
 *
 * `MikroOrmModule.forFeature([JourneyEntries, Plugins])` registers
 * `JourneyEntriesRepository` for `JournalEntryRowsController`'s own
 * `@InjectRepository` constructor param (JEC1, Plan 3g Task 4) — importing
 * `JourneyDomainModule` above brings in `JourneyDomainService` for the
 * `canAccessJourney` call but does NOT export `MikroOrmModule`, so the
 * entity needs its own registration here too. `Plugins` is the same shape
 * (Plan 3j Task 3): `PluginRoutesController`'s `declaredProfiles` call now
 * takes `PluginsRepository`, and `PluginsRuntimeModule`'s own registration
 * of the same entity isn't exported either. `Days`/`Places` (Plan 3j Task 5,
 * CT1/CT2/CT7): `DayScheduleController`/`DayTintsController`'s own day-id-set
 * read and `PlaceDetailsController`'s own trip-id lookup, same reasoning —
 * `DaysModule`/`PlacesModule` do not export `MikroOrmModule` either.
 *
 * `DemoModule` is imported explicitly (Plan 3i Task 4 fix wave): it is
 * `@Global()`, but that broadcast only reaches a module graph that actually
 * imports it somewhere — a hand-built e2e `TestingModule` that never pulls in
 * `AppModule` otherwise leaves `PluginMcpToolsService`'s `DemoService`
 * dependency unresolved.
 */
@Module({
  imports: [PluginsRuntimeModule, AddonsModule, JourneyDomainModule, DemoModule, MikroOrmModule.forFeature([JourneyEntries, Plugins, Days, Places, Trips])],
  controllers: [
    PlaceDetailsController,
    PluginSearchController,
    PluginPoisController,
    TripWarningsController,
    ViewContributionsController,
    TripCardContributionsController,
    PluginPhotosController,
    PluginCalendarController,
    MapMarkersController,
    MapLayersController,
    PluginRoutesController,
    DayScheduleController,
    DayTintsController,
    PdfSectionsController,
    AtlasLayersController,
    JournalEntryRowsController,
  ],
  // The contributions with an MCP counterpart. TripWarningsMcp belongs to this
  // module rather than to the trip read model because the plugin runtime and the
  // trip aggregate already import each other's modules; see trip-warnings.mcp.ts.
  //
  // PluginMcpToolsService owns the process-level tool source. It lives here, and
  // not on PluginRuntimeService beside the other sinks, because it needs
  // PluginHooks and PluginHooks injects PluginRuntimeService.
  //
  // PluginPoisService is the one contribution with a service of its own: its REST
  // route and its MCP tools ask the same targeted question, so the gate and the
  // normalization live once, behind both.
  providers: [TripWarningsMcp, PluginSearchMcp, PluginPoisService, PluginPoisMcp, PluginMcpToolsService],
})
export class PluginContributionsModule {}
