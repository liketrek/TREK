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
  AssignmentTransportDto,
  AssignmentParticipantsDto,
} from './assignments.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

type Trip = NonNullable<ReturnType<AssignmentsService['verifyTripAccess']>>;

/** Shared trip-access guard (no access is a 404 "Trip not found", never a 403). */
function requireTrip(svc: AssignmentsService, tripId: string, user: User): Trip {
  const trip = svc.verifyTripAccess(tripId, user.id);
  if (!trip) {
    throw new HttpException({ error: 'Trip not found' }, 404);
  }
  return trip;
}

function requireEdit(svc: AssignmentsService, trip: Trip, user: User): void {
  if (!svc.canEdit(trip, user)) {
    throw new HttpException({ error: 'No permission' }, 403);
  }
}

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
@UseGuards(JwtAuthGuard)
export class DayAssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  list(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('dayId') dayId: string) {
    requireTrip(this.assignments, tripId, user);
    if (!this.assignments.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    return { assignments: this.assignments.listDayAssignments(dayId) };
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: AssignmentCreateDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = requireTrip(this.assignments, tripId, user);
    requireEdit(this.assignments, trip, user);
    if (!this.assignments.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    if (!this.assignments.placeExists(body.place_id, tripId)) {
      throw new HttpException({ error: 'Place not found' }, 404);
    }
    const assignment = this.assignments.createAssignment(dayId, body.place_id, body.notes);
    this.assignments.broadcast(tripId, 'assignment:created', { assignment }, socketId);
    this.assignments.reconcile(tripId, socketId);
    return { assignment };
  }

  @Put('reorder')
  reorder(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Body() body: AssignmentReorderDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = requireTrip(this.assignments, tripId, user);
    requireEdit(this.assignments, trip, user);
    if (!this.assignments.dayExists(dayId, tripId)) {
      throw new HttpException({ error: 'Day not found' }, 404);
    }
    this.assignments.reorderAssignments(dayId, body.orderedIds);
    this.assignments.broadcast(tripId, 'assignment:reordered', { dayId: Number(dayId), orderedIds: body.orderedIds }, socketId);
    return { success: true };
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('dayId') dayId: string,
    @Param('id') id: string,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = requireTrip(this.assignments, tripId, user);
    requireEdit(this.assignments, trip, user);
    if (!this.assignments.assignmentExistsInDay(id, dayId, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    this.assignments.deleteAssignment(id);
    this.assignments.broadcast(tripId, 'assignment:deleted', { assignmentId: Number(id), dayId: Number(dayId) }, socketId);
    this.assignments.reconcile(tripId, socketId);
    return { success: true };
  }
}

/**
 * /api/trips/:tripId/assignments/:id/* — per-assignment ops (move, time,
 * participants), independent of the day path. Same parity rules as above.
 */
@Controller('api/trips/:tripId/assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentOpsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Put(':id/move')
  move(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentMoveDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = requireTrip(this.assignments, tripId, user);
    requireEdit(this.assignments, trip, user);
    if (!this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    if (!this.assignments.dayExists(String(body.new_day_id), tripId)) {
      throw new HttpException({ error: 'Target day not found' }, 404);
    }
    const { assignment, oldDayId } = this.assignments.moveAssignment(id, body.new_day_id, body.order_index);
    this.assignments.broadcast(tripId, 'assignment:moved', { assignment, oldDayId: Number(oldDayId), newDayId: Number(body.new_day_id) }, socketId);
    this.assignments.reconcile(tripId, socketId);
    return { assignment };
  }

  @Get(':id/participants')
  participants(@CurrentUser() user: User, @Param('tripId') tripId: string, @Param('id') id: string) {
    requireTrip(this.assignments, tripId, user);
    return { participants: this.assignments.getParticipants(id) };
  }

  @Put(':id/time')
  time(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentTimeDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = requireTrip(this.assignments, tripId, user);
    requireEdit(this.assignments, trip, user);
    if (!this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const assignment = this.assignments.updateTime(id, body.place_time, body.end_time);
    this.assignments.broadcast(tripId, 'assignment:updated', { assignment }, socketId);
    this.assignments.reconcile(tripId, socketId);
    return { assignment };
  }

  @Put(':id/transport')
  transport(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentTransportDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = requireTrip(this.assignments, tripId, user);
    requireEdit(this.assignments, trip, user);
    if (!this.assignments.getAssignmentForTrip(id, tripId)) {
      throw new HttpException({ error: 'Assignment not found' }, 404);
    }
    const assignment = this.assignments.setLegTransportMode(id, body.transport_mode ?? null);
    this.assignments.broadcast(tripId, 'assignment:updated', { assignment }, socketId);
    return { assignment };
  }

  @Put(':id/participants')
  setParticipants(
    @CurrentUser() user: User,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() body: AssignmentParticipantsDto,
    @Headers('x-socket-id') socketId?: string,
  ) {
    const trip = requireTrip(this.assignments, tripId, user);
    requireEdit(this.assignments, trip, user);
    const participants = this.assignments.setParticipants(id, body.user_ids);
    this.assignments.broadcast(tripId, 'assignment:participants', { assignmentId: Number(id), participants }, socketId);
    return { participants };
  }
}
