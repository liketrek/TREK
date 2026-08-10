import {
  reservationCreateRequestSchema,
  reservationEndpointsInputSchema,
  reservationUpdateRequestSchema,
} from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { ReservationsService } from './reservations.service';

const RESERVATION_EDIT_ACTION = 'reservation_edit';

/**
 * The reservation surface a plugin may reach (#plugins).
 *
 * Everything delegates to ReservationsService, so the accommodation side effects, the
 * budget sync, the booking notification and the broadcasts match the web app one for
 * one. A booking write is rarely just one row: creating one can create an
 * accommodation and a budget item, and deleting one can remove both again.
 */
@PluginController()
export class ReservationsRpc {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('reservations.create', { permission: 'db:write:reservations' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'reservation');
    const parsed = reservationCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid reservation: ${schemaMessage(parsed.error)}`);
    const input = parsed.data as Record<string, unknown>;
    this.requireValidEndpoints(input.endpoints);
    this.guards.requireTripEdit(tripId, actor, RESERVATION_EDIT_ACTION);
    const { reservation, accommodationCreated } = this.reservations.create(String(tripId), input as never);
    if (accommodationCreated) this.realtime.broadcast(tripId, 'accommodation:created', {}, undefined);
    const i = input as { title?: string; type?: string; create_budget_entry?: unknown };
    this.reservations.syncBudgetOnCreate(String(tripId), reservation.id, i.title ?? '', i.type, i.create_budget_entry as never, undefined);
    this.realtime.broadcast(tripId, 'reservation:created', { reservation }, undefined);
    this.notifyBooking(actor, tripId, i.title ?? '', i.type ?? '');
    return reservation;
  }

  @PluginMethod('reservations.update', { permission: 'db:write:reservations' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const reservationId = num(params.reservationId, 'reservationId');
    const actor = this.guards.requireActor(ctx, 'reservation');
    const parsed = reservationUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid reservation: ${schemaMessage(parsed.error)}`);
    const input = parsed.data as Record<string, unknown>;
    this.requireValidEndpoints(input.endpoints);
    this.guards.requireTripEdit(tripId, actor, RESERVATION_EDIT_ACTION);
    const current = this.reservations.getReservation(String(reservationId), String(tripId));
    if (!current) throw new ForbiddenResource(`no reservation ${reservationId} on trip ${tripId}`);
    const { reservation, accommodationChanged } = this.reservations.update(String(reservationId), String(tripId), input as never, current as never);
    if (accommodationChanged) this.realtime.broadcast(tripId, 'accommodation:updated', {}, undefined);
    const cur = current as { title: string; type?: string };
    const i = input as { title?: string; type?: string; create_budget_entry?: unknown };
    this.reservations.syncBudgetOnUpdate(String(tripId), String(reservationId), i.title ?? '', i.type, cur.title, cur.type, i.create_budget_entry as never, undefined);
    this.realtime.broadcast(tripId, 'reservation:updated', { reservation }, undefined);
    this.notifyBooking(actor, tripId, i.title || cur.title, i.type || cur.type || '');
    return reservation;
  }

  @PluginMethod('reservations.delete', { permission: 'db:write:reservations' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const reservationId = num(params.reservationId, 'reservationId');
    const actor = this.guards.requireActor(ctx, 'reservation');
    this.guards.requireTripEdit(tripId, actor, RESERVATION_EDIT_ACTION);
    const { deleted, accommodationDeleted, deletedBudgetItemId } = this.reservations.remove(String(reservationId), String(tripId));
    if (!deleted) throw new ForbiddenResource(`no reservation ${reservationId} on trip ${tripId}`);
    if (accommodationDeleted) this.realtime.broadcast(tripId, 'accommodation:deleted', { accommodationId: deleted.accommodation_id }, undefined);
    if (deletedBudgetItemId) this.realtime.broadcast(tripId, 'budget:deleted', { itemId: deletedBudgetItemId }, undefined);
    this.realtime.broadcast(tripId, 'reservation:deleted', { reservationId }, undefined);
    this.notifyBooking(actor, tripId, deleted.title, deleted.type || '');
    return { deleted: true };
  }

  /**
   * The reservation body is passthrough by contract, but a malformed `endpoints`
   * array would otherwise fail deep in the service (NOT NULL mid-transaction) or be
   * dropped silently on missing coordinates. Both are miserable to debug from a
   * plugin, so the shape is pinned up front. Absent stays absent: omitted means keep,
   * [] means delete all.
   */
  private requireValidEndpoints(value: unknown): void {
    if (value === undefined) return;
    const parsed = reservationEndpointsInputSchema.safeParse(value);
    if (!parsed.success) throw new BadParams(`invalid endpoints: ${schemaMessage(parsed.error)}`);
  }

  /** Fire-and-forget, exactly as the REST controller sends it, so it never blocks the write. */
  private notifyBooking(actingUserId: number, tripId: number, booking: string, type: string): void {
    this.reservations.notifyBookingChange(tripId, actingUserId, booking, type);
  }
}
