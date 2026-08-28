import { z } from 'zod';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext, type McpTextResult } from '../../../nest-mcp';
import { noAccess } from '../../../mcp/tools/_shared';
import { DatabaseService } from '../../database/database.service';
import { pluginsEnabled } from '../kill-switch';
import { PluginHooks } from '../plugin-hooks.service';
import { stripEmoji } from '../text-sanitize';

/**
 * The MCP half of GET /api/trip-warnings/:tripId (#1429).
 *
 * The web UI shows plugin warnings as a banner on the trip it belongs to, so a user
 * reviewing a trip sees "this hotel booking has no check-out day" without asking for
 * it. An assistant reviewing the same trip saw nothing: get_trip_summary loads the
 * trip's own rows and a warning is not a row, it is a plugin's live verdict on them.
 *
 * It is a tool of its own rather than a section of get_trip_summary because the two
 * have incompatible costs and dependencies. The summary is a synchronous SQLite read
 * out of TripReadModelService; a warning is an IPC round trip into every installed
 * warning provider, each with a 5 s budget. Folding it in would make the documented
 * "call this once to load the trip" loader wait on third-party child processes, and
 * would need TripReadModelModule to import the plugin runtime, which imports
 * TripsModule, which imports TripReadModelModule.
 */
type Level = 'info' | 'warning' | 'error';
interface Warning {
  pluginId: string;
  level: Level;
  message: string;
  dayId?: number;
  placeId?: number;
}

// Same two caps the REST route applies, for the same reason: one provider must not be
// able to flood the answer, and a warning is a banner line rather than a document.
const MAX_WARNINGS = 20;
const MESSAGE_MAX = 300;

@McpController()
export class TripWarningsMcp {
  constructor(
    private readonly hooks: PluginHooks,
    private readonly dbs: DatabaseService,
  ) {}

  @Tool({
    name: 'get_trip_warnings',
    description: 'Problems installed plugins report about a trip: a plugin flagging that something is wrong with the itinerary, such as an accommodation with no check-out, a day that cannot be travelled in the time it allows, or a place closed on the day it is planned for. get_trip_summary returns the trip\'s stored data and never these verdicts, so call this as well before reviewing a trip, reporting on it, or telling the user it looks fine. Returns an empty list when no installed plugin contributes warnings, which is the normal case.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
  })
  async getTripWarnings({ tripId }: { tripId: number }, ctx: McpContext): Promise<McpTextResult> {
    // Access first, so the answer to "may I look at this trip" does not depend on
    // whether an admin has the plugin system switched on.
    if (!this.dbs.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!pluginsEnabled()) return ok({ warnings: [] });

    const ids = this.hooks.providersOf('warningProvider');
    const perProvider = await Promise.all(
      ids.map(async (id): Promise<Warning[]> => {
        try {
          const raw = (await this.hooks.tripWarnings(id, tripId, ctx.userId)) as unknown;
          const list = Array.isArray(raw) ? (raw as unknown[]) : [];
          // Drop non-object elements BEFORE the cap: one null in the array would throw
          // inside map() and the catch below would discard everything this provider
          // returned, and the cap should count valid entries only.
          return list
            .filter((w): w is Record<string, unknown> => !!w && typeof w === 'object')
            .slice(0, MAX_WARNINGS)
            .map((w) => ({
              pluginId: id,
              level: w.level === 'error' || w.level === 'info' ? (w.level as Level) : 'warning',
              message: stripEmoji(String(w.message ?? '')).slice(0, MESSAGE_MAX),
              dayId: typeof w.dayId === 'number' ? w.dayId : undefined,
              placeId: typeof w.placeId === 'number' ? w.placeId : undefined,
            }));
        } catch {
          return []; // a slow or failing provider contributes nothing, it does not fail the tool
        }
      }),
    );
    return ok({ warnings: perProvider.flat().filter((w) => w.message) });
  }
}
