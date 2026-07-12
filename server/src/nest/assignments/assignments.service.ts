import { Injectable } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { canAccessTrip } from '../../db/database';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/assignmentService';
import { reconcileTripSkeletons } from '../../services/journeyService';

type Trip = { user_id: number };

/**
 * Thin Nest wrapper around the existing assignment service. Trip access mirrors
 * the requireTripAccess middleware (canAccessTrip); mutations use 'day_edit'.
 * The SQL, the move/reorder logic and the journey skeleton reconcile reuse the
 * legacy code unchanged.
 */
@Injectable()
export class AssignmentsService {
  verifyTripAccess(tripId: string, userId: number) {
    return canAccessTrip(Number(tripId), userId) as Trip | null | undefined;
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  dayExists(dayId: string, tripId: string) {
    return svc.dayExists(dayId, tripId);
  }

  placeExists(placeId: unknown, tripId: string) {
    return svc.placeExists(placeId as never, tripId);
  }

  listDayAssignments(dayId: string) {
    return svc.listDayAssignments(dayId);
  }

  createAssignment(dayId: string, placeId: unknown, notes?: string | null) {
    return svc.createAssignment(dayId, placeId as never, notes as never);
  }

  /**
   * Re-mirror the trip's day-assigned places onto every linked journey's skeleton
   * suggestions. Called after any assignment mutation (create/delete/move/time) so
   * the journey stays in sync. Non-fatal, like the route's try/catch.
   */
  reconcile(tripId: string, socketId?: string): void {
    try { reconcileTripSkeletons(Number(tripId), socketId); } catch { /* non-fatal */ }
  }

  assignmentExistsInDay(id: string, dayId: string, tripId: string) {
    return svc.assignmentExistsInDay(id, dayId, tripId);
  }

  deleteAssignment(id: string): void {
    svc.deleteAssignment(id);
  }

  reorderAssignments(dayId: string, orderedIds: number[]): void {
    svc.reorderAssignments(dayId, orderedIds as never);
  }

  getAssignmentForTrip(id: string, tripId: string) {
    return svc.getAssignmentForTrip(id, tripId);
  }

  moveAssignment(id: string, newDayId: unknown, orderIndex: number | undefined, oldDayId: unknown) {
    return svc.moveAssignment(id, newDayId as never, orderIndex as never, oldDayId as never);
  }

  getParticipants(id: string) {
    return svc.getParticipants(id);
  }

  updateTime(id: string, placeTime: unknown, endTime: unknown) {
    return svc.updateTime(id, placeTime as never, endTime as never);
  }

  setParticipants(id: string, userIds: number[]) {
    return svc.setParticipants(id, userIds);
  }
}
