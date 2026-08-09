import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { JourneyDomainModule } from '../journey/journey-domain.module';
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
import { PluginHooks } from './plugin-hooks.service';
import { PluginRegistryService } from './registry/registry.service';
import { PluginRpcHostFactory } from './host/plugin-rpc-host.factory';
import { PluginRpcRegistryService } from './host/rpc-kit/registry.service';
import { PluginGuardsModule } from './host/plugin-guards.module';
import { DbRpc } from './host/rpc/db.rpc';
import { MetaRpc } from './host/rpc/meta.rpc';
import { HostSurfaceRpc } from './host/rpc/host-surface.rpc';
import { WeatherModule } from '../weather/weather.module';
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
  // Every domain module whose @PluginController providers own part of the plugin wire
  // surface. The list has to be COMPLETE, not just "whatever this module's own code
  // needs": PluginRpcRegistryService validates total coverage at boot, so a domain
  // reachable only via AppModule would make PluginsModule fail to start in any test
  // app that assembles a subset (WeatherModule is here for exactly that reason, and
  // for nothing else). Importing PluginsModule therefore pulls in the whole surface.
  //
  // DatabaseModule is @Global, so not listed. DiscoveryModule is what lets
  // PluginRpcRegistryService find those providers at boot. PluginGuardsModule is a leaf
  // that hands the resource gates to the domain modules; it must not be this module,
  // because the domains would then have to import PluginsModule back and close a cycle.
  imports: [DiscoveryModule, PluginGuardsModule, WeatherModule, TagsModule, CategoriesModule, BudgetModule, ReservationsModule, TodoModule, PackingModule, DaysModule, AssignmentsModule, LlmParseModule, FilesModule, CollabModule, VacayModule, TripsModule, PermissionsModule, AuditModule, AddonsModule, PlacesModule, CollectionsModule, AtlasModule, NotificationsModule, TripMembershipModule, JourneyDomainModule],
  controllers: [PluginsController, PluginsFeedController, PluginsProxyController, PluginFrameController, PlaceDetailsController, TripWarningsController, ViewContributionsController, TripCardContributionsController, PluginPhotosController, PluginCalendarController, MapMarkersController, MapLayersController, PluginRoutesController, DayScheduleController, DayTintsController, PdfSectionsController, AtlasLayersController, JournalEntryRowsController, PluginUserSettingsController, PluginOAuthController, PluginActivityController],
  // DbRpc, MetaRpc and HostSurfaceRpc are the plugin surface that belongs to no
  // domain: the plugin's own sqlite, its namespaced entity metadata, and the
  // host-mediated calls (user lookup, broadcasts, notifications, LLM, OAuth, scheduler).
  providers: [PluginsService, PluginRuntimeService, PluginRegistryService, PluginOAuthService, PluginRpcHostFactory, PluginRpcRegistryService, PluginHooks, DbRpc, MetaRpc, HostSurfaceRpc],
  // Exported so the admin addon-toggle handler can cascade-disable plugins whose
  // required addon was just turned off (#plugins dependencies).
  exports: [PluginRuntimeService],
})
export class PluginsModule {}
