import { getAppUrl } from '../../app-config';
import { McpController, MCP_APP_MIME_TYPE, Resource, uiResource, type McpContext } from '../../nest-mcp';
import { McpAppsService } from './mcp-apps.service';
import { mcpAppUri, type McpAppWidget } from '@trek/shared';

/** A widget resource is listed only while its view may be offered (see McpAppsService.available). */
const offered = (widget: McpAppWidget) => (_ctx: McpContext, self: object) =>
  (self as McpAppsMcp).apps.available(widget);

/**
 * The widget documents, one `ui://` resource each. A widget reaches nothing on
 * its own: the host hands it the tool result, and the images it shows come from
 * this install, which is the one origin its sandbox may load from.
 */
@McpController()
export class McpAppsMcp {
  constructor(readonly apps: McpAppsService) {}

  private read(uri: URL, widget: McpAppWidget) {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: MCP_APP_MIME_TYPE,
          text: this.apps.html(widget) ?? '',
          _meta: uiResource({ csp: { resourceDomains: [getAppUrl()] }, prefersBorder: true }),
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
  async tripListWidget(uri: URL) {
    return this.read(uri, 'trip-list');
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
  async tripOverviewWidget(uri: URL) {
    return this.read(uri, 'trip-overview');
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
  async packingWidget(uri: URL) {
    return this.read(uri, 'packing');
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
  async weatherWidget(uri: URL) {
    return this.read(uri, 'weather');
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
  async placeResultsWidget(uri: URL) {
    return this.read(uri, 'place-results');
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
  async budgetWidget(uri: URL) {
    return this.read(uri, 'budget');
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
  async todosWidget(uri: URL) {
    return this.read(uri, 'todos');
  }
}
