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
}
