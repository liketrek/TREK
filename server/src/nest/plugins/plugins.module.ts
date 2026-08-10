import { Module } from '@nestjs/common';
import { PoiCategoriesController } from './poi-categories.controller';
import { PluginsController } from './plugins.controller';
import { PluginsFeedController } from './plugins-feed.controller';
import { PluginsProxyController } from './plugins-proxy.controller';
import { PluginFrameController } from './plugin-frame.controller';
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
import { PluginActivityController } from './plugin-activity.controller';
import { PdfSectionsController } from './pdf-sections.controller';
import { AtlasLayersController } from './atlas-layers.controller';
import { JournalEntryRowsController } from './journal-entry-rows.controller';
import { PluginUserSettingsController } from './plugin-user-settings.controller';
import { PluginOAuthController } from './plugin-oauth.controller';
import { PluginOAuthService } from './plugin-oauth.service';
import { PluginsService } from './plugins.service';
import { PluginRuntimeService } from './plugin-runtime.service';
import { PluginRegistryService } from './registry/registry.service';
import { PluginHostDepsFactory } from './host/plugin-host-deps.factory';
import { TagsModule } from '../tags/tags.module';
import { CategoriesModule } from '../categories/categories.module';
import { BudgetModule } from '../budget/budget.module';
import { ReservationsModule } from '../reservations/reservations.module';
import { TodoModule } from '../todo/todo.module';
import { PackingModule } from '../packing/packing.module';
import { DaysModule } from '../days/days.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { LlmParseModule } from '../llm-parse/llm-parse.module';
import { FilesModule } from '../files/files.module';
import { CollabModule } from '../collab/collab.module';
import { VacayModule } from '../vacay/vacay.module';
import { TripsModule } from '../trips/trips.module';
import { PlacesModule } from '../places/places.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditModule } from '../audit/audit.module';
import { AddonsModule } from '../addons/addons.module';
import { CollectionsModule } from '../collections/collections.module';
import { AtlasModule } from '../atlas/atlas.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TripMembershipModule } from '../trip-membership/trip-membership.module';

/**
 * Plugin system (#plugins). M0 read side + M2 isolated runtime + M3 frontend:
 * the runtime service owns the process supervisor and boots active plugins on
 * startup; the proxy forwards /api/plugins/:id/* to the child; the feed lists
 * active plugins for the client; the frame controller serves sandboxed page/
 * widget assets at /plugin-frame/:id/*.
 */
@Module({
  // The DI-native domain services the plugin host wiring injects
  // (PluginHostDepsFactory); DatabaseModule is @Global, so not listed.
  imports: [TagsModule, CategoriesModule, BudgetModule, ReservationsModule, TodoModule, PackingModule, DaysModule, AssignmentsModule, LlmParseModule, FilesModule, CollabModule, VacayModule, TripsModule, PermissionsModule, AuditModule, AddonsModule, PlacesModule, CollectionsModule, AtlasModule, NotificationsModule, TripMembershipModule],
  controllers: [PluginsController, PluginsFeedController, PluginsProxyController, PluginFrameController, PlaceDetailsController, TripWarningsController, ViewContributionsController, TripCardContributionsController, PluginPhotosController, PluginCalendarController, MapMarkersController, MapLayersController, PluginRoutesController, DayScheduleController, DayTintsController, PdfSectionsController, AtlasLayersController, JournalEntryRowsController, PluginUserSettingsController, PluginOAuthController, PluginActivityController, PoiCategoriesController],
  providers: [PluginsService, PluginRuntimeService, PluginRegistryService, PluginOAuthService, PluginHostDepsFactory],
  // Exported so the admin addon-toggle handler can cascade-disable plugins whose
  // required addon was just turned off (#plugins dependencies).
  exports: [PluginRuntimeService],
})
export class PluginsModule {}
