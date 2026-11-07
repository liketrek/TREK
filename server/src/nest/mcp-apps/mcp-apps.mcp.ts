import { getAppUrl, getMcpSafeUrl } from '../../app-config';
import {
  claudeUiDomain,
  isClaudeClient,
  McpController,
  MCP_APP_MIME_TYPE,
  Resource,
  uiResource,
  type McpContext,
} from '../../nest-mcp';
import { tileOrigin } from './map-tiles.helpers';
import { McpAppsService } from './mcp-apps.service';
import { mcpAppUri, type McpAppWidget } from '@trek/shared';

/** A widget resource is listed only while its view may be offered (see McpAppsService.available). */
const offered = (widget: McpAppWidget) => (_ctx: McpContext, self: object) =>
  (self as McpAppsMcp).apps.available(widget);

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

  /** The widget's document, allowed to load images from this install and from the given origins. */
  private read(uri: URL, widget: McpAppWidget, ctx: McpContext, imageOrigins: string[] = []) {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: MCP_APP_MIME_TYPE,
          text: this.apps.html(widget) ?? '',
          _meta: uiResource({
            csp: { resourceDomains: [getAppUrl(), ...imageOrigins] },
            prefersBorder: true,
            domain: sandboxDomain(ctx),
          }),
        },
      ],
    };
  }

  @Resource({
    name: 'widget-trip-list',
    title: 'Trip list view',
    uri: mcpAppUri('trip-list'),
    description: 'The interactive view list_trips draws its trips with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('trip-list'),
    access: { group: 'trips', mode: 'read' },
  })
  async tripListWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'trip-list', ctx);
  }

  @Resource({
    name: 'widget-trip-overview',
    title: 'Trip overview view',
    uri: mcpAppUri('trip-overview'),
    description: 'The interactive view get_trip_overview draws its card with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('trip-overview'),
    access: { group: 'trips', mode: 'read' },
  })
  async tripOverviewWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'trip-overview', ctx);
  }

  @Resource({
    name: 'widget-packing',
    title: 'Packing list view',
    uri: mcpAppUri('packing'),
    description: 'The interactive checklist list_packing_items draws its items with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('packing'),
    access: { group: 'packing', mode: 'read' },
  })
  async packingWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'packing', ctx);
  }

  @Resource({
    name: 'widget-weather',
    title: 'Weather view',
    uri: mcpAppUri('weather'),
    description: 'The card get_weather draws its forecast with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('weather'),
    access: { group: 'weather', mode: 'read' },
  })
  async weatherWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'weather', ctx);
  }

  @Resource({
    name: 'widget-place-results',
    title: 'Place search results view',
    uri: mcpAppUri('place-results'),
    description: 'The cards search_place draws its results with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('place-results'),
    access: { group: 'places', mode: 'read' },
  })
  async placeResultsWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'place-results', ctx);
  }

  @Resource({
    name: 'widget-budget',
    title: 'Budget view',
    uri: mcpAppUri('budget'),
    description: 'The card list_budget_items and get_budget_per_person draw the budget with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('budget'),
    access: { group: 'budget', mode: 'read' },
  })
  async budgetWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'budget', ctx);
  }

  @Resource({
    name: 'widget-todos',
    title: 'To-do view',
    uri: mcpAppUri('todos'),
    description: 'The interactive checklist list_todos draws its items with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('todos'),
    access: { group: 'todos', mode: 'read' },
  })
  async todosWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'todos', ctx);
  }

  @Resource({
    name: 'widget-trip-map',
    title: 'Trip map view',
    uri: mcpAppUri('trip-map'),
    description: 'The map get_trip_map draws the trip places on.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('trip-map'),
    access: { group: 'places', mode: 'read' },
  })
  async tripMapWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'trip-map', ctx, [tileOrigin(await this.apps.mapTiles(ctx.userId))]);
  }

  @Resource({
    name: 'widget-day-plan',
    title: 'Day plan view',
    uri: mcpAppUri('day-plan'),
    description: 'The timeline get_day_plan draws a day with.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('day-plan'),
    access: { group: 'trips', mode: 'read' },
  })
  async dayPlanWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'day-plan', ctx);
  }

  @Resource({
    name: 'widget-poll',
    title: 'Poll view',
    uri: mcpAppUri('poll'),
    description: 'The polls list_collab_polls draws, with their results.',
    mimeType: MCP_APP_MIME_TYPE,
    _meta: uiResource({ prefersBorder: true }),
    when: offered('poll'),
    access: { group: 'collab', mode: 'read' },
  })
  async pollWidget(uri: URL, ctx: McpContext) {
    return this.read(uri, 'poll', ctx);
  }
}
