import { Module } from '@nestjs/common';
import { PluginsRuntimeModule } from '../plugins-runtime.module';
import { AddonsModule } from '../../addons/addons.module';
import { JourneyDomainModule } from '../../journey/journey-domain.module';
import { PlaceDetailsController } from './place-details.controller';
import { TripWarningsController } from './trip-warnings.controller';
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

/**
 * The read-only surface plugins contribute to the app: photos, calendar events,
 * place details, trip warnings, table columns, map markers and layers, routes, day
 * schedules and tints, PDF sections, atlas layers, journal entry rows, trip cards.
 *
 * Every one of these is the same shape — fan out over `providersOf(hook)`, call the
 * hook through `PluginHooks`, normalize and cap what comes back, skip a provider that
 * throws — so they belong together and nowhere else. None of them can install,
 * activate or configure anything, which is why they are separated from the CRUD
 * surface in PluginsModule.
 */
@Module({
  imports: [PluginsRuntimeModule, AddonsModule, JourneyDomainModule],
  controllers: [
    PlaceDetailsController,
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
})
export class PluginContributionsModule {}
