import { PluginController, PluginHook } from './host/rpc-kit/decorators';
import { PluginRuntimeService } from './plugin-runtime.service';

/** What a notification channel is handed for one message. */
export interface HookChannelMessage {
  event: string;
  title: string;
  body: string;
  url?: string;
  tripName?: string;
}

/** One MCP tool call, as the plugin that published the tool receives it. */
export interface HookMcpToolCall {
  /** The plugin-local tool name, without the `plugin_<id>_` advertisement prefix. */
  name: string;
  /** Whatever the assistant passed. Validated against the declared schema first. */
  args: unknown;
}

/** The waypoint request a route provider is asked to solve. */
export interface HookRouteRequest {
  tripId: number;
  dayId: number | null;
  profile: string;
  waypoints: unknown[];
}

/**
 * Every host-to-plugin hook call, in one place.
 *
 * The 15 hooks the consent screen offers used to be invoked straight from the
 * controllers, with the fn name and the timeout written out at each call site. That
 * made three things impossible to check: that a granted `hook:*` permission actually
 * has a consumer (a dead grant on the consent screen looks exactly like a live one),
 * that the fn name the host asks for matches the one the SDK documents, and that two
 * call sites for the same hook agree on the budget.
 *
 * Each method here carries a `@PluginHook` declaration, which the registry validates
 * against HOOK_PERMISSION at boot and, with requireTotalCoverage on, fails the app for
 * any hook that no longer has a consumer. The declaration and the invocation are the
 * same method on purpose, so the two cannot drift apart.
 *
 * Timeouts are the plugin's budget to answer. They are deliberately not uniform:
 * a name lookup is cheap, a route solve over a full day is not, and a notification
 * channel is talking to somebody else's API.
 */
@PluginController()
export class PluginHooks {
  constructor(private readonly runtime: PluginRuntimeService) {}

  /** The plugins that declared `hook`, in manifest order. */
  providersOf(hook: string): string[] {
    return this.runtime.providersOf(hook);
  }

  @PluginHook('photoProvider', { permission: 'hook:photo-provider', fn: 'search', timeoutMs: 5000 })
  searchPhotos(pluginId: string, query: string, page: number, limit: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'photoProvider', 'search', [query, { page, limit }], userId, 5000);
  }

  @PluginHook('photoProvider', { permission: 'hook:photo-provider', fn: 'getById', timeoutMs: 5000 })
  getPhoto(pluginId: string, photoId: string, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'photoProvider', 'getById', [photoId], userId, 5000);
  }

  // A display name is a one-field read, so it gets a shorter leash than the feed it
  // labels; the caller falls back to the plugin id when it times out.
  @PluginHook('calendarSource', { permission: 'hook:calendar-source', fn: 'getName', timeoutMs: 3000 })
  calendarName(pluginId: string, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'calendarSource', 'getName', [], userId, 3000);
  }

  @PluginHook('calendarSource', { permission: 'hook:calendar-source', fn: 'getEvents', timeoutMs: 5000 })
  calendarEvents(pluginId: string, userId: number, start: string, end: string): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'calendarSource', 'getEvents', [userId, start, end], userId, 5000);
  }

  @PluginHook('placeDetailProvider', { permission: 'hook:place-detail-provider', fn: 'getDetails', timeoutMs: 5000 })
  placeDetails(pluginId: string, placeId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'placeDetailProvider', 'getDetails', [placeId], userId, 5000);
  }

  @PluginHook('warningProvider', { permission: 'hook:trip-warning-provider', fn: 'getWarnings', timeoutMs: 5000 })
  tripWarnings(pluginId: string, tripId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'warningProvider', 'getWarnings', [tripId], userId, 5000);
  }

  @PluginHook('tableContributor', { permission: 'hook:table-contributor', fn: 'getContributions', timeoutMs: 5000 })
  tableContributions(pluginId: string, view: string, tripId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'tableContributor', 'getContributions', [view, tripId], userId, 5000);
  }

  @PluginHook('mapMarkerProvider', { permission: 'hook:map-marker-provider', fn: 'getMarkers', timeoutMs: 5000 })
  mapMarkers(pluginId: string, tripId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'mapMarkerProvider', 'getMarkers', [tripId], userId, 5000);
  }

  @PluginHook('mapLayerProvider', { permission: 'hook:map-layer-provider', fn: 'getLayers', timeoutMs: 5000 })
  mapLayers(pluginId: string, tripId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'mapLayerProvider', 'getLayers', [tripId], userId, 5000);
  }

  // A route solve runs an external routing engine over a whole day of waypoints, so it
  // gets four times the budget of a plain read. The caller falls back to straight lines.
  @PluginHook('routeProvider', { permission: 'hook:route-provider', fn: 'getRoute', timeoutMs: 20_000 })
  route(pluginId: string, request: HookRouteRequest, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'routeProvider', 'getRoute', [request], userId, 20_000);
  }

  @PluginHook('dayScheduleProvider', { permission: 'hook:day-schedule-provider', fn: 'getSchedule', timeoutMs: 5000 })
  daySchedule(pluginId: string, tripId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'dayScheduleProvider', 'getSchedule', [tripId], userId, 5000);
  }

  @PluginHook('dayTintProvider', { permission: 'hook:day-tint-provider', fn: 'getDayTints', timeoutMs: 5000 })
  dayTints(pluginId: string, tripId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'dayTintProvider', 'getDayTints', [tripId], userId, 5000);
  }

  @PluginHook('pdfSectionProvider', { permission: 'hook:pdf-section-provider', fn: 'getSections', timeoutMs: 5000 })
  pdfSections(pluginId: string, tripId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'pdfSectionProvider', 'getSections', [tripId], userId, 5000);
  }

  @PluginHook('atlasLayerProvider', { permission: 'hook:atlas-layer-provider', fn: 'getLayers', timeoutMs: 5000 })
  atlasLayers(pluginId: string, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'atlasLayerProvider', 'getLayers', [], userId, 5000);
  }

  @PluginHook('journalEntryProvider', { permission: 'hook:journal-entry-provider', fn: 'getRows', timeoutMs: 5000 })
  journalRows(pluginId: string, entryId: number, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'journalEntryProvider', 'getRows', [entryId], userId, 5000);
  }

  @PluginHook('tripCardProvider', { permission: 'hook:trip-card-provider', fn: 'getCards', timeoutMs: 5000 })
  tripCards(pluginId: string, tripIds: number[], userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'tripCardProvider', 'getCards', [tripIds], userId, 5000);
  }

  /**
   * Both notification-channel calls run with NO acting user: a notification is
   * host-initiated for an arbitrary recipient, so the hook gets that recipient's own
   * decrypted config as an argument rather than the right to read anything as them.
   * The budget is the longest of the read hooks because the channel is talking to a
   * third-party API (Telegram, ntfy, a webhook) rather than to TREK.
   */
  @PluginHook('notificationChannel', { permission: 'hook:notification-channel', fn: 'send', timeoutMs: 8000 })
  sendNotification(pluginId: string, message: HookChannelMessage, userSettings: unknown): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'notificationChannel', 'send', [message, userSettings], undefined, 8000);
  }

  @PluginHook('notificationChannel', { permission: 'hook:notification-channel', fn: 'test', timeoutMs: 8000 })
  testNotification(pluginId: string, userSettings: unknown): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'notificationChannel', 'test', [userSettings], undefined, 8000);
  }

  /**
   * One MCP tool call the assistant made, dispatched into the plugin that
   * published the tool.
   *
   * The longest budget of any read hook. Every other one backs a render that a
   * user is waiting on, and falls back to something reasonable when it times
   * out; this one backs a chat turn, and the plugin is likely talking to a
   * third-party API of its own. Still well under the supervisor's 30s default,
   * which no hook uses: 30s of a blocked MCP request is not a budget, it is a
   * hung client.
   *
   * One fn for every tool, because tool names are runtime data and
   * hookContracts() is keyed by (hook, fn). The name is checked against the
   * advertised set before we get here.
   */
  @PluginHook('mcpToolProvider', { permission: 'mcp:tools', fn: 'callTool', timeoutMs: 15_000 })
  callMcpTool(pluginId: string, call: HookMcpToolCall, userId: number): Promise<unknown> {
    return this.runtime.invokeHook(pluginId, 'mcpToolProvider', 'callTool', [call], userId, 15_000);
  }
}
