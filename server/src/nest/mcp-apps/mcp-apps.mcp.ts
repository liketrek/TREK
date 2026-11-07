import { getAppUrl, getMcpSafeUrl } from '../../app-config';
import {
  claudeUiDomain,
  isClaudeClient,
  McpController,
  MCP_APP_MIME_TYPE,
  Resource,
  uiResource,
  type McpContext,
  type McpDeclarativeAccess,
  type ResourceOptions,
} from '../../nest-mcp';
import { tileOrigin } from './map-tiles.helpers';
import { McpAppsService } from './mcp-apps.service';
import { mcpAppUri, type McpAppWidget } from '@trek/shared';

/**
 * One widget's `ui://` resource: listed only while its view may be offered (see
 * McpAppsService.available), and readable by the sessions that may read what
 * the view shows. Name, URI, MIME type and border are the same for every widget.
 */
function widgetResource(
  widget: McpAppWidget,
  title: string,
  description: string,
  group: McpDeclarativeAccess['group'],
): ResourceOptions {
  return {
    name: `widget-${widget}`,
    title,
    uri: mcpAppUri(widget),
    description,
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: (_ctx: McpContext, self: object) => (self as McpAppsMcp).apps.available(widget),
    access: { group, mode: 'read' },
  };
}

/**
 * The dedicated sandbox origin Claude draws this server's views in, for a
 * Claude client only and only while APP_URL is an address the MCP SDK accepts
 * as it is: Claude derives the origin from the exact server URL, so a domain
 * computed from a fallback address would not match and the view would fail.
 */
export function sandboxDomain(ctx: McpContext): string | undefined {
  if (!isClaudeClient(ctx.client?.())) return undefined;
  const appUrl = getAppUrl().replace(/\/+$/, '');
  if (getMcpSafeUrl().replace(/\/+$/, '') !== appUrl || !appUrl.startsWith('https://')) return undefined;
  return claudeUiDomain(`${appUrl}/mcp`);
}

/**
 * The widget documents, one `ui://` resource each. A widget reaches nothing on
 * its own: the host hands it the tool result, and the images it shows come from
 * this install, which is the one origin its sandbox may load from. The map view
 * also loads the tiles of the provider the reader's map settings name.
 */
@McpController()
export class McpAppsMcp {
  constructor(readonly apps: McpAppsService) {}

  /**
   * The widget's HTML. The resource is listed only while it was built, so a
   * missing document here means it went away after the listing: the read fails
   * and the host says so, rather than drawing an empty frame.
   */
  private document(widget: McpAppWidget): string {
    const html = this.apps.html(widget);
    if (html === null) throw new Error(`The ${widget} view is not available on this server.`);
    return html;
  }

  /** The widget's document, allowed to load images from this install and from the given origins. */
  private read(uri: URL, widget: McpAppWidget, ctx: McpContext, imageOrigins: string[] = []) {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: MCP_APP_MIME_TYPE,
          text: this.document(widget),
          _meta: uiResource({
            csp: { resourceDomains: [getAppUrl(), ...imageOrigins] },
            prefersBorder: true,
            domain: sandboxDomain(ctx),
          }),
        },
      ],
    };
  }

  @Resource(
    widgetResource('trip-list', 'Trip list view', 'The interactive view list_trips draws its trips with.', 'trips'),
  )
  async tripListWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'trip-list', ctx);
  }

  @Resource(
    widgetResource(
      'trip-overview',
      'Trip overview view',
      'The interactive view get_trip_overview draws its card with.',
      'trips',
    ),
  )
  async tripOverviewWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'trip-overview', ctx);
  }

  @Resource(
    widgetResource(
      'packing',
      'Packing list view',
      'The interactive checklist list_packing_items draws its items with.',
      'packing',
    ),
  )
  async packingWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'packing', ctx);
  }

  @Resource(widgetResource('weather', 'Weather view', 'The card get_weather draws its forecast with.', 'weather'))
  async weatherWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'weather', ctx);
  }

  @Resource(
    widgetResource(
      'place-results',
      'Place search results view',
      'The cards search_place draws its results with.',
      'places',
    ),
  )
  async placeResultsWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'place-results', ctx);
  }

  @Resource(
    widgetResource(
      'budget',
      'Budget view',
      'The card list_budget_items and get_budget_per_person draw the budget with.',
      'budget',
    ),
  )
  async budgetWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'budget', ctx);
  }

  @Resource(
    widgetResource('todos', 'To-do view', 'The interactive checklist list_todos draws its items with.', 'todos'),
  )
  async todosWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'todos', ctx);
  }

  @Resource(widgetResource('trip-map', 'Trip map view', 'The map get_trip_map draws the trip places on.', 'places'))
  async tripMapWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'trip-map', ctx, [tileOrigin(await this.apps.mapTiles(ctx.userId))]);
  }

  @Resource(widgetResource('day-plan', 'Day plan view', 'The timeline get_day_plan draws a day with.', 'trips'))
  async dayPlanWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'day-plan', ctx);
  }

  @Resource(widgetResource('poll', 'Poll view', 'The polls list_collab_polls draws, with their results.', 'collab'))
  async pollWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'poll', ctx);
  }
}
