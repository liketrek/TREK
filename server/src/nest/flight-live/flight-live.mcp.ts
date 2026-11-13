import { noAccess } from '../../mcp/tools/_shared';
import { McpController, ok, Tool, TOOL_ANNOTATIONS_READONLY, type McpContext } from '../../nest-mcp';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { FlightLiveService } from './flight-live.service';
import { idSchema, tripFlightLiveResponseSchema } from '@trek/shared';

/**
 * get_trip_flight_status, the twin of GET /api/trips/:tripId/flights/live:
 * the same service method behind the same check (the caller must see the
 * trip; reading the bookings needs nothing more). The answer is parsed
 * against the REST route's response contract, so both surfaces say the same.
 */
@McpController()
export class FlightLiveMcp {
  constructor(
    private readonly live: FlightLiveService,
    private readonly access: TripAccessService,
  ) {}

  @Tool({
    name: 'get_trip_flight_status',
    description:
      "Get the live status of a trip's booked flights, one entry per flight leg with a known flight number and both airports: the schedule in UTC with each airport's time zone, the phase (scheduled, taxiing, airborne, landed, unknown), observed wheels-up and touchdown, an estimated arrival with the delays worked out from it, progress and distances along the great circle, the last position with altitude and speed, and the aircraft's registration and type. Positions come from free open ADS-B feeds, so gates, terminals and cancellations are not known, and every delay and arrival time is an estimate. `enabled` is false when the admin switched live flight status off; `attribution` is the credit line to show with the data.",
    inputSchema: { tripId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'reservations', mode: 'read' },
  })
  async getTripFlightStatus({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    return ok(tripFlightLiveResponseSchema.parse(await this.live.tripFlights(tripId)));
  }
}
