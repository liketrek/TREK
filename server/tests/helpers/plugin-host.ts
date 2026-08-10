import { DatabaseService } from '../../src/nest/database/database.service';
import { PluginRuntimeService } from '../../src/nest/plugins/plugin-runtime.service';
import { PluginUserSettingsService } from '../../src/nest/plugins/plugin-user-settings.service';
import type { PluginRegistryService } from '../../src/nest/plugins/registry/registry.service';
import { PluginRpcHostFactory } from '../../src/nest/plugins/host/plugin-rpc-host.factory';
import { PluginRpcRegistryService } from '../../src/nest/plugins/host/rpc-kit/registry.service';
import { createTestPluginRegistry } from '../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../src/nest/plugins/host/plugin-guards.service';
import { DbRpc } from '../../src/nest/plugins/host/rpc/db.rpc';
import { MetaRpc } from '../../src/nest/plugins/host/rpc/meta.rpc';
import { HostSurfaceRpc } from '../../src/nest/plugins/host/rpc/host-surface.rpc';
import { PluginHooks } from '../../src/nest/plugins/plugin-hooks.service';
import { PluginOAuthService } from '../../src/nest/plugins/oauth/plugin-oauth.service';
import { BudgetService } from '../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../src/nest/budget/exchange-rates.service';
import { ReservationsService } from '../../src/nest/reservations/reservations.service';
import { TagsService } from '../../src/nest/tags/tags.service';
import { CategoriesService } from '../../src/nest/categories/categories.service';
import { TodoService } from '../../src/nest/todo/todo.service';
import { PackingService } from '../../src/nest/packing/packing.service';
import { DayNotesService } from '../../src/nest/day-notes/day-notes.service';
import { DaysService } from '../../src/nest/days/days.service';
import { AssignmentsService } from '../../src/nest/assignments/assignments.service';
import { LlmConfigResolver } from '../../src/nest/llm-parse/llm-config.resolver';
import { SettingsService } from '../../src/nest/settings/settings.service';
import { FilesService } from '../../src/nest/files/files.service';
import { CollabService } from '../../src/nest/collab/collab.service';
import { VacayService } from '../../src/nest/vacay/vacay.service';
import { TripsService } from '../../src/nest/trips/trips.service';
import { PlacesService } from '../../src/nest/places/places.service';
import { CollectionsService } from '../../src/nest/collections/collections.service';
import { AtlasService } from '../../src/nest/atlas/atlas.service';
import { MapsService } from '../../src/nest/maps/maps.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { AuditService } from '../../src/nest/audit/audit.service';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../src/nest/query-helpers/query-helpers.service';
import { TripMembershipService } from '../../src/nest/trip-membership/trip-membership.service';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { TagsRpc } from '../../src/nest/tags/tags.rpc';
import { CategoriesRpc } from '../../src/nest/categories/categories.rpc';
import { WeatherRpc } from '../../src/nest/weather/weather.rpc';
import { WeatherService } from '../../src/nest/weather/weather.service';
import { ExchangeRatesRpc } from '../../src/nest/budget/exchange-rates.rpc';
import { TodoRpc } from '../../src/nest/todo/todo.rpc';
import { DayNotesRpc } from '../../src/nest/day-notes/day-notes.rpc';
import { PackingRpc } from '../../src/nest/packing/packing.rpc';
import { FilesRpc } from '../../src/nest/files/files.rpc';
import { PlacesRpc } from '../../src/nest/places/places.rpc';
import { DaysRpc } from '../../src/nest/days/days.rpc';
import { AccommodationsRpc } from '../../src/nest/accommodations/accommodations.rpc';
import { AccommodationsService } from '../../src/nest/accommodations/accommodations.service';
import { TripMembersService } from '../../src/nest/trip-members/trip-members.service';
import { ItineraryRpc } from '../../src/nest/assignments/itinerary.rpc';
import { TripsRpc } from '../../src/nest/trips/trips.rpc';
import { CostsRpc } from '../../src/nest/budget/costs.rpc';
import { ReservationsRpc } from '../../src/nest/reservations/reservations.rpc';
import { CollabRpc } from '../../src/nest/collab/collab.rpc';
import { AtlasRpc } from '../../src/nest/atlas/atlas.rpc';
import { VacayRpc } from '../../src/nest/vacay/vacay.rpc';
import { JournalRpc } from '../../src/nest/journey/journal.rpc';
import { CollectionsRpc } from '../../src/nest/collections/collections.rpc';
import { makeNotificationsService } from './notifications';

/**
 * Hand-wired counterpart of the PluginsModule DI graph for no-Nest tests
 * (same pattern as mcp-test-controllers.ts): real domain services over the
 * test DB, so runtime tests exercise the same wiring production gets from
 * the container.
 *
 * It used to build one 26-argument deps factory. The plugin surface now lives in the
 * domains, so what it builds is the same set of `@PluginController()` instances the
 * container would discover, handed to the host factory as a registry.
 */
export function createPluginRpcHostFactory(dbs: DatabaseService): PluginRpcHostFactory {
  const permissions = new PermissionsService(dbs);
  const exchangeRates = new ExchangeRatesService();
  const realtime = new RealtimeService();
  const budget = new BudgetService(dbs, permissions, exchangeRates, realtime);
  const addons = new AddonsService(dbs);
  const queryHelpers = new QueryHelpersService(dbs);
  const todos = new TodoService(dbs, permissions, realtime);
  const packing = new PackingService(dbs, permissions, realtime);
  const files = new FilesService(dbs, permissions, realtime);
  const reservations = new ReservationsService(dbs, permissions, budget, realtime);
  const collab = new CollabService(dbs, permissions, realtime);
  const vacay = new VacayService(dbs, realtime);
  const days = new DaysService(dbs, permissions, realtime, queryHelpers);
  const places = new PlacesService(dbs, permissions, realtime, new MapsService(dbs), queryHelpers);
  const collections = new CollectionsService(dbs, permissions, realtime);
  const atlas = new AtlasService(dbs);
  const dayNotes = new DayNotesService(dbs, permissions, realtime);
  const assignments = new AssignmentsService(dbs, permissions, realtime, queryHelpers);
  const journey = new JourneyDomainService(dbs);
  const membership = new TripMembershipService(dbs, permissions, realtime);
  const notifications = makeNotificationsService(dbs, realtime);
  const llmConfig = new LlmConfigResolver(new SettingsService(dbs), dbs, addons);
  const oauth = new PluginOAuthService(dbs);
  const accommodations = new AccommodationsService(dbs, permissions, realtime);
  // Was 12 arguments for a 14-parameter constructor; unsplash and userCleanup were
  // undefined here and tsconfig only typechecks src, so nothing said so.
  const trips = new TripsService(dbs, reservations, days, permissions, budget, vacay, realtime, undefined as never);
  const members = new TripMembersService(dbs, budget, undefined as never, permissions, realtime);
  const guards = new PluginGuards(dbs, permissions, addons);

  const registry = createTestPluginRegistry([
    new TagsRpc(new TagsService(dbs)),
    new CategoriesRpc(new CategoriesService(dbs)),
    new WeatherRpc(new WeatherService()),
    new ExchangeRatesRpc(exchangeRates),
    new TodoRpc(todos, realtime, guards),
    new DayNotesRpc(dayNotes, realtime, guards),
    new PackingRpc(packing, realtime, guards),
    new FilesRpc(files, realtime, dbs, guards),
    new PlacesRpc(places, journey, realtime, guards),
    new DaysRpc(days, realtime, guards),
    new AccommodationsRpc(accommodations, realtime, guards),
    new ItineraryRpc(assignments, realtime, guards),
    new TripsRpc(trips, reservations, days, membership, dbs, realtime, guards, accommodations, members),
    new CostsRpc(budget, dbs, realtime, guards),
    new ReservationsRpc(reservations, realtime, guards),
    new CollabRpc(collab, realtime, guards),
    new AtlasRpc(atlas, guards),
    new VacayRpc(vacay, guards),
    new JournalRpc(journey, guards),
    new CollectionsRpc(collections, guards),
    new DbRpc(new PluginUserSettingsService(dbs)),
    new MetaRpc(dbs, guards),
    new HostSurfaceRpc(dbs, realtime, notifications, llmConfig, oauth, guards),
    new PluginHooks(undefined as never),
  ]);
  return new PluginRpcHostFactory(dbs, registry as unknown as PluginRpcRegistryService);
}

/** A PluginRuntimeService constructed the way Nest would: with a real host factory. */
export function createPluginRuntime(dbs: DatabaseService, registry?: PluginRegistryService): PluginRuntimeService {
  return new PluginRuntimeService(dbs, new AuditService(dbs), new AddonsService(dbs), new PluginUserSettingsService(dbs), registry, createPluginRpcHostFactory(dbs));
}
