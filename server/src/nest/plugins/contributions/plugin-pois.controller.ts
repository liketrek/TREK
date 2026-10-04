import { Controller, Get, HttpException, Query, UseGuards } from '@nestjs/common';
import { pluginPoiQuerySchema, type PluginPoiQuery, type PluginPoiResponse } from '@trek/shared';
import type { User } from '../../../types';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PluginPoisService, UNKNOWN_POI_CATEGORY } from './plugin-pois.service';

const BBOX_FIELDS: ReadonlySet<string> = new Set(['south', 'west', 'north', 'east', 'bbox']);

function missing(v: unknown): boolean {
  return v === undefined || (typeof v === 'string' && v.trim() === '');
}

/**
 * The query through the shared contract, with the bespoke messages of
 * GET /api/maps/pois for what the two routes share: the client already maps those two
 * strings, and a chip failing differently depending on whose chip it is would be
 * noise. A malformed plugin or category id is a 404, not a 400: nothing that shape
 * can be a declaration, which is the only thing this route answers for.
 */
export function parsePluginPoiQuery(raw: Record<string, unknown>): PluginPoiQuery {
  if (missing(raw.category)) throw new HttpException({ error: 'A category is required' }, 400);
  if (missing(raw.pluginId)) throw new HttpException({ error: 'A plugin is required' }, 400);
  const parsed = pluginPoiQuerySchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const fields = new Set(parsed.error.issues.map((i) => String(i.path[0] ?? '')));
  if ([...fields].some((f) => BBOX_FIELDS.has(f))) {
    throw new HttpException({ error: 'A valid bbox (south, west, north, east) is required' }, 400);
  }
  if (fields.has('lang')) throw new HttpException({ error: 'lang must be at most 35 characters' }, 400);
  throw new HttpException({ error: UNKNOWN_POI_CATEGORY }, 404);
}

/**
 * GET /api/plugin-pois: the places of ONE plugin POI category inside the map area the
 * user is looking at (#1781), for a chip a plugin added to the explore pill.
 *
 * Targeted like the plugin routes rather than a fan-out like the plugin search: the
 * chip names its plugin, so exactly that plugin is asked, and only for an id its
 * manifest declared (404 otherwise). The answer is the row shape of /api/maps/pois,
 * so the map draws it the way it draws a core category, plus the category's icon and
 * colour and the plugin's own detail rows.
 *
 * A route of its own rather than a branch of /api/maps/pois, for the module-cycle
 * reason plugin-search.controller.ts gives: the plugin runtime imports PlacesModule,
 * which imports MapsModule. The client sends plugin keys here and core keys there, so
 * a slow plugin (8 seconds, then 502) only ever holds up its own chip.
 *
 * Not trip-scoped, like the core route: the area is the caller's own viewport and
 * nothing about a trip is passed to the plugin.
 */
@Controller('api/plugin-pois')
@UseGuards(JwtAuthGuard)
export class PluginPoisController {
  constructor(private readonly pois: PluginPoisService) {}

  @Get()
  async list(@Query() raw: Record<string, unknown>, @CurrentUser() user: User): Promise<PluginPoiResponse> {
    const q = parsePluginPoiQuery(raw);
    const outcome = await this.pois.search(
      {
        pluginId: q.pluginId,
        category: q.category,
        bbox: { south: q.south, west: q.west, north: q.north, east: q.east },
        lang: q.lang,
      },
      user.id,
    );
    // `in` rather than `!outcome.ok`: the server compiles without strictNullChecks,
    // where a boolean discriminant does not narrow the union.
    if ('error' in outcome) throw new HttpException({ error: outcome.error }, outcome.status);
    return outcome.result;
  }
}
