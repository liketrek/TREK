import { RESERVATION_METADATA } from '../../db/json-columns';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, ok, Tool, TOOL_ANNOTATIONS_READONLY, type McpContext } from '../../nest-mcp';
import { decodeJson } from '../../utils/json-column';
import { ReservationsService, type ReservationRow } from './reservations.service';
import {
  isTransportReservationType,
  listReservationsRequestSchema,
  type ListReservationsRequest,
  type ReservationReadKind,
} from '@trek/shared';

type Row = Record<string, unknown>;

/** The metadata keys a person reads on a booking; the rest (provider ids, a transit itinerary) stays stored. */
const DETAIL_KEYS = [
  'airline',
  'flight_number',
  'train_number',
  'platform',
  'seat',
  'check_in_time',
  'check_in_end_time',
  'check_out_time',
  'price',
  'priceCurrency',
] as const;

/** What a leg says about itself; its own booking reference stays with the booking. */
const LEG_KEYS = [
  'from',
  'to',
  'airline',
  'flight_number',
  'train_number',
  'platform',
  'seat',
  'dep_day_id',
  'dep_time',
  'arr_day_id',
  'arr_time',
] as const;

function recordOf(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
}

function picked(source: Row, keys: readonly string[]): Row {
  const out: Row = {};
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' || typeof value === 'number') out[key] = value;
  }
  return out;
}

/**
 * A booking's readable details out of its stored metadata: what the planner
 * shows on it. A reference kept on a leg stays stored too; `has_leg_reference`
 * says only that one exists.
 */
function bookingDetails(raw: unknown): Row {
  const meta = typeof raw === 'string' ? decodeJson(RESERVATION_METADATA, raw) : recordOf(raw);
  const details = picked(meta, DETAIL_KEYS);
  const legs = Array.isArray(meta.legs) ? meta.legs.map(recordOf) : [];
  if (legs.length > 1) details.legs = legs.map((leg) => picked(leg, LEG_KEYS));
  const ref = (leg: Row) => typeof leg.confirmation_number === 'string' && leg.confirmation_number.trim() !== '';
  if (legs.some(ref)) details.has_leg_reference = true;
  return details;
}

/** The days a booking touches: where it starts and ends, a leg's departure and arrival, a stay's check-in. */
function daysOf(row: ReservationRow, details: Row): number[] {
  const legs = Array.isArray(details.legs) ? details.legs.map(recordOf) : [];
  return [
    row.day_id,
    row.end_day_id,
    row.accommodation_start_day_id,
    ...legs.flatMap((leg) => [leg.dep_day_id, leg.arr_day_id]),
  ].filter((value): value is number => typeof value === 'number');
}

function kindOf(row: ReservationRow): ReservationReadKind {
  return isTransportReservationType(row.type) ? 'transport' : 'booking';
}

/**
 * The trip's bookings as an assistant reads them, beside the summary every
 * turn loads. The summary hands the provider no metadata (it may hold
 * provider ids and a whole transit itinerary), so a flight number, a seat or
 * a check-in time never reached the model; this read carries them as
 * `details`, the booking reference still hidden by the assistant's redaction.
 * Read-only, core (offered on every step) and gated like the trip's other
 * booking reads.
 */
@McpController()
export class ReservationsReadMcp {
  constructor(private readonly reservations: ReservationsService) {}

  @Tool({
    name: 'list_reservations',
    description:
      'List the bookings of a trip with their readable details: flights, trains and hire cars (kinds ["transport"]), hotels, tables, tickets and tours (kinds ["booking"]), or both. Each carries its days, times, route endpoints, status, travellers and `details` (airline, flight or train number, platform, seat, legs of a stopover booking, check-in and check-out times, price). Use it to answer about bookings instead of get_trip_summary, which leaves these details out. dayId keeps the bookings on that day.',
    inputSchema: listReservationsRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'reservations', mode: 'read' },
  })
  async listReservations({ tripId, kinds, dayId }: ListReservationsRequest, ctx: McpContext) {
    if (!(await this.reservations.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    const wanted = new Set<ReservationReadKind>(kinds ?? ['transport', 'booking']);
    const reservations = (await this.reservations.list(tripId)).flatMap((row) => {
      const { metadata, ...rest } = row;
      const details = bookingDetails(metadata);
      if (!wanted.has(kindOf(row))) return [];
      if (dayId !== undefined && !daysOf(row, details).includes(dayId)) return [];
      return [{ ...rest, details }];
    });
    return ok({ reservations });
  }
}
