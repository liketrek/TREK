import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { z } from 'zod';
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
    description: 'Fetch detailed information about a place by its Google Place ID.',
    inputSchema: {
      placeId: z.string().describe('Google Place ID'),
      lang: z.string().optional().default('en'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  async getPlaceDetails({ placeId, lang }: { placeId: string; lang?: string }, ctx: McpContext) {
    const details = await this.maps.getPlaceDetails(ctx.userId, placeId, lang ?? 'en');
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
}
