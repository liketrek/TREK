import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { PluginsService } from './plugins.service';
import { PluginUserSettingsService } from './plugin-user-settings.service';
import { PluginRuntimeService } from './plugin-runtime.service';
import { PluginHooks } from './plugin-hooks.service';
import { PluginRegistryService } from './registry/registry.service';
import { PluginRpcHostFactory } from './host/plugin-rpc-host.factory';
import { PluginRpcRegistryService } from './host/rpc-kit/registry.service';
import { PluginGuardsModule } from './host/plugin-guards.module';
import { PluginOAuthModule } from './oauth/plugin-oauth.module';
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
import { DayNotesModule } from '../day-notes/day-notes.module';
import { AccommodationsModule } from '../accommodations/accommodations.module';
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
import { JournalRpcModule } from '../journey/journal-rpc.module';

/**
 * The plugin execution half (#plugins, M1/M2): the process supervisor, the
 * capability router that every child talks to, and the hook contracts the host calls
 * back through.
 *
 * The domain import list has to be COMPLETE, not just "whatever this module's own
 * code needs". Every `@PluginController()` provider in the container contributes part
 * of the 113-method wire surface, and PluginRpcRegistryService validates total
 * coverage at boot — so a domain reachable only from AppModule would make this module
 * fail to start in any test app that assembles a subset. WeatherModule is in the list
 * for exactly that reason and for nothing else.
 *
 * Split out of PluginsModule so a consumer that needs the runtime alone — AdminModule
 * cascade-disabling plugins whose addon was just turned off — does not also pull in
 * 20 HTTP controllers it never calls.
 */
@Module({
  imports: [
    // What lets PluginRpcRegistryService find the @PluginController providers at boot.
    DiscoveryModule,
    // A leaf that hands the resource gates to the domain modules. It must not be this
    // module: the domains would then have to import this one back and close a cycle.
    PluginGuardsModule,
    PluginOAuthModule,
    WeatherModule, TagsModule, CategoriesModule, BudgetModule, ReservationsModule,
    TodoModule, PackingModule, DaysModule, DayNotesModule, AccommodationsModule, AssignmentsModule, LlmParseModule,
    FilesModule, CollabModule, VacayModule, TripsModule, PlacesModule,
    PermissionsModule, AuditModule, AddonsModule, CollectionsModule, AtlasModule,
    NotificationsModule, TripMembershipModule, JournalRpcModule,
  ],
  providers: [
    PluginsService,
    PluginUserSettingsService,
    PluginRuntimeService,
    PluginRegistryService,
    PluginRpcHostFactory,
    PluginRpcRegistryService,
    // Owns no wire method; declares and performs all 18 host-to-plugin hook calls.
    PluginHooks,
    // The wire surface that belongs to no domain: the plugin's own sqlite, its
    // namespaced entity metadata, and the host-mediated calls (user lookup,
    // broadcasts, notifications, LLM, OAuth, scheduler).
    DbRpc,
    MetaRpc,
    HostSurfaceRpc,
  ],
  exports: [PluginRuntimeService, PluginRegistryService, PluginsService, PluginUserSettingsService, PluginHooks],
})
export class PluginsRuntimeModule {}
