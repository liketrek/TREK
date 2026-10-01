import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PLUGIN_SEARCH_SUGGEST_MAX } from '@trek/shared';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import {
  collectHits,
  interleave,
  limitFrom,
  searchRequestFrom,
  type SearchHit,
} from './plugin-search.helpers';

/**
 * GET /api/plugin-search — places found by plugins implementing `searchProvider` (#2221).
 *
 * A search index TREK does not ship. The core search asks the TREK index and
 * OpenStreetMap; this asks whatever else the operator installed, and the client draws
 * one list out of both. Additive and fail-safe like the other provider-hook
 * controllers: a provider that errors or times out contributes nothing and the search
 * is drawn without it.
 *
 * NOT trip-scoped, unlike its neighbours here. Searching for a place is not a read of
 * anybody's trip: the query is the caller's own words and the answer is a public index,
 * so the gate is being signed in. Nothing about a trip is passed to the plugin, which
 * is also what keeps a search provider from becoming a way to enumerate one.
 *
 * A route of its own beside `POST /api/maps/search` rather than a branch inside it,
 * for the reason `trip-warnings.mcp.ts` documents next door: the plugin runtime already
 * imports PlacesModule, which imports MapsModule, so asking the providers from inside
 * the maps service would close a module cycle. The client calls both and merges.
 */
@Controller('api/plugin-search')
@UseGuards(JwtAuthGuard)
export class PluginSearchController {
  constructor(private readonly hooks: PluginHooks) {}

  @Get()
  async search(
    @Query('q') q: string | undefined,
    @Query('lat') lat: string | undefined,
    @Query('lng') lng: string | undefined,
    @Query('lang') lang: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ places: SearchHit[] }> {
    if (!pluginsEnabled()) return { places: [] };
    const userId = req.user?.id;
    // An empty query is not an error here: the client fires this beside every search,
    // and a blank box simply has nothing to ask a provider about.
    const request = searchRequestFrom(q, lat, lng, lang, limitFrom(limit));
    if (!request || userId == null) return { places: [] };

    const ids = this.hooks.providersOf('searchProvider');
    if (ids.length === 0) return { places: [] };
    return { places: interleave(await collectHits(ids, (id) => this.hooks.searchPlaces(id, request, userId))) };
  }

  /**
   * GET /api/plugin-search/suggest: the same indexes, asked while the query is typed.
   *
   * Only a provider that implements `suggest` is asked. One that implements `search`
   * alone has said its index cannot take a request per keystroke, which is the
   * normal case for anything behind a rate-limited API. At most three rows across
   * all providers, because they sit under the core suggestions in a list that has to
   * stay short enough to read while typing.
   */
  @Get('suggest')
  async suggest(
    @Query('q') q: string | undefined,
    @Query('lat') lat: string | undefined,
    @Query('lng') lng: string | undefined,
    @Query('lang') lang: string | undefined,
    @Req() req: Request & { user?: { id: number } },
  ): Promise<{ places: SearchHit[] }> {
    if (!pluginsEnabled()) return { places: [] };
    const userId = req.user?.id;
    // From the second character on, as the core autocomplete asks.
    const request = searchRequestFrom(q, lat, lng, lang, PLUGIN_SEARCH_SUGGEST_MAX, 2);
    if (!request || userId == null) return { places: [] };

    const ids = this.hooks.providersOf('searchProvider', 'suggest');
    if (ids.length === 0) return { places: [] };
    const found = await collectHits(ids, (id) => this.hooks.suggestPlaces(id, request, userId));
    return { places: interleave(found).slice(0, PLUGIN_SEARCH_SUGGEST_MAX) };
  }
}
