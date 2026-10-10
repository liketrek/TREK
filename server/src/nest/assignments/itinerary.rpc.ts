import { PluginController, PluginMethod } from '../../nest-rpc/rpc-kit/decorators';
import { PluginGuards } from '../../nest-rpc/plugin-guards.service';
import { ForbiddenResource } from '../../nest-rpc/rpc-errors';
import { num, str } from '../../nest-rpc/rpc-params';
import type { PluginRpcContext } from '../../nest-rpc/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { AssignmentsService } from './assignments.service';

/** Assigning a place to a day counts as a DAY edit in the app, not an edit of its own. */
const DAY_EDIT_ACTION = 'day_edit';

/**
 * The itinerary surface a plugin may reach (#plugins).
 *
 * Both the day AND the place have to belong to the trip. AssignmentsService does not
 * check that itself, the controllers do, so it is reproduced here: without it a
 * plugin could cross-link another trip's rows.
 */
@PluginController()
export class ItineraryRpc {
  constructor(
    private readonly assignments: AssignmentsService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('itinerary.assign', { permission: 'db:write:itinerary' })
  async assign(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const placeId = num(params.placeId, 'placeId');
    const actor = this.guards.requireActor(ctx, 'itinerary');
    const notes = params.notes === undefined || params.notes === null ? null : str(params.notes, 'notes');
    await this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    if (!(await this.assignments.dayExists(dayId, tripId))) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
    if (!(await this.assignments.placeExists(placeId, tripId))) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
    const assignment = await this.assignments.createAssignment(dayId, placeId, notes);
    this.realtime.broadcast(tripId, 'assignment:created', { assignment });
    await this.assignments.reconcile(tripId);
    return assignment;
  }

  @PluginMethod('itinerary.unassign', { permission: 'db:write:itinerary' })
  async unassign(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const assignmentId = num(params.assignmentId, 'assignmentId');
    const actor = this.guards.requireActor(ctx, 'itinerary');
    await this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    const existing = await this.assignments.getAssignmentForTrip(assignmentId, tripId);
    if (!existing) throw new ForbiddenResource(`no assignment ${assignmentId} on trip ${tripId}`);
    await this.assignments.deleteAssignment(assignmentId);
    // The dayId is what the client reducer keys the eviction on. Without it nothing
    // leaves the day, so keep the payload shape identical to the REST/MCP delete.
    this.realtime.broadcast(tripId, 'assignment:deleted', { assignmentId, dayId: existing.day_id });
    // Create, delete, move and time re-mirror the linked journey skeletons afterwards,
    // in the controller and the MCP tool alike; reorder, transport and participants do
    // not. Without it an open journey keeps the removed place until the next reload.
    await this.assignments.reconcile(tripId);
    return { deleted: true };
  }
}
