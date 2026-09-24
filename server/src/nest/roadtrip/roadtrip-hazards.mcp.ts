import { z } from 'zod';
import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { DatabaseService } from '../database/database.service';
import { RoadtripHazardsService } from './roadtrip-hazards.service';

@McpController()
export class RoadtripHazardsMcp {
  constructor(private readonly hazards: RoadtripHazardsService, private readonly db: DatabaseService, readonly addons: AddonsService) {}
  @Tool({
    name: 'get_roadtrip_hazards',
    description: 'Read current DWD and GDACS hazard notices, geometry, source timestamps and feed availability. These are current notices, not forecasts for the trip dates or confirmed road closures. A point means no affected-area polygon is available. Coverage can be incomplete. This does not change routes. The shared roadtrip_show_hazards preference controls map display.',
    inputSchema: { tripId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY, access: { group: 'trips', mode: 'read' }, when: addonGate(ADDON_IDS.ROADTRIP),
  })
  async read({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    return ok(await this.hazards.read());
  }
}
