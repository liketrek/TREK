/**
 * Type parity between the SDK's plugin API (src/index.ts) and the copy the host's plugin
 * child runs on (server/src/nest/plugins/runtime/plugin-sdk.ts). Both declare the same
 * names; vitest's typecheck mode compiles this file (vitest.config.ts enables it only
 * inside the monorepo, where the host file exists).
 *
 * Two kinds of name:
 *  - the plain shapes (requests, results, contributions) are the same type on both sides;
 *  - the shapes that carry a `ctx` are refined in the SDK: its PluginContext types the
 *    entity results (`Trip`, `Place`, …) and some requests where the host's child says
 *    `unknown`, so those are held to the same members (a method or field on one side
 *    only is the drift this catches, as `rawBodyBase64` was), not to one type.
 *
 * test/host-types-names.test.ts checks every name both files export is listed here.
 */
import { expectTypeOf, test } from 'vitest';
import type * as Sdk from '../src/index.js';
import type * as Host from '../../server/src/nest/plugins/runtime/plugin-sdk.js';

test('the plain shapes are one type on both sides', () => {
  expectTypeOf<Sdk.PluginResponse>().toEqualTypeOf<Host.PluginResponse>();
  expectTypeOf<Sdk.Photo>().toEqualTypeOf<Host.Photo>();
  expectTypeOf<Sdk.NotificationMessage>().toEqualTypeOf<Host.NotificationMessage>();
  expectTypeOf<Sdk.PluginActionResult>().toEqualTypeOf<Host.PluginActionResult>();
  expectTypeOf<Sdk.CalendarEvent>().toEqualTypeOf<Host.CalendarEvent>();
  expectTypeOf<Sdk.PlaceDetailItem>().toEqualTypeOf<Host.PlaceDetailItem>();
  expectTypeOf<Sdk.SearchResultPlace>().toEqualTypeOf<Host.SearchResultPlace>();
  expectTypeOf<Sdk.SearchRequest>().toEqualTypeOf<Host.SearchRequest>();
  expectTypeOf<Sdk.TripWarning>().toEqualTypeOf<Host.TripWarning>();
  expectTypeOf<Sdk.ContributionTone>().toEqualTypeOf<Host.ContributionTone>();
  expectTypeOf<Sdk.TableColumnContribution>().toEqualTypeOf<Host.TableColumnContribution>();
  expectTypeOf<Sdk.TableActionContribution>().toEqualTypeOf<Host.TableActionContribution>();
  expectTypeOf<Sdk.TableContribution>().toEqualTypeOf<Host.TableContribution>();
  expectTypeOf<Sdk.MapMarkerContribution>().toEqualTypeOf<Host.MapMarkerContribution>();
  expectTypeOf<Sdk.MapLayerFeature>().toEqualTypeOf<Host.MapLayerFeature>();
  expectTypeOf<Sdk.MapLayerContribution>().toEqualTypeOf<Host.MapLayerContribution>();
  expectTypeOf<Sdk.RouteWaypoint>().toEqualTypeOf<Host.RouteWaypoint>();
  expectTypeOf<Sdk.RouteRequest>().toEqualTypeOf<Host.RouteRequest>();
  expectTypeOf<Sdk.RouteLeg>().toEqualTypeOf<Host.RouteLeg>();
  expectTypeOf<Sdk.RouteViaPoint>().toEqualTypeOf<Host.RouteViaPoint>();
  expectTypeOf<Sdk.RouteProviderResult>().toEqualTypeOf<Host.RouteProviderResult>();
  expectTypeOf<Sdk.DayScheduleContribution>().toEqualTypeOf<Host.DayScheduleContribution>();
  expectTypeOf<Sdk.DayTintContribution>().toEqualTypeOf<Host.DayTintContribution>();
  expectTypeOf<Sdk.PdfSection>().toEqualTypeOf<Host.PdfSection>();
  expectTypeOf<Sdk.AtlasLayerCountry>().toEqualTypeOf<Host.AtlasLayerCountry>();
  expectTypeOf<Sdk.AtlasLayer>().toEqualTypeOf<Host.AtlasLayer>();
  expectTypeOf<Sdk.TripCardContribution>().toEqualTypeOf<Host.TripCardContribution>();
  expectTypeOf<Sdk.JournalEntryRow>().toEqualTypeOf<Host.JournalEntryRow>();
  expectTypeOf<Sdk.PluginRequest>().toEqualTypeOf<Host.PluginRequest>();
});

test('the shapes that carry a ctx have the same members on both sides', () => {
  expectTypeOf<keyof Sdk.PluginContext>().toEqualTypeOf<keyof Host.PluginContext>();
  expectTypeOf<keyof Sdk.PluginRoute>().toEqualTypeOf<keyof Host.PluginRoute>();
  expectTypeOf<keyof Sdk.PluginJob>().toEqualTypeOf<keyof Host.PluginJob>();
  expectTypeOf<keyof Sdk.PhotoProvider>().toEqualTypeOf<keyof Host.PhotoProvider>();
  expectTypeOf<keyof Sdk.NotificationChannel>().toEqualTypeOf<keyof Host.NotificationChannel>();
  expectTypeOf<keyof Sdk.CalendarSource>().toEqualTypeOf<keyof Host.CalendarSource>();
  expectTypeOf<keyof Sdk.PlaceDetailProvider>().toEqualTypeOf<keyof Host.PlaceDetailProvider>();
  expectTypeOf<keyof Sdk.SearchProvider>().toEqualTypeOf<keyof Host.SearchProvider>();
  expectTypeOf<keyof Sdk.PoiCategoryProvider>().toEqualTypeOf<keyof Host.PoiCategoryProvider>();
  expectTypeOf<keyof Sdk.WarningProvider>().toEqualTypeOf<keyof Host.WarningProvider>();
  expectTypeOf<keyof Sdk.TableContributor>().toEqualTypeOf<keyof Host.TableContributor>();
  expectTypeOf<keyof Sdk.MapMarkerProvider>().toEqualTypeOf<keyof Host.MapMarkerProvider>();
  expectTypeOf<keyof Sdk.MapLayerProvider>().toEqualTypeOf<keyof Host.MapLayerProvider>();
  expectTypeOf<keyof Sdk.RouteProvider>().toEqualTypeOf<keyof Host.RouteProvider>();
  expectTypeOf<keyof Sdk.DayScheduleProvider>().toEqualTypeOf<keyof Host.DayScheduleProvider>();
  expectTypeOf<keyof Sdk.DayTintProvider>().toEqualTypeOf<keyof Host.DayTintProvider>();
  expectTypeOf<keyof Sdk.PdfSectionProvider>().toEqualTypeOf<keyof Host.PdfSectionProvider>();
  expectTypeOf<keyof Sdk.AtlasLayerProvider>().toEqualTypeOf<keyof Host.AtlasLayerProvider>();
  expectTypeOf<keyof Sdk.TripCardProvider>().toEqualTypeOf<keyof Host.TripCardProvider>();
  expectTypeOf<keyof Sdk.JournalEntryProvider>().toEqualTypeOf<keyof Host.JournalEntryProvider>();
  expectTypeOf<keyof Sdk.PluginEventSubscription>().toEqualTypeOf<keyof Host.PluginEventSubscription>();
  expectTypeOf<keyof Sdk.PluginExport>().toEqualTypeOf<keyof Host.PluginExport>();
  expectTypeOf<keyof Sdk.PluginSubscription>().toEqualTypeOf<keyof Host.PluginSubscription>();
  expectTypeOf<keyof Sdk.McpToolProvider>().toEqualTypeOf<keyof Host.McpToolProvider>();
  expectTypeOf<keyof Sdk.PluginDefinition>().toEqualTypeOf<keyof Host.PluginDefinition>();
});

test('every ctx namespace offers the same methods on both sides', () => {
  type Members<T> = T extends (...args: never[]) => unknown ? never : keyof T;
  expectTypeOf<Members<Sdk.PluginContext['id']>>().toEqualTypeOf<Members<Host.PluginContext['id']>>();
  expectTypeOf<Members<Sdk.PluginContext['config']>>().toEqualTypeOf<Members<Host.PluginContext['config']>>();
  expectTypeOf<Members<Sdk.PluginContext['settings']>>().toEqualTypeOf<Members<Host.PluginContext['settings']>>();
  expectTypeOf<Members<Sdk.PluginContext['db']>>().toEqualTypeOf<Members<Host.PluginContext['db']>>();
  expectTypeOf<Members<Sdk.PluginContext['trips']>>().toEqualTypeOf<Members<Host.PluginContext['trips']>>();
  expectTypeOf<Members<Sdk.PluginContext['reservations']>>().toEqualTypeOf<Members<Host.PluginContext['reservations']>>();
  expectTypeOf<Members<Sdk.PluginContext['accommodations']>>().toEqualTypeOf<Members<Host.PluginContext['accommodations']>>();
  expectTypeOf<Members<Sdk.PluginContext['packing']>>().toEqualTypeOf<Members<Host.PluginContext['packing']>>();
  expectTypeOf<Members<Sdk.PluginContext['files']>>().toEqualTypeOf<Members<Host.PluginContext['files']>>();
  expectTypeOf<Members<Sdk.PluginContext['collab']>>().toEqualTypeOf<Members<Host.PluginContext['collab']>>();
  expectTypeOf<Members<Sdk.PluginContext['notify']>>().toEqualTypeOf<Members<Host.PluginContext['notify']>>();
  expectTypeOf<Members<Sdk.PluginContext['ai']>>().toEqualTypeOf<Members<Host.PluginContext['ai']>>();
  expectTypeOf<Members<Sdk.PluginContext['oauth']>>().toEqualTypeOf<Members<Host.PluginContext['oauth']>>();
  expectTypeOf<Members<Sdk.PluginContext['scheduler']>>().toEqualTypeOf<Members<Host.PluginContext['scheduler']>>();
  expectTypeOf<Members<Sdk.PluginContext['weather']>>().toEqualTypeOf<Members<Host.PluginContext['weather']>>();
  expectTypeOf<Members<Sdk.PluginContext['rates']>>().toEqualTypeOf<Members<Host.PluginContext['rates']>>();
  expectTypeOf<Members<Sdk.PluginContext['categories']>>().toEqualTypeOf<Members<Host.PluginContext['categories']>>();
  expectTypeOf<Members<Sdk.PluginContext['tags']>>().toEqualTypeOf<Members<Host.PluginContext['tags']>>();
  expectTypeOf<Members<Sdk.PluginContext['todos']>>().toEqualTypeOf<Members<Host.PluginContext['todos']>>();
  expectTypeOf<Members<Sdk.PluginContext['journal']>>().toEqualTypeOf<Members<Host.PluginContext['journal']>>();
  expectTypeOf<Members<Sdk.PluginContext['atlas']>>().toEqualTypeOf<Members<Host.PluginContext['atlas']>>();
  expectTypeOf<Members<Sdk.PluginContext['vacay']>>().toEqualTypeOf<Members<Host.PluginContext['vacay']>>();
  expectTypeOf<Members<Sdk.PluginContext['collections']>>().toEqualTypeOf<Members<Host.PluginContext['collections']>>();
  expectTypeOf<Members<Sdk.PluginContext['daynotes']>>().toEqualTypeOf<Members<Host.PluginContext['daynotes']>>();
  expectTypeOf<Members<Sdk.PluginContext['costs']>>().toEqualTypeOf<Members<Host.PluginContext['costs']>>();
  expectTypeOf<Members<Sdk.PluginContext['places']>>().toEqualTypeOf<Members<Host.PluginContext['places']>>();
  expectTypeOf<Members<Sdk.PluginContext['days']>>().toEqualTypeOf<Members<Host.PluginContext['days']>>();
  expectTypeOf<Members<Sdk.PluginContext['itinerary']>>().toEqualTypeOf<Members<Host.PluginContext['itinerary']>>();
  expectTypeOf<Members<Sdk.PluginContext['meta']>>().toEqualTypeOf<Members<Host.PluginContext['meta']>>();
  expectTypeOf<Members<Sdk.PluginContext['users']>>().toEqualTypeOf<Members<Host.PluginContext['users']>>();
  expectTypeOf<Members<Sdk.PluginContext['ws']>>().toEqualTypeOf<Members<Host.PluginContext['ws']>>();
  expectTypeOf<Members<Sdk.PluginContext['log']>>().toEqualTypeOf<Members<Host.PluginContext['log']>>();
  expectTypeOf<Members<Sdk.PluginContext['plugins']>>().toEqualTypeOf<Members<Host.PluginContext['plugins']>>();
  expectTypeOf<Members<Sdk.PluginContext['events']>>().toEqualTypeOf<Members<Host.PluginContext['events']>>();
});
