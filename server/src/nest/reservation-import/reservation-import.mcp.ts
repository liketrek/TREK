import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { airtrailImportSchema } from '@trek/shared';
import { ADDON_IDS } from '../../addons';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { AuthService } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { AirtrailImportService } from '../integrations/airtrail-import.service';

/** The handler's own @RequireAddon(ADDON_IDS.AIRTRAIL), as an availability gate. */
const airtrailAddonOn = addonGate(ADDON_IDS.AIRTRAIL);

/**
 * The picker sends whatever a human ticked; a model can name a hundred ids off
 * one hallucinated list, and each one becomes a reservation and a broadcast.
 * The same reasoning as MAX_MCP_TRIP_DAYS: the tool surface caps a bulk write
 * the REST route leaves open, and says how to continue.
 */
const MAX_MCP_AIRTRAIL_FLIGHTS = 50;

/**
 * MCP surface for /api/trips/:tripId/reservations/import.
 *
 * Only the AirTrail half is here. The booking-file routes on the same prefix
 * take an uploaded EML/PDF/PKPass body, and MCP has no file to hand them; the
 * job-status route is the recovery path for a client that missed a WebSocket
 * push, which a tool caller never has.
 *
 * The guard chain on the controller is AddonGuard, JwtAuthGuard,
 * TripAccessGuard plus @RequirePermission('reservation_edit'), so the tool runs
 * the same three checks in the same order: demo, trip access (the 404
 * equivalent), then the identical permission action.
 */
@McpController()
export class ReservationImportMcp {
  constructor(
    private readonly airtrailImport: AirtrailImportService,
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'import_airtrail_flights',
    description: 'Import flights from the caller\'s connected AirTrail account into a trip as flight bookings, keeping them linked to AirTrail for two-way sync. Get the ids from list_airtrail_flights first; this tool only accepts ids that account already holds, so it cannot invent a flight. Prefer it over create_transport whenever the flight is already recorded in AirTrail: the route, times, airline and aircraft come across without retyping. Flights already on the trip are reported as skipped rather than duplicated.',
    inputSchema: {
      tripId: z.number().int().positive(),
      flightIds: airtrailImportSchema.shape.flightIds
        .describe(`AirTrail flight ids from list_airtrail_flights, at most ${MAX_MCP_AIRTRAIL_FLIGHTS} per call`),
      connections: airtrailImportSchema.shape.connections
        .describe('Chains of the ids above to import as ONE multi-leg booking each, with the connection airports as layover stops, e.g. [["12","13"]] for a flight with one change. Every id in a chain must also be in flightIds. A chain whose legs do not actually connect is imported as separate flights instead.'),
    },
    // Creating the same flights twice does not duplicate them (the dedupe
    // reports them skipped), but a call still creates rows, and it reaches out
    // to the AirTrail instance to re-read the flights it is given.
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
    access: { group: 'reservations', mode: 'write' },
    when: airtrailAddonOn,
  })
  async importAirtrailFlights(
    { tripId, flightIds, connections }: { tripId: number; flightIds: string[]; connections?: string[][] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('reservation_edit', tripId, ctx.userId)) return permissionDenied();

    if (flightIds.length > MAX_MCP_AIRTRAIL_FLIGHTS) {
      return errorResult(
        `Too many flights in one call (${flightIds.length}). Import at most ${MAX_MCP_AIRTRAIL_FLIGHTS} at a time.`,
      );
    }

    // The service quietly degrades a chain it cannot resolve to individual
    // imports, which is right for a picker that only ever sends ids it just
    // rendered. A model assembling the chain itself gets told instead, because
    // the silent version looks like a successful multi-leg import.
    const selected = new Set(flightIds);
    for (const chain of connections ?? []) {
      const stray = chain.find(id => !selected.has(id));
      if (stray !== undefined) {
        return errorResult(`Connection references flight ${stray}, which is not in flightIds.`);
      }
    }

    try {
      // socketId is undefined: there is no originating browser socket to spare
      // from the echo, so every member including the caller's own session gets
      // the reservation:created events the service broadcasts.
      const result = await this.airtrailImport.importAirtrailFlights(
        tripId, ctx.userId, flightIds, undefined, connections ?? [],
      );
      return ok(result);
    } catch (err) {
      return errorResult((err as Error)?.message || 'AirTrail import failed');
    }
  }
}
