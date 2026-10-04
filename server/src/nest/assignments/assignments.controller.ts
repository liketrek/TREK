import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../../types';
import { AssignmentsService } from './assignments.service';
import {
  AssignmentCreateDto,
  AssignmentReorderDto,
  AssignmentMoveDto,
  AssignmentTimeDto,
  AssignmentEndDayDto,
  AssignmentNotesDto,
  AssignmentTransportDto,
  AssignmentRouteDto,
  AssignmentParticipantsDto,
} from './assignments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermission, TripAccessGuard } from '../permissions/trip-access.guard';


/**
 * /api/trips/:tripId/days/:dayId/assignments — the day's ordered itinerary items.
 *
 * Parity with the retired legacy Express route: trip access (404), 'day_edit'
 * on mutations (403, GET is access-only), create 201 / rest 200, the bespoke
 * "Day not found" / "Place not found" / "Assignment not found" bodies, the
 * journey skeleton reconcile, and WebSocket broadcasts. Bodies are validated
 * by the @trek/shared Zod contracts via assignments.dto.ts (global pipe).
 */
@Controller('api/trips/:tripId/days/:dayId/assignments')
// TripAccessGuard resolves :tripId and 404s a trip the user cannot reach; mutations
// add @RequirePermission('day_edit'), the same action string the service's canEdit
// passes, so the HTTP and MCP paths cannot demand different rights.
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class DayAssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  async list(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('dayId') dayId: string) {
    if (!await this.assignments.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    return { assignments: await this.assignments.listDayAssignments(dayId) };
  }

  @RequirePermission('day_edit')
  @Post()
  async create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: AssignmentCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    if (!await this.assignments.placeExists(body.place_id, tripId)) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    const assignment = await this.assignments.createAssignment(dayId, body.place_id, body.notes);
    this.assignments.broadcast(tripId, 'assignment:created', { assignment }, socketId);
    await this.assignments.reconcile(tripId, socketId);
    return { assignment };
  }

  @RequirePermission('day_edit')
  @Put('reorder')
  async reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: AssignmentReorderDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    await this.assignments.reorderAssignments(dayId, body.orderedIds);
    this.assignments.broadcast(tripId, 'assignment:reordered', { dayId: Number(dayId), orderedIds: body.orderedIds }, socketId);
    return { success: true };
  }

  // Declared before ':id' so the bare collection path is never read as an id (#2470).
  @RequirePermission('day_edit')
  @Delete()
  async clear(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    const removedIds = await this.assignments.clearDay(dayId);
    for (const assignmentId of removedIds) {
      this.assignments.broadcast(tripId, 'assignment:deleted', { assignmentId, dayId: Number(dayId) }, socketId);
    }
    if (removedIds.length > 0) await this.assignments.reconcile(tripId, socketId);
    return { success: true, removedIds };
  }

  @RequirePermission('day_edit')
  @Delete(':id')
  async remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.assignmentExistsInDay(id, dayId, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    await this.assignments.deleteAssignment(id);
    this.assignments.broadcast(tripId, 'assignment:deleted', { assignmentId: Number(id), dayId: Number(dayId) }, socketId);
    await this.assignments.reconcile(tripId, socketId);
    return { success: true };
  }
}

/**
 * /api/trips/:tripId/assignments/:id/* — per-assignment ops (move, time,
 * participants), independent of the day path. Same parity rules as above.
 *
 * Same guard pair as the day controller, and for the same reason: TripAccessGuard
 * is what resolves :tripId and what reads @RequirePermission. The per-handler
 * getAssignmentForTrip calls answer a different question — whether the assignment
 * sits on the trip in the URL, not whether the caller may be on that trip.
 */
@Controller('api/trips/:tripId/assignments')
@UseGuards(JwtAuthGuard, TripAccessGuard)
export class AssignmentOpsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @RequirePermission('day_edit')
  @Put(':id/move')
  async move(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentMoveDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    if (!await this.assignments.dayExists(String(body.new_day_id), tripId)) {
      throw new HttpException({ error: 'Target day not found' }, 404);
    }
    const { assignment, oldDayId } = await this.assignments.moveAssignment(id, body.new_day_id, body.order_index);
    this.assignments.broadcast(tripId, 'assignment:moved', { assignment, oldDayId: Number(oldDayId), newDayId: Number(body.new_day_id) }, socketId);
    await this.assignments.reconcile(tripId, socketId);
    return { assignment };
  }

  @Get(':id/participants')
  async participants(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    return { participants: await this.assignments.getParticipants(id) };
  }

  @RequirePermission('day_edit')
  @Put(':id/time')
  async time(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentTimeDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const { assignment, reordered, vias } = await this.assignments.updateTime(id, body.place_time, body.end_time);
    this.assignments.broadcast(tripId, 'assignment:updated', { assignment }, socketId);
    // The whole day when a start moved stops, or collaborators apply the one row
    // they were sent to their old order and end up with a third one.
    //
    // Both to every socket, the writer's included, so the order and the vias pinned
    // to it arrive together. The planner holds its vias in memory and would route the
    // new anchors on the old order until its reload of the day came back, and a save
    // replayed from the offline queue has no reload after it at all.
    if (reordered) this.assignments.broadcast(tripId, 'assignment:reordered', reordered, undefined);
    if (vias) this.assignments.broadcast(tripId, 'roadtripVia:changed', vias, undefined);
    await this.assignments.reconcile(tripId, socketId);
    return { assignment };
  }

  @RequirePermission('day_edit')
  @Put(':id/end-day')
  async endDay(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentEndDayDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const assignment = await this.assignments.setEndDay(id, body.end_day);
    this.assignments.broadcast(tripId, 'assignment:updated', { assignment }, socketId);
    return { assignment };
  }

  // #2163: the per-assignment note was write-once (create bodies, MCP, plugin
  // RPC) with no edit path anywhere. Same guard shape and 404 body as its
  // neighbours; no reconcile — the note doesn't touch the journey skeleton.
  @RequirePermission('day_edit')
  @Put(':id/notes')
  async notes(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentNotesDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const assignment = await this.assignments.updateNotes(id, body.notes);
    this.assignments.broadcast(tripId, 'assignment:updated', { assignment }, socketId);
    return { assignment };
  }

  @RequirePermission('day_edit')
  @Put(':id/transport')
  async transport(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentTransportDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const assignment = body.direction === 'incoming'
      ? await this.assignments.setIncomingLegTransportMode(id, body.transport_mode ?? null)
      : await this.assignments.setLegTransportMode(id, body.transport_mode ?? null);
    this.assignments.broadcast(tripId, 'assignment:updated', { assignment }, socketId);
    return { assignment };
  }

  @RequirePermission('day_edit')
  @Put(':id/route')
  async route(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentRouteDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const assignment = await this.assignments.setRouteExcluded(id, body.excluded);
    this.assignments.broadcast(tripId, 'assignment:updated', { assignment }, socketId);
    return { assignment };
  }

  @RequirePermission('day_edit')
  @Put(':id/participants')
  async setParticipants(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentParticipantsDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    if (!await this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const participants = await this.assignments.setParticipants(id, body.user_ids, tripId);
    this.assignments.broadcast(tripId, 'assignment:participants', { assignmentId: Number(id), participants }, socketId);
    return { participants };
  }
}
