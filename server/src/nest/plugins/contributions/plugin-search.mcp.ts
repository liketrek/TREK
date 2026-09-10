import { z } from 'zod';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext, type McpTextResult } from '../../../nest-mcp';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import {
  interleave,
  limitFrom,
  MAX_QUERY,
  nearFrom,
  normalizeSearchHits,
  type SearchHit,
} from './plugin-search.helpers';

/**
 * The MCP half of GET /api/plugin-search (#2221).
 *
 * The browser merges the plugin hits into its own search list, so a person searching
 * for a hotel sees the installed index alongside OpenStreetMap without asking. An
 * assistant calling `search_place` saw only TREK's own indexes, which is the same
 * asymmetry `get_trip_warnings` exists to close: what the user can see, the assistant
 * has to be able to see.
 *
 * A tool of its own rather than a section of `search_place`, for the reason spelled out
 * in trip-warnings.mcp.ts: `search_place` lives in PlacesModule, the plugin runtime
 * already imports PlacesModule, and reaching the hooks from there would close a module
 * cycle. It is also a different cost — an IPC round trip into every installed provider
 * with a four-second budget, against a synchronous call into the maps service.
 */
@McpController()
export class PluginSearchMcp {
  constructor(private readonly hooks: PluginHooks) {}

  @Tool({
    name: 'search_places_via_plugins',
    description: 'Search for a place in the search indexes installed plugins provide, which are the ones TREK does not ship itself. Use it alongside search_place, never instead of it: search_place is TREK\'s own index and OpenStreetMap, this is whatever else the instance owner installed, and only these results can carry a rating — open data has none, so a question like "the best rated hotel near here" can only be answered from this list. Results have the same shape search_place returns, plus a `rating` and the `pluginId` that found them. Returns an empty list when no plugin provides a search index, which is the normal case.',
    inputSchema: {
      query: z.string().min(1).max(MAX_QUERY).describe('Place name or address to search for'),
      near: z.object({ lat: z.number(), lng: z.number() })
        .optional()
        .describe('Centre the search on a coordinate. Pass it whenever the trip has a destination: a bare name like "Central Station" otherwise resolves wherever the provider guesses'),
      lang: z.string().max(20).optional().describe('BCP 47 language for the result names, e.g. "de" or "ja"'),
      limit: z.number().int().positive().max(20).optional().describe('How many results per provider (default 10, capped at 20)'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async searchViaPlugins(
    { query, near, lang, limit }: {
      query: string; near?: { lat: number; lng: number }; lang?: string; limit?: number;
    },
    ctx: McpContext,
  ): Promise<McpTextResult> {
    if (!pluginsEnabled()) return ok({ places: [] });
    const ids = this.hooks.providersOf('searchProvider');
    if (ids.length === 0) return ok({ places: [] });

    // Built through the same helpers the REST route uses, so a cap that holds for the
    // browser holds for the assistant. `near` arrives typed here and still goes through
    // nearFrom, because a schema that accepts any number still accepts latitude 91.
    const request = {
      query: query.trim().slice(0, MAX_QUERY),
      limit: limitFrom(limit),
      lang,
      near: nearFrom(near?.lat, near?.lng),
    };
    const results = await Promise.all(
      ids.map(async (id): Promise<SearchHit[]> => {
        try {
          return normalizeSearchHits(id, await this.hooks.searchPlaces(id, request, ctx.userId));
        } catch {
          return []; // a slow or failing provider contributes nothing, it does not fail the tool
        }
      }),
    );
    return ok({ places: interleave(results) });
  }
}
