import { z } from 'zod';
import { roadtripDayBoundarySchema, type RoadtripDayBoundary } from '@trek/shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE, ok, type McpContext } from '../../nest-mcp';
import { demoDenied, noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AddonsService } from '../addons/addons.service';
import { addonGate } from '../addons/addon-gate';
import { ADDON_IDS } from '../../addons';
import { DayBoundariesService } from './day-boundaries.service';

const when = addonGate(ADDON_IDS.ROADTRIP);

@McpController()
export class DayBoundariesMcp {
  constructor(
    private readonly boundaries: DayBoundariesService,
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
    private readonly realtime: RealtimeService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_day_boundaries', description: 'List manual road trip day endings. They apply only with daily travel times enabled.',
    inputSchema: { tripId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY, access: { group: 'trips', mode: 'read' }, when,
  })
  async list({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    return ok({ boundaries: this.boundaries.list(tripId) });
  }

  @Tool({
    name: 'set_day_boundary',
    description: 'Override a road trip day ending at a visit or a fraction along the driving leg between consecutive visits. Daily travel times must be enabled in the planner. Fixed visit times stay protected and conflicts are shown. Pass null to restore the automatic day ending.',
    inputSchema: { tripId: z.number().int().positive(), dayNumber: z.number().int().min(1).max(366), boundary: roadtripDayBoundarySchema.nullable() },
    annotations: TOOL_ANNOTATIONS_WRITE, access: { group: 'trips', mode: 'write' }, when,
  })
  async save({ tripId, dayNumber, boundary }: { tripId: number; dayNumber: number; boundary: RoadtripDayBoundary | null }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const boundaries = boundary
      ? this.boundaries.save(tripId, { ...boundary, day_number: dayNumber })
      : this.boundaries.remove(tripId, dayNumber);
    this.realtime.broadcast(String(tripId), 'roadtripBoundary:changed', { boundaries });
    return ok({ boundaries });
  }
}
