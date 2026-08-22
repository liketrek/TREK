import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { AssignmentsService } from './assignments.service';
import { DaysService } from '../days/days.service';

/**
 * Assignment MCP surface — ported 1:1 from the legacy registrar in
 * src/mcp/tools/assignments.ts (identical names, descriptions, schemas,
 * annotations, error/payload shapes and broadcasts). The legacy `if (R)` /
 * `if (W)` registration gates on the 'places' scope group map to the
 * declarative access markers (resolved by trekMcpAccessPolicy); there is no
 * addon gate, so no `when`. The target-day check on move uses the injected
 * DaysService.getDay.
 */
@McpController()
export class AssignmentsMcp {
  constructor(
    private readonly assignments: AssignmentsService,
    private readonly days: DaysService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'assign_place_to_day',
    description: 'Assign a place to a specific day in a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      placeId: z.number().int().positive(),
      notes: z.string().max(500).optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
  })
  async assignPlaceToDay(
    { tripId, dayId, placeId, notes }: { tripId: number; dayId: number; placeId: number; notes?: string },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.assignments.dayExists(dayId, tripId)) return errorResult('Day not found.');
    if (!this.assignments.placeExists(placeId, tripId)) return errorResult('Place not found.');
    const assignment = this.assignments.createAssignment(dayId, placeId, notes || null);
    this.guards.safeBroadcast(tripId, 'assignment:created', { assignment });
    this.assignments.reconcile(tripId);
    return ok({ assignment });
  }

  @Tool({
    name: 'unassign_place',
    description: 'Remove a place assignment from a day.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      assignmentId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async unassignPlace(
    { tripId, dayId, assignmentId }: { tripId: number; dayId: number; assignmentId: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.assignments.assignmentExistsInDay(assignmentId, dayId, tripId))
      return errorResult('Assignment not found.');
    this.assignments.deleteAssignment(assignmentId);
    this.guards.safeBroadcast(tripId, 'assignment:deleted', { assignmentId, dayId });
    this.assignments.reconcile(tripId);
    return ok({ success: true });
  }

  @Tool({
    name: 'update_assignment_time',
    description: 'Set the start and/or end time for a place assignment on a day (e.g. "09:00", "11:30"). Pass null to clear a time.',
    inputSchema: {
      tripId: z.number().int().positive(),
      assignmentId: z.number().int().positive(),
      place_time: z.string().max(50).nullable().optional().describe('Start time (e.g. "09:00"), or null to clear'),
      end_time: z.string().max(50).nullable().optional().describe('End time (e.g. "11:00"), or null to clear'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updateAssignmentTime(
    { tripId, assignmentId, place_time, end_time }: {
      tripId: number; assignmentId: number; place_time?: string | null; end_time?: string | null;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    const existing = this.assignments.getAssignmentForTrip(assignmentId, tripId);
    if (!existing) return errorResult('Assignment not found.');
    const assignment = this.assignments.updateTime(
      assignmentId,
      place_time !== undefined ? place_time : existing.assignment_time,
      end_time !== undefined ? end_time : existing.assignment_end_time
    );
    this.guards.safeBroadcast(tripId, 'assignment:updated', { assignment });
    this.assignments.reconcile(tripId);
    return ok({ assignment });
  }

  @Tool({
    name: 'set_leg_transport_mode',
    description: 'Set the travel mode of a route leg for a place assignment. Use direction "outgoing" (default) for the common case: the leg leaving this stop toward the next. Use direction "incoming" ONLY when this stop\'s arriving leg originates from something that is not itself a place assignment (e.g. a flight/train booking arrival, or a morning hotel departure) – setting "incoming" on an ordinary place-to-place leg is stored but has no effect on route rendering, because it targets a column that is only read for non-place origins. transport_mode is a route profile key: "driving", "walking", "cycling", or a plugin profile written as "plugin:<pluginId>/<profileId>". Any other value is stored but drawn as a driving route. null clears it so the leg inherits the day default.',
    inputSchema: {
      tripId: z.number().int().positive(),
      assignmentId: z.number().int().positive(),
      transport_mode: z.string().nullable().optional().describe('Route profile key (e.g. "driving"), or null to inherit the day default'),
      direction: z.enum(['outgoing', 'incoming']).default('outgoing').describe('Which leg to set: "outgoing" (leaving this stop, default) or "incoming" (arriving at it)'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async setLegTransportMode(
    { tripId, assignmentId, transport_mode, direction }: {
      tripId: number; assignmentId: number; transport_mode?: string | null; direction?: 'outgoing' | 'incoming';
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.assignments.getAssignmentForTrip(assignmentId, tripId)) return errorResult('Assignment not found.');
    const assignment = direction === 'incoming'
      ? this.assignments.setIncomingLegTransportMode(assignmentId, transport_mode ?? null)
      : this.assignments.setLegTransportMode(assignmentId, transport_mode ?? null);
    this.guards.safeBroadcast(tripId, 'assignment:updated', { assignment });
    return ok({ assignment });
  }

  @Tool({
    name: 'move_assignment',
    description: 'Move a place assignment to a different day.',
    inputSchema: {
      tripId: z.number().int().positive(),
      assignmentId: z.number().int().positive(),
      newDayId: z.number().int().positive(),
      oldDayId: z.number().int().positive().optional().describe('Deprecated and ignored — the server derives the source day from the assignment'),
      orderIndex: z.number().int().min(0).optional().default(0),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async moveAssignment(
    { tripId, assignmentId, newDayId, orderIndex }: {
      tripId: number; assignmentId: number; newDayId: number; oldDayId?: number; orderIndex?: number;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.assignments.getAssignmentForTrip(assignmentId, tripId)) return errorResult('Assignment not found.');
    if (!this.days.getDay(newDayId, tripId)) return errorResult('Day not found.');
    const result = this.assignments.moveAssignment(assignmentId, newDayId, orderIndex ?? 0);
    // REST parity shape ({ assignment, oldDayId, newDayId }) — the client keys its
    // per-day assignment map on newDayId, so omitting it filed the moved assignment
    // under "undefined" on collaborator screens.
    this.guards.safeBroadcast(tripId, 'assignment:moved', { assignment: result.assignment, oldDayId: result.oldDayId, newDayId });
    this.assignments.reconcile(tripId);
    return ok({ assignment: result.assignment });
  }

  @Tool({
    name: 'get_assignment_participants',
    description: 'Get the list of users participating in a specific place assignment.',
    inputSchema: {
      tripId: z.number().int().positive(),
      assignmentId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async getAssignmentParticipants(
    { tripId, assignmentId }: { tripId: number; assignmentId: number },
    ctx: McpContext,
  ) {
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.assignments.getAssignmentForTrip(assignmentId, tripId)) return errorResult('Assignment not found.');
    const participants = this.assignments.getParticipants(assignmentId);
    return ok({ participants });
  }

  @Tool({
    name: 'set_assignment_participants',
    description: 'Set the participants for a place assignment (replaces current list).',
    inputSchema: {
      tripId: z.number().int().positive(),
      assignmentId: z.number().int().positive(),
      userIds: z.array(z.number().int().positive()).describe('User IDs to set as participants; empty array clears all'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async setAssignmentParticipants(
    { tripId, assignmentId, userIds }: { tripId: number; assignmentId: number; userIds: number[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.assignments.getAssignmentForTrip(assignmentId, tripId)) return errorResult('Assignment not found.');
    const participants = this.assignments.setParticipants(assignmentId, userIds, tripId);
    this.guards.safeBroadcast(tripId, 'assignment:participants', { assignmentId, participants });
    return ok({ participants });
  }

  @Tool({
    name: 'reorder_day_assignments',
    description: 'Reorder places within a day by providing the assignment IDs in the desired order.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      assignmentIds: z.array(z.number().int().positive()).min(1).max(200).describe('Assignment IDs in desired display order'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async reorderDayAssignments(
    { tripId, dayId, assignmentIds }: { tripId: number; dayId: number; assignmentIds: number[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.assignments.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.days.getDay(dayId, tripId)) return errorResult('Day not found.');
    this.assignments.reorderAssignments(dayId, assignmentIds);
    // REST parity shape ({ dayId, orderedIds }) — the client only reads orderedIds,
    // so broadcasting the tool-input key name emptied the day for collaborators.
    this.guards.safeBroadcast(tripId, 'assignment:reordered', { dayId, orderedIds: assignmentIds });
    return ok({ success: true, dayId, order: assignmentIds });
  }
}
