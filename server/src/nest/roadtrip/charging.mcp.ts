import { z } from 'zod';
import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { DatabaseService } from '../database/database.service';
import { ChargingService } from './charging.service';

@McpController()
export class ChargingMcp {
  constructor(private readonly charging: ChargingService, private readonly db: DatabaseService, readonly addons: AddonsService) {}
  @Tool({ name: 'get_roadtrip_charging_info', description: 'Read open charging availability and published tariffs for a saved charging stop. No API key required. Coverage varies by region and operator. Unknown or stale status is not available capacity. Prices can have conditions and extra fees and are not personalized roaming quotes.',
    inputSchema: { tripId: z.number().int().positive(), placeId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY, access: { group: 'trips', mode: 'read' }, when: addonGate(ADDON_IDS.ROADTRIP) })
  async read({ tripId, placeId }: { tripId: number; placeId: number }, ctx: McpContext) {
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    return ok(await this.charging.read(tripId, placeId));
  }
}
