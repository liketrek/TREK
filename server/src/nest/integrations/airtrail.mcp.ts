import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  errorResult, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import type { AirtrailFlight } from '@trek/shared';
import { ADDON_IDS } from '../../addons';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { AirtrailService } from './airtrail.service';

/** Same gate as the controller's @RequireAddon(ADDON_IDS.AIRTRAIL): no addon, no tool. */
const airtrailAddonOn = addonGate(ADDON_IDS.AIRTRAIL);

/**
 * An AirTrail history grows for years, and the whole of it in one tool result
 * is context a model pays for on every turn. The picker in the browser can
 * afford the full list because a human scrolls it; a tool caller gets a window
 * and is told when the window cut something off.
 */
const DEFAULT_FLIGHT_LIMIT = 100;
const MAX_FLIGHT_LIMIT = 500;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an ISO date, YYYY-MM-DD');

/** The calendar day a flight belongs to, preferring AirTrail's own `date` over the departure instant. */
function flightDate(flight: AirtrailFlight): string | null {
  return flight.date ?? (flight.departure ? flight.departure.slice(0, 10) : null);
}

/**
 * Chronological, undated flights last. The window and the cap are only
 * meaningful over a stable order, and AirTrail returns its list in whatever
 * order its query produced.
 */
function byDeparture(a: AirtrailFlight, b: AirtrailFlight): number {
  const left = a.departure ?? a.date;
  const right = b.departure ?? b.date;
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * AirTrail MCP surface: the read half of the flight import, mirroring
 * GET /api/integrations/airtrail/flights (airtrail.controller.ts). Same
 * per-user scoping the route has (the flights are fetched with the caller's
 * own stored key, so a tool can only ever see that caller's own history), and
 * the same addon gate, expressed as `when:` so a disabled addon hides the tool
 * instead of answering it.
 *
 * The write half is not here: the import is trip-scoped and lives on the
 * /api/trips/:tripId/reservations/import prefix, so its tool sits in
 * reservation-import/ with the controller that owns that route.
 *
 * The connection settings routes (GET/PUT settings, status, test, sync) stay
 * off MCP on purpose: they take an API key, and the key is exactly the thing
 * settings:write promises never to touch.
 */
@McpController()
export class AirtrailMcp {
  constructor(
    private readonly airtrail: AirtrailService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_airtrail_flights',
    description: 'List the flights in the caller\'s connected AirTrail account, which are the ones available to import into a trip. Each entry carries the id that import_airtrail_flights takes, plus route, times, airline and flight number, so call this first and pass the ids you picked to that tool. Use it for flights that have already been flown or booked and recorded in AirTrail; a flight that exists nowhere yet is created with create_transport instead. Narrow it with from/to to the trip window rather than pulling a whole flight history.',
    inputSchema: {
      from: isoDate.optional().describe('Only flights departing on or after this date'),
      to: isoDate.optional().describe('Only flights departing on or before this date'),
      limit: z.number().int().min(1).max(MAX_FLIGHT_LIMIT).optional()
        .describe(`Maximum flights to return, oldest departure first (default ${DEFAULT_FLIGHT_LIMIT}, max ${MAX_FLIGHT_LIMIT})`),
    },
    // Reads a remote AirTrail instance, not TREK's own database.
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    // The flights are candidate bookings and the import writes reservations, so
    // the pair rides one group. There is no airtrail scope, and settings:read
    // covers preferences rather than travel data.
    access: { group: 'reservations', mode: 'read' },
    when: airtrailAddonOn,
  })
  async listAirtrailFlights(
    { from, to, limit }: { from?: string; to?: string; limit?: number },
    ctx: McpContext,
  ) {
    let flights: AirtrailFlight[];
    try {
      flights = await this.airtrail.getFlightsForPicker(ctx.userId);
    } catch (err) {
      // The route dresses this as a 400 or a 502; a tool caller can act on the
      // sentence, which already says whether AirTrail is unconnected or unreachable.
      return errorResult((err as Error)?.message || 'Could not load AirTrail flights');
    }

    // A flight with no date at all cannot be proven outside the window, and
    // dropping it would lose it silently, so it stays in and sorts last.
    const matched = flights.filter(flight => {
      const date = flightDate(flight);
      if (!date) return true;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    }).sort(byDeparture);

    const cap = limit ?? DEFAULT_FLIGHT_LIMIT;
    const page = matched.slice(0, cap);
    return ok({
      flights: page,
      total: matched.length,
      truncated: matched.length > page.length,
    });
  }
}
