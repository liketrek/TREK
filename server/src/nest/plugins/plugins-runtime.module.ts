import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Plugins } from '../../db/entities/Plugins.entity';
import { PluginErrorLog } from '../../db/entities/PluginErrorLog.entity';
import { PluginScheduledTasks } from '../../db/entities/PluginScheduledTasks.entity';
import { PluginUserErasureQueue } from '../../db/entities/PluginUserErasureQueue.entity';
import { PluginEgressHosts } from '../../db/entities/PluginEgressHosts.entity';
import { PluginSettingsFields } from '../../db/entities/PluginSettingsFields.entity';
import { PluginActions } from '../../db/entities/PluginActions.entity';
import { PluginUserConfig } from '../../db/entities/PluginUserConfig.entity';
import { PluginEntityMetadata } from '../../db/entities/PluginEntityMetadata.entity';
import { PluginOauthTokens } from '../../db/entities/PluginOauthTokens.entity';
import { PluginOauthState } from '../../db/entities/PluginOauthState.entity';
import { PluginMetaMigrations } from '../../db/entities/PluginMetaMigrations.entity';
import { PluginCapabilityAudit } from '../../db/entities/PluginCapabilityAudit.entity';
import { Settings } from '../../db/entities/Settings.entity';
import { NotificationChannelPreferences } from '../../db/entities/NotificationChannelPreferences.entity';
import { Users } from '../../db/entities/Users.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Days } from '../../db/entities/Days.entity';
import { Places } from '../../db/entities/Places.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
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
import { SchedulingModule } from '../scheduling/scheduling.module';

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
    // Plan 3j Task 2 — every table `PluginRuntimeService`/`PluginsService`'s own
    // statements (PR1-PR53, PS1-PS13) touch, now repository-backed. This module is
    // where both classes are actually constructed, so it (not an importer) owns the
    // forFeature list — same reasoning `PluginGuardsModule`'s own docstring gives for
    // `Users`. `Settings`/`NotificationChannelPreferences` are cross-domain (3f) —
    // their OWN owning modules also register them; MikroOrmModule.forFeature is
    // idempotent per entity within one DI graph.
    MikroOrmModule.forFeature([
      Plugins, PluginErrorLog, PluginScheduledTasks, PluginUserErasureQueue, PluginEgressHosts,
      PluginSettingsFields, PluginActions, PluginUserConfig, PluginEntityMetadata,
      PluginOauthTokens, PluginOauthState, PluginMetaMigrations, PluginCapabilityAudit,
      Settings, NotificationChannelPreferences,
      // Plan 3j Task 5 — HostSurfaceRpc's (Users, Trips, PluginScheduledTasks
      // above) and MetaRpc's (PluginEntityMetadata above, Trips, Places, Days,
      // Reservations, DayAccommodations) own `@InjectRepository` params; both
      // classes are constructed in THIS module's `providers`, so — same
      // reasoning every entry above already documents — it owns their
      // registration too, even though `TripsModule`/`PlacesModule`/etc are
      // already imported (none of them export `MikroOrmModule`).
      Users, Trips, Days, Places, Reservations, DayAccommodations,
    ]),
    // A leaf that hands the resource gates to the domain modules. It must not be this
    // module: the domains would then have to import this one back and close a cycle.
    PluginGuardsModule,
    PluginOAuthModule,
    // Plan 3j Task 0 (R-scheduler): PluginRuntimeService now registers its persistent
    // scheduler sweep + GDPR erasure drain through CronRegistrarService, which lives
    // in a deliberately non-@Global module (server/CLAUDE.md: the one cron path) — so
    // it must be imported explicitly here, same as every other job-owning module
    // (place-shadow.module.ts is the precedent).
    SchedulingModule,
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
    // Owns no wire method; declares and performs all 21 host-to-plugin hook calls.
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
