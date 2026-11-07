import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  type McpContext,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  errorResult,
  ok,
  appCallable,
} from '../../nest-mcp';
import { DaysService } from '../days/days.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { AssignmentsService } from './assignments.service';
import {
  idSchema,
  assignmentCreateRequestSchema,
  assignmentEndDayRequestSchema,
  type AssignmentEndDayRequest,
} from '@trek/shared';

import { z } from 'zod';

/** The assignment fields update_assignment and the single-field tools it replaces share. */
const placeTimeField = z.string().max(50).nullable().optional().describe('Start time (e.g. "09:00"), or null to clear');
const endTimeField = z.string().max(50).nullable().optional().describe('End time (e.g. "11:00"), or null to clear');
// Mirrors the REST contract (assignmentNotesRequestSchema): uncapped on
// purpose, unlike the create tools' max(500) — a longer note written through
// REST or the plugin RPC must stay editable here (#2163).
const notesField = z.string().nullable().describe('The note text, or null to clear');
const routeExcludedField = z.boolean().describe('true leaves the stop out of the route, false routes it again');
const participantIdsField = z.array(idSchema).describe('User IDs to set as participants; empty array clears all');

/** What update_assignment changes; every field is optional, at least one is given. */
interface AssignmentUpdate {
  place_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  end_day?: AssignmentEndDayRequest['end_day'];
  route_excluded?: boolean;
  participant_ids?: number[];
}

const DEPRECATED_FOR_UPDATE = 'Deprecated: use update_assignment.';

/**
 * Assignment MCP surface. Reads and writes need the 'places' scope group
 * (declarative access markers resolved by trekMcpAccessPolicy); there is no
 * addon gate, so no `when`. update_assignment changes any of an assignment's
 * own fields in one call; the single-field tools it replaced stay for one
 * release, marked deprecated, and run through it. The target-day check on
 * move uses the injected DaysService.getDay.
 */
@McpController()
export class AssignmentsMcp {
  constructor(
    private readonly assignments: AssignmentsService,
    private readonly days: DaysService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'assign_place_to_day',
    title: 'Add place to a day',
    description:
      'Assign a place to a specific day in a trip. For a multi-day tour, pass tourStageKey to put one of its stages on the day instead of the whole tour: the key of the stop the stage starts at, from the stage_stops list_tours gives (every stop but the last starts a stage). A stage is on one day at most, and a day holds a tour, or one of its stages, once.',
    inputSchema: {
      tripId: idSchema,
      dayId: idSchema,
      placeId: idSchema,
      notes: z.string().max(500).optional(),
      tourStageKey: assignmentCreateRequestSchema.shape.tour_stage_key.describe(
        'The key of the stop a stage of a multi-day tour starts at, to put that stage on the day instead of the whole tour',
      ),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'places', mode: 'write' },
  })
  async assignPlaceToDay(
    {
      tripId,
      dayId,
      placeId,
      notes,
      tourStageKey,
    }: { tripId: number; dayId: number; placeId: number; notes?: string; tourStageKey?: string },
    ctx: McpContext,
  ) {
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) return permissionDenied();
    if (!(await this.assignments.dayExists(dayId, tripId))) return errorResult('Day not found.');
    if (!(await this.assignments.placeExists(placeId, tripId))) return errorResult('Place not found.');
    const assignment = await this.assignments.createAssignment(dayId, placeId, notes || null, {
      ...(tourStageKey !== undefined ? { tourStageKey } : {}),
    });
    this.guards.safeBroadcast(tripId, 'assignment:created', { assignment });
    await this.assignments.reconcile(tripId);
    return ok({ assignment });
  }

  @Tool({
    name: 'set_assignment_end_day',
    title: 'Set assignment end day',
    description: DEPRECATED_FOR_UPDATE,
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      ...assignmentEndDayRequestSchema.shape,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async setAssignmentEndDay(
    { tripId, assignmentId, end_day }: AssignmentEndDayRequest & { tripId: number; assignmentId: number },
    ctx: McpContext,
  ) {
    return this.updateAssignment({ tripId, assignmentId, end_day }, ctx);
  }

  @Tool({
    name: 'unassign_place',
    title: 'Remove place from day',
    description: 'Remove a place assignment from a day.',
    inputSchema: {
      tripId: idSchema,
      dayId: idSchema,
      assignmentId: idSchema,
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async unassignPlace(
    { tripId, dayId, assignmentId }: { tripId: number; dayId: number; assignmentId: number },
    ctx: McpContext,
  ) {
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) return permissionDenied();
    if (!(await this.assignments.assignmentExistsInDay(assignmentId, dayId, tripId)))
      return errorResult('Assignment not found.');
    await this.assignments.deleteAssignment(assignmentId);
    this.guards.safeBroadcast(tripId, 'assignment:deleted', { assignmentId, dayId });
    await this.assignments.reconcile(tripId);
    return ok({ success: true });
  }

  @Tool({
    name: 'clear_day_assignments',
    title: 'Clear places from day',
    description:
      'Remove every place from one day in a single step. The day itself, its notes and its bookings stay; the places stay in the trip and can be planned again. Returns the removed assignment ids.',
    inputSchema: {
      tripId: idSchema,
      dayId: idSchema,
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'places', mode: 'write' },
  })
  async clearDayAssignments({ tripId, dayId }: { tripId: number; dayId: number }, ctx: McpContext) {
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) return permissionDenied();
    if (!(await this.assignments.dayExists(dayId, tripId))) return errorResult('Day not found.');
    const removedIds = await this.assignments.clearDay(dayId);
    for (const assignmentId of removedIds)
      this.guards.safeBroadcast(tripId, 'assignment:deleted', { assignmentId, dayId });
    if (removedIds.length > 0) await this.assignments.reconcile(tripId);
    return ok({ success: true, removedIds });
  }

  @Tool({
    name: 'update_assignment_time',
    title: 'Set place visit times',
    description: DEPRECATED_FOR_UPDATE,
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      place_time: placeTimeField,
      end_time: endTimeField,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updateAssignmentTime(
    {
      tripId,
      assignmentId,
      place_time,
      end_time,
    }: {
      tripId: number;
      assignmentId: number;
      place_time?: string | null;
      end_time?: string | null;
    },
    ctx: McpContext,
  ) {
    // Both keys go through even when unset: this tool always re-saved the times.
    return this.updateAssignment({ tripId, assignmentId, place_time, end_time }, ctx);
  }

  @Tool({
    name: 'update_assignment_notes',
    title: 'Set place day note',
    description: DEPRECATED_FOR_UPDATE,
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      notes: notesField,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updateAssignmentNotes(
    { tripId, assignmentId, notes }: { tripId: number; assignmentId: number; notes: string | null },
    ctx: McpContext,
  ) {
    return this.updateAssignment({ tripId, assignmentId, notes }, ctx);
  }

  @Tool({
    name: 'update_assignment',
    title: 'Update place on a day',
    description:
      'Change a place assignment on its day; pass only what changes. place_time / end_time set the visit times (e.g. "09:00"; null clears one). notes sets the day-specific note (null or "" clears it). end_day ends the travel day after this visit and its stay (only with daily travel times enabled; false follows the default again). route_excluded keeps the stop on its day but leaves it out of the day route (the route runs from the stop before straight to the one after). participant_ids replaces who takes part (an empty list clears it).',
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      place_time: placeTimeField,
      end_time: endTimeField,
      notes: notesField.optional(),
      end_day: assignmentEndDayRequestSchema.shape.end_day.optional(),
      route_excluded: routeExcludedField.optional(),
      participant_ids: participantIdsField.optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async updateAssignment(
    { tripId, assignmentId, ...update }: AssignmentUpdate & { tripId: number; assignmentId: number },
    ctx: McpContext,
  ) {
    const touchesTime = 'place_time' in update || 'end_time' in update;
    if (!touchesTime && Object.values(update).every((value) => value === undefined))
      return errorResult('Nothing to update.');
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) return permissionDenied();
    if (!(await this.assignments.getAssignmentForTrip(assignmentId, tripId)))
      return errorResult('Assignment not found.');
    const { assignment, time, participants } = await this.assignments.updateFields(assignmentId, tripId, update);
    // The events each single-field write sends: the times' three, as PUT /assignments/:id/time does.
    if (assignment !== undefined) this.guards.safeBroadcast(tripId, 'assignment:updated', { assignment });
    if (time?.reordered) this.guards.safeBroadcast(tripId, 'assignment:reordered', time.reordered);
    if (time?.vias) this.guards.safeBroadcast(tripId, 'roadtripVia:changed', time.vias);
    if (time) await this.assignments.reconcile(tripId);
    if (participants === undefined) return ok({ assignment });
    this.guards.safeBroadcast(tripId, 'assignment:participants', { assignmentId, participants });
    return ok(assignment === undefined ? { participants } : { assignment, participants });
  }

  @Tool({
    name: 'set_leg_transport_mode',
    title: 'Set leg transport mode',
    description:
      'Set the travel mode of a route leg for a place assignment. Use direction "outgoing" (default) for the common case: the leg leaving this stop toward the next. Use direction "incoming" ONLY when this stop\'s arriving leg originates from something that is not itself a place assignment (e.g. a flight/train booking arrival, or a morning hotel departure) – setting "incoming" on an ordinary place-to-place leg is stored but has no effect on route rendering, because it targets a column that is only read for non-place origins. transport_mode is a route profile key: "driving", "walking", "cycling", or a plugin profile written as "plugin:<pluginId>/<profileId>". Any other value is stored but drawn as a driving route. null clears it so the leg inherits the day default.',
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      transport_mode: z
        .string()
        .nullable()
        .optional()
        .describe('Route profile key (e.g. "driving"), or null to inherit the day default'),
      direction: z
        .enum(['outgoing', 'incoming'])
        .default('outgoing')
        .describe('Which leg to set: "outgoing" (leaving this stop, default) or "incoming" (arriving at it)'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async setLegTransportMode(
    {
      tripId,
      assignmentId,
      transport_mode,
      direction,
    }: {
      tripId: number;
      assignmentId: number;
      transport_mode?: string | null;
      direction?: 'outgoing' | 'incoming';
    },
    ctx: McpContext,
  ) {
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) return permissionDenied();
    if (!(await this.assignments.getAssignmentForTrip(assignmentId, tripId)))
      return errorResult('Assignment not found.');
    const assignment =
      direction === 'incoming'
        ? await this.assignments.setIncomingLegTransportMode(assignmentId, transport_mode ?? null)
        : await this.assignments.setLegTransportMode(assignmentId, transport_mode ?? null);
    this.guards.safeBroadcast(tripId, 'assignment:updated', { assignment });
    return ok({ assignment });
  }

  @Tool({
    name: 'set_assignment_route_excluded',
    title: 'Exclude stop from route',
    description: DEPRECATED_FOR_UPDATE,
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      excluded: routeExcludedField,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async setAssignmentRouteExcluded(
    { tripId, assignmentId, excluded }: { tripId: number; assignmentId: number; excluded: boolean },
    ctx: McpContext,
  ) {
    return this.updateAssignment({ tripId, assignmentId, route_excluded: excluded }, ctx);
  }

  @Tool({
    name: 'move_assignment',
    title: 'Move place to another day',
    description: 'Move a place assignment to a different day.',
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      newDayId: idSchema,
      orderIndex: z.number().int().min(0).optional().default(0),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async moveAssignment(
    {
      tripId,
      assignmentId,
      newDayId,
      orderIndex,
    }: {
      tripId: number;
      assignmentId: number;
      newDayId: number;
      orderIndex?: number;
    },
    ctx: McpContext,
  ) {
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) return permissionDenied();
    if (!(await this.assignments.getAssignmentForTrip(assignmentId, tripId)))
      return errorResult('Assignment not found.');
    if (!(await this.days.getDay(newDayId, tripId))) return errorResult('Day not found.');
    const result = await this.assignments.moveAssignment(assignmentId, newDayId, orderIndex ?? 0);
    // REST parity shape ({ assignment, oldDayId, newDayId }) — the client keys its
    // per-day assignment map on newDayId, so omitting it filed the moved assignment
    // under "undefined" on collaborator screens.
    this.guards.safeBroadcast(tripId, 'assignment:moved', {
      assignment: result.assignment,
      oldDayId: result.oldDayId,
      newDayId,
    });
    await this.assignments.reconcile(tripId);
    return ok({ assignment: result.assignment });
  }

  @Tool({
    name: 'get_assignment_participants',
    title: 'Get place participants',
    description: 'Get the list of users participating in a specific place assignment.',
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'places', mode: 'read' },
  })
  async getAssignmentParticipants({ tripId, assignmentId }: { tripId: number; assignmentId: number }, ctx: McpContext) {
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.assignments.getAssignmentForTrip(assignmentId, tripId)))
      return errorResult('Assignment not found.');
    const participants = await this.assignments.getParticipants(assignmentId);
    return ok({ participants });
  }

  @Tool({
    name: 'set_assignment_participants',
    title: 'Set place participants',
    description: DEPRECATED_FOR_UPDATE,
    inputSchema: {
      tripId: idSchema,
      assignmentId: idSchema,
      userIds: participantIdsField,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async setAssignmentParticipants(
    { tripId, assignmentId, userIds }: { tripId: number; assignmentId: number; userIds: number[] },
    ctx: McpContext,
  ) {
    return this.updateAssignment({ tripId, assignmentId, participant_ids: userIds }, ctx);
  }

  @Tool({
    name: 'reorder_day_assignments',
    title: 'Reorder places in day',
    description: 'Reorder places within a day by providing the assignment IDs in the desired order.',
    inputSchema: {
      tripId: idSchema,
      dayId: idSchema,
      assignmentIds: z.array(idSchema).min(1).max(200).describe('Assignment IDs in desired display order'),
    },
    _meta: appCallable(),
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'places', mode: 'write' },
  })
  async reorderDayAssignments(
    { tripId, dayId, assignmentIds }: { tripId: number; dayId: number; assignmentIds: number[] },
    ctx: McpContext,
  ) {
    if (!(await this.assignments.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) return permissionDenied();
    if (!(await this.days.getDay(dayId, tripId))) return errorResult('Day not found.');
    await this.assignments.reorderAssignments(dayId, assignmentIds);
    // REST parity shape ({ dayId, orderedIds }) — the client only reads orderedIds,
    // so broadcasting the tool-input key name emptied the day for collaborators.
    this.guards.safeBroadcast(tripId, 'assignment:reordered', { dayId, orderedIds: assignmentIds });
    return ok({ success: true, dayId, order: assignmentIds });
  }
}
