import { PLUGIN_POI_CATEGORY_ID_RE, PLUGIN_POI_PLUGIN_ID_RE, isOrderedPoiBbox } from '@trek/shared';
import { z } from 'zod';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, errorResult, ok, type McpContext } from '../../../nest-mcp';
import { POI_BBOX_TOOL_INPUT } from '../../maps/maps.helpers';
import { PluginPoisService } from './plugin-pois.service';

/**
 * The MCP half of the plugin POI categories (#1781): the chips a plugin adds to the
 * explore pill, and GET /api/plugin-pois behind them.
 *
 * Two tools because the browser has two reads: the feed that tells the pill which
 * chips exist, and the search one chip runs. An assistant cannot guess a plugin's
 * category ids, so it lists them first. Both sit here rather than beside
 * `search_pois` for the module-cycle reason plugin-search.mcp.ts gives, and both use
 * `search_pois`' access group, since they answer the same question for other sources.
 */
@McpController()
export class PluginPoisMcp {
  constructor(private readonly pois: PluginPoisService) {}

  @Tool({
    name: 'list_plugin_poi_categories',
    description: 'List the extra place categories installed plugins add to the trip map\'s "Explore places" bar, such as hiking trailheads, EV chargers, wheelchair-accessible places, public toilets and drinking water, or campsites. Each entry names the plugin (`pluginId`) and its own category id (`id`), which is what search_plugin_pois takes. Returns an empty list when no plugin adds categories, which is the normal case; the built-in categories are the ones search_pois covers.',
    inputSchema: {
      lang: z.string().max(35).optional().describe('Language for the category labels, e.g. "de". Falls back to the plugin\'s default label'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  listCategories({ lang }: { lang?: string }, _ctx: McpContext) {
    return ok({ categories: this.pois.available(lang) });
  }

  @Tool({
    name: 'search_plugin_pois',
    description: 'List the places of one plugin-provided category (from list_plugin_poi_categories) inside a map rectangle, as the plugin answers them. Results have the shape search_pois returns, plus the `pluginId` that answered, a `rating` where the plugin has one, and `details`: up to six label and value rows only that plugin knows, such as a trail length or a step-free entrance. Use search_pois for the built-in categories. Never calls Google.',
    inputSchema: {
      pluginId: z.string().regex(PLUGIN_POI_PLUGIN_ID_RE).describe('The plugin that declared the category, from list_plugin_poi_categories'),
      category: z.string().regex(PLUGIN_POI_CATEGORY_ID_RE).describe('The plugin\'s own category id, from list_plugin_poi_categories'),
      bbox: POI_BBOX_TOOL_INPUT,
      lang: z.string().max(35).optional().describe('Language for the place names, e.g. "de", for plugins that carry localized names'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  async search(
    { pluginId, category, bbox, lang }: {
      pluginId: string;
      category: string;
      bbox: { south: number; west: number; north: number; east: number };
      lang?: string;
    },
    ctx: McpContext,
  ) {
    // The REST query schema refuses an inverted box; the same box as numbers here.
    if (!isOrderedPoiBbox(bbox)) return errorResult('A valid bbox (south, west, north, east) is required.');
    const outcome = await this.pois.search({ pluginId, category, bbox, lang }, ctx.userId);
    if ('error' in outcome) {
      return errorResult(
        outcome.status === 404
          ? 'Unknown plugin POI category. list_plugin_poi_categories names the ones installed.'
          : 'Plugin POI search failed.',
      );
    }
    return ok(outcome.result);
  }
}
