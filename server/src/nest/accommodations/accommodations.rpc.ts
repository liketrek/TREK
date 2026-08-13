import { accommodationCreateRequestSchema, accommodationUpdateRequestSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { AccommodationsService } from './accommodations.service';

/**
 * Accommodations hold db:write:accommodations but are gated on 'day_edit', NOT on
 * reservation_edit. The blocks live in the accommodation service and the REST path guards them
 * the same way; the decorator makes the mismatch visible instead of burying it.
 */
const ACCOMMODATION_EDIT_ACTION = 'day_edit';

type AccommodationInput = {
  place_id?: number | string;
  start_day_id?: number | string;
  end_day_id?: number | string;
  check_in?: string | null;
  check_in_end?: string | null;
  check_out?: string | null;
  confirmation?: string | null;
  notes?: string | null;
};

/**
 * The lodging-block surface a plugin may reach (#plugins).
 *
 * Everything delegates to AccommodationsService, so the auto-created partner hotel reservation,
 * the metadata sync on update and the delete cascade behave exactly like the
 * accommodations REST controller, cascade broadcasts included.
 */
@PluginController()
export class AccommodationsRpc {
  constructor(
    private readonly days: AccommodationsService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('accommodations.create', { permission: 'db:write:accommodations' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'accommodation');
    const parsed = accommodationCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid accommodation: ${schemaMessage(parsed.error)}`);
    this.guards.requireTripEdit(tripId, actor, ACCOMMODATION_EDIT_ACTION);
    const input = parsed.data as AccommodationInput;
    const placeId = Math.trunc(Number(input.place_id));
    const startDayId = Math.trunc(Number(input.start_day_id));
    const endDayId = Math.trunc(Number(input.end_day_id));
    if (!placeId || !startDayId || !endDayId) throw new BadParams('place_id, start_day_id, and end_day_id are required');
    // Verifies the place and both days belong to this trip.
    const errors = this.days.validateAccommodationRefs(tripId, placeId, startDayId, endDayId);
    if (errors.length > 0) throw new ForbiddenResource(errors[0].message);
    const accommodation = this.days.createAccommodation(tripId, {
      place_id: placeId,
      start_day_id: startDayId,
      end_day_id: endDayId,
      check_in: input.check_in ?? undefined,
      check_in_end: input.check_in_end ?? undefined,
      check_out: input.check_out ?? undefined,
      confirmation: input.confirmation ?? undefined,
      notes: input.notes ?? undefined,
    });
    this.realtime.broadcast(tripId, 'accommodation:created', { accommodation });
    // The block creates a partner hotel reservation, so the bookings view refreshes too.
    this.realtime.broadcast(tripId, 'reservation:created', {});
    return accommodation;
  }

  @PluginMethod('accommodations.update', { permission: 'db:write:accommodations' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const accommodationId = num(params.accommodationId, 'accommodationId');
    const actor = this.guards.requireActor(ctx, 'accommodation');
    const parsed = accommodationUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid accommodation: ${schemaMessage(parsed.error)}`);
    this.guards.requireTripEdit(tripId, actor, ACCOMMODATION_EDIT_ACTION);
    const existing = this.days.getAccommodation(accommodationId, tripId);
    if (!existing) throw new ForbiddenResource(`no accommodation ${accommodationId} on trip ${tripId}`);
    const input = parsed.data as { place_id?: number; start_day_id?: number; end_day_id?: number; check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string; notes?: string };
    const errors = this.days.validateAccommodationRefs(tripId, input.place_id, input.start_day_id, input.end_day_id);
    if (errors.length > 0) throw new ForbiddenResource(errors[0].message);
    const accommodation = this.days.updateAccommodation(accommodationId, existing, input);
    this.realtime.broadcast(tripId, 'accommodation:updated', { accommodation });
    return accommodation;
  }

  @PluginMethod('accommodations.delete', { permission: 'db:write:accommodations' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const accommodationId = num(params.accommodationId, 'accommodationId');
    const actor = this.guards.requireActor(ctx, 'accommodation');
    this.guards.requireTripEdit(tripId, actor, ACCOMMODATION_EDIT_ACTION);
    if (!this.days.getAccommodation(accommodationId, tripId)) {
      throw new ForbiddenResource(`no accommodation ${accommodationId} on trip ${tripId}`);
    }
    // Deleting a block can take its partner reservation and budget item with it.
    const { linkedReservationIds, deletedBudgetItemIds } = this.days.deleteAccommodation(accommodationId);
    for (const reservationId of linkedReservationIds) this.realtime.broadcast(tripId, 'reservation:deleted', { reservationId });
    for (const itemId of deletedBudgetItemIds) this.realtime.broadcast(tripId, 'budget:deleted', { itemId });
    this.realtime.broadcast(tripId, 'accommodation:deleted', { accommodationId });
    return { deleted: true };
  }
}
