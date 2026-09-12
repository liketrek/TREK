import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  demoDenied,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { AuthService } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { RoadtripPreferencesService } from './roadtrip-preferences.service';
import { roadtripPreferencesUpdateSchema, type RoadtripPreferences } from '@trek/shared';

import { z } from 'zod';

const when = addonGate(ADDON_IDS.ROADTRIP);

@McpController()
export class RoadtripPreferencesMcp {
  constructor(
    private readonly preferences: RoadtripPreferencesService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
    private readonly db: DatabaseService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'get_roadtrip_settings',
    description:
      'Read the shared driving preferences for one trip, including daily start and end times, day-ending behavior, vehicle specifications, range, fill percentage, driving limits, avoided road classes and route display options. Every member of this trip sees the same preferences. Missing numbers mean no limit, missing daily times disable automatic scheduling, missing vehicle means unspecified, and missing end mode means route. Range and consumption always use kilometres, litres and kWh. Instance URLs and credentials are not exposed.',
    inputSchema: { tripId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when,
  })
  async read({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    return ok({ tripId, settings: this.preferences.read(tripId), scope: 'trip' });
  }

  @Tool({
    name: 'update_roadtrip_settings',
    description:
      'Change the shared driving preferences for this trip. Changes apply to all its travellers and require permission to edit days. Read get_roadtrip_settings first for relative changes. Daily times use HH:mm; clear either with an empty string to disable automatic daily scheduling. Fixed visit times retain priority. Numeric zero clears a limit. Vehicle specifications take precedence over manual range when complete; clear the relevant specifications to use a manual range. Avoid classes are a comma-separated selection of toll,motorway,ferry. Unspecified fields remain unchanged. End mode route pauses at the cutoff; stop ends at the last reachable visit. Per-visit end_day and dragged boundaries are edited with set_assignment_end_day and set_day_boundary. This never changes instance routing URLs or credentials.',
    inputSchema: { tripId: z.number().int().positive(), settings: roadtripPreferencesUpdateSchema },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
    when,
  })
  async update({ tripId, settings }: { tripId: number; settings: RoadtripPreferences }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    return ok({ tripId, settings: this.preferences.update(tripId, settings), scope: 'trip' });
  }
}
