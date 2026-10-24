import { ADDON_IDS } from '../../addons';
import { McpController, TOOL_ANNOTATIONS_READONLY, Tool, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { JourneyMapService } from './journey-map.service';
import { idSchema, type JourneyMapLayerResult } from '@trek/shared';

const journeyAddonOn = addonGate(ADDON_IDS.JOURNEY);

/**
 * The journey map's layers (JRN-04) over MCP: the same service and the same
 * journey access as GET `/api/journeys/:id/map-layers`. The places and stays
 * come with their positions; a route answers with its name and size, never
 * its geometry.
 */
@McpController()
export class JourneyMapMcp {
  constructor(
    private readonly map: JourneyMapService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'get_journey_map_layers',
    description:
      "What a journey's map shows besides its entries and photos: the planned places of its linked trips (with the days the plan puts each on and, when one exists, the journal entry written about it; a planned place alone is no proof of a visit), the GPX routes of those trips while the journey's track switch is on, and the stays journal entries were taken over from (several per day report, each where it was recorded). Each source answers ok, or unavailable when it could not be read. The recorded days are listed by list_journey_recorded_days.",
    inputSchema: { journeyId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: journeyAddonOn,
    access: { group: 'journey', mode: 'read' },
  })
  async getJourneyMapLayers({ journeyId }: { journeyId: number }, ctx: McpContext) {
    const layers = await this.map.mapLayers(journeyId, ctx.userId);
    return ok({
      places: layers.places,
      routes: mapItems(layers.routes, (route) => ({
        place_id: route.place_id,
        trip_id: route.trip_id,
        name: route.name,
        points: route.points.length,
      })),
      stays: layers.stays,
    });
  }
}

function mapItems<T, U>(layer: JourneyMapLayerResult<T>, as: (item: T) => U): JourneyMapLayerResult<U> {
  return layer.status === 'ok' ? { status: 'ok', items: layer.items.map(as) } : layer;
}
