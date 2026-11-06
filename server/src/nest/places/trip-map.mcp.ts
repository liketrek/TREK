import { noAccess } from '../../mcp/tools/_shared';
import { McpController, okStructured, Tool, TOOL_ANNOTATIONS_READONLY, uiTool, type McpContext } from '../../nest-mcp';
import { McpAppsService } from '../mcp-apps/mcp-apps.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { PlacesService } from './places.service';
import {
  idSchema,
  mcpAppUri,
  TRIP_MAP_PAGE_DEFAULT,
  tripMapOutputSchema,
  tripMapPageSchema,
  type TripMapPage,
  type TripMapPlace,
} from '@trek/shared';

const located = (lat: unknown, lng: unknown): boolean => typeof lat === 'number' && typeof lng === 'number';

/**
 * The trip's places on a map: the ones with a location, a page at a time, and
 * the raster tiles the caller's map settings name. The map view draws it and
 * reads the further pages itself.
 */
@McpController()
export class TripMapMcp {
  constructor(
    private readonly places: PlacesService,
    private readonly trips: TripAccessService,
    private readonly apps: McpAppsService,
  ) {}

  @Tool({
    name: 'get_trip_map',
    title: 'Trip map',
    description: `The trip's places that have a location, for showing them on a map: id, name, lat, lng and address, up to ${TRIP_MAP_PAGE_DEFAULT} at a time from offset (go on at next_offset, null on the last page), with place_count over all of them. Places without coordinates are left out; list_places has every place.`,
    inputSchema: { tripId: idSchema, ...tripMapPageSchema.shape },
    outputSchema: tripMapOutputSchema,
    annotations: TOOL_ANNOTATIONS_READONLY,
    _meta: uiTool(mcpAppUri('trip-map'), { invoking: 'Drawing the map…', invoked: 'Map ready' }),
    access: { group: 'places', mode: 'read' },
  })
  async getTripMap({ tripId, offset, limit }: { tripId: number } & TripMapPage, ctx: McpContext) {
    if (!(await this.trips.findAccessible(tripId, ctx.userId))) return noAccess();
    const rows = await this.places.list(String(tripId), {});
    const all: TripMapPlace[] = rows
      .filter((row) => located(row.lat, row.lng))
      .map((row) => ({
        id: row.id,
        name: row.name,
        lat: Number(row.lat),
        lng: Number(row.lng),
        address: row.address ?? null,
      }));
    const start = offset ?? 0;
    const end = start + (limit ?? TRIP_MAP_PAGE_DEFAULT);
    return okStructured({
      trip_id: tripId,
      place_count: all.length,
      offset: start,
      next_offset: end < all.length ? end : null,
      places: all.slice(start, end),
      tiles: await this.apps.mapTiles(ctx.userId),
    });
  }
}
