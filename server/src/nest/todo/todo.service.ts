import { Injectable } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/todoService';

type Trip = NonNullable<ReturnType<typeof svc.verifyTripAccess>>;

/**
 * Thin Nest wrapper around the existing todo service. Trip-access, the
 * 'packing_edit' permission (shared with packing), the SQL and the WebSocket
 * broadcasts all reuse the legacy code unchanged.
 */
@Injectable()
export class TodoService {
  verifyTripAccess(tripId: string, userId: number) {
    return svc.verifyTripAccess(tripId, userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('packing_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  listItems(tripId: string) {
    return svc.listItems(tripId);
  }

  createItem(tripId: string, data: Parameters<typeof svc.createItem>[1]) {
    return svc.createItem(tripId, data);
  }

  updateItem(tripId: string, id: string, data: Parameters<typeof svc.updateItem>[2], changedKeys: string[]) {
    return svc.updateItem(tripId, id, data, changedKeys);
  }

  deleteItem(tripId: string, id: string): boolean {
    return svc.deleteItem(tripId, id);
  }

  reorderItems(tripId: string, orderedIds: Parameters<typeof svc.reorderItems>[1]): void {
    svc.reorderItems(tripId, orderedIds);
  }

  getCategoryAssignees(tripId: string) {
    return svc.getCategoryAssignees(tripId);
  }

  updateCategoryAssignees(tripId: string, category: string, userIds: number[]) {
    return svc.updateCategoryAssignees(tripId, category, userIds);
  }
}
