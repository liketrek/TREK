import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, errorResult, ok, type McpContext } from '../../nest-mcp';
import { z } from 'zod';
import { POI_CATEGORY_KEYS } from './maps.helpers';
import { MapsService } from './maps.service';

/**
 * Geo MCP tools, moved 1:1 from the legacy registrar in
 * src/mcp/tools/mapsWeather.ts when the maps domain went DI-native (the weather
 * and airport tools stay there until their services migrate). Same names,
 * descriptions, input schemas and result shapes; the legacy registration-time
 * `canRead(scopes, 'geo')` gate became the declarative `access` marker ('geo'
 * is a read-only scope group — there is no geo:write).
 */
@McpController()
export class MapsMcp {
  constructor(private readonly maps: MapsService) {}

  @Tool({
    name: 'get_place_details',
    description: 'Fetch detailed information about a place by its Google Place ID. The plain lookup returns name, address, coordinates, rating, opening hours, phone and website, and always answers with an empty review list. Set expand only when visitor reviews or the editorial summary are what was actually asked for: that field mask bills as a Google Enterprise SKU and costs the instance owner several times a plain lookup.',
    inputSchema: {
      placeId: z.string().describe('Google Place ID'),
      lang: z.string().optional().default('en'),
      expand: z.boolean().optional().default(false).describe('Also fetch up to five visitor reviews and the editorial summary. Billed as an Enterprise SKU, so leave it off unless the answer needs them'),
      refresh: z.boolean().optional().default(false).describe('Bypass the cached expanded payload and re-fetch from the provider. Only does anything together with expand, and pays the expanded price again'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  async getPlaceDetails(
    { placeId, lang, expand, refresh }: { placeId: string; lang?: string; expand?: boolean; refresh?: boolean },
    ctx: McpContext,
  ) {
    // The admin kill switch, checked before either path. An instance owner who
    // turns Place Details off does it to stop Google billing them, and an
    // assistant reaching the provider anyway would bill them from the one
    // surface the switch does not cover. REST answers { place: null, disabled }
    // rather than an error, so this does too, with a line the model can act on.
    if (this.maps.detailsDisabled()) {
      return ok({
        details: null,
        disabled: true,
        note: 'Place Details is turned off on this instance by an administrator. Nothing was fetched.',
      });
    }

    // Same split the REST route makes, and for the same reason: the expanded
    // field mask is the expensive one, so nothing reaches it unless it was asked for.
    const details = expand
      ? await this.maps.getPlaceDetailsExpanded(ctx.userId, placeId, lang ?? 'en', refresh ?? false)
      : await this.maps.getPlaceDetails(ctx.userId, placeId, lang ?? 'en');
    return ok({ details });
  }

  @Tool({
    name: 'reverse_geocode',
    description: 'Get a human-readable address for given coordinates.',
    inputSchema: {
      lat: z.number(),
      lng: z.number(),
      lang: z.string().optional().default('en'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  async reverseGeocode({ lat, lng, lang }: { lat: number; lng: number; lang?: string }, _ctx: McpContext) {
    const result = await this.maps.reverseGeocode(String(lat), String(lng), lang ?? 'en');
    return ok(result);
  }

  @Tool({
    name: 'resolve_maps_url',
    description: 'Resolve a Google Maps share URL to coordinates and place name.',
    inputSchema: {
      url: z.string().describe('Google Maps share URL'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  async resolveMapsUrl({ url }: { url: string }, _ctx: McpContext) {
    const result = await this.maps.resolveGoogleMapsUrl(url);
    return ok(result);
  }

  /**
   * The MCP side of GET /api/maps/pois, the "explore" pill on the trip map. Not
   * part of the 1:1 move above: the route had no tool at all, which left the
   * whole discover-what-is-here half of the map unreachable from a conversation.
   */
  @Tool({
    name: 'search_pois',
    description: 'List OpenStreetMap points of interest of one category inside a map rectangle, with address, opening hours, website, phone and cuisine wherever OSM carries them. This is the discovery tool: use it to answer "what is around here" for a neighbourhood or a whole city district. Prefer search_place when the user already named the place they mean. Never calls Google, so it costs nothing and works on an instance with no Places key.',
    inputSchema: {
      category: z.enum(POI_CATEGORY_KEYS).describe('Which kind of place to look for'),
      bbox: z.object({
        south: z.number().min(-90).max(90).describe('Southern edge, latitude'),
        west: z.number().min(-180).max(180).describe('Western edge, longitude'),
        north: z.number().min(-90).max(90).describe('Northern edge, latitude'),
        east: z.number().min(-180).max(180).describe('Eastern edge, longitude'),
      }).describe('The rectangle to search. Anything wider than 0.5 degrees is narrowed to a centred window so the query stays fast; the answer reports that as `clamped`'),
      lang: z.string().max(35).optional().describe('Language for the POI names, e.g. "de" or "ja". Falls back to the OSM international name and then the local one'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  async searchPois(
    { category, bbox, lang }: {
      category: string;
      bbox: { south: number; west: number; north: number; east: number };
      lang?: string;
    },
    _ctx: McpContext,
  ) {
    try {
      return ok(await this.maps.pois(category, bbox, lang));
    } catch {
      // Overpass is a set of public mirrors; an outage there is not a bad request.
      return errorResult('POI search failed.');
    }
  }
}
