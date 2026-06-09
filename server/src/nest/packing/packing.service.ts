import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/packingService';

type Trip = NonNullable<ReturnType<typeof svc.verifyTripAccess>>;

/**
 * Thin Nest wrapper around the existing packing service. Trip-access checks, the
 * 'packing_edit' permission, the item/bag SQL, templates and the WebSocket
 * broadcasts all reuse the legacy code unchanged, so behaviour is identical.
 */
@Injectable()
export class PackingService {
  verifyTripAccess(tripId: string, userId: number) {
    return svc.verifyTripAccess(tripId, userId);
  }

  /** Mirrors the inline checkPermission('packing_edit', ...) the legacy route runs. */
  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('packing_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  listItems(tripId: string) {
    return svc.listItems(tripId);
  }

  createItem(tripId: string, data: { name: string; category?: string; checked?: boolean }) {
    return svc.createItem(tripId, data);
  }

  updateItem(tripId: string, id: string, data: Parameters<typeof svc.updateItem>[2], changedKeys: string[]) {
    return svc.updateItem(tripId, id, data, changedKeys);
  }

  deleteItem(tripId: string, id: string): boolean {
    return svc.deleteItem(tripId, id);
  }

  bulkImport(tripId: string, items: Parameters<typeof svc.bulkImport>[1]) {
    return svc.bulkImport(tripId, items);
  }

  reorderItems(tripId: string, orderedIds: Parameters<typeof svc.reorderItems>[1]): void {
    svc.reorderItems(tripId, orderedIds);
  }

  listBags(tripId: string) {
    return svc.listBags(tripId);
  }

  createBag(tripId: string, data: { name: string; color?: string }) {
    return svc.createBag(tripId, data);
  }

  updateBag(tripId: string, bagId: string, data: Parameters<typeof svc.updateBag>[2], changedKeys: string[]) {
    return svc.updateBag(tripId, bagId, data, changedKeys);
  }

  deleteBag(tripId: string, bagId: string): boolean {
    return svc.deleteBag(tripId, bagId);
  }

  setBagMembers(tripId: string, bagId: string, userIds: number[]) {
    return svc.setBagMembers(tripId, bagId, userIds);
  }

  listTemplates() {
    return svc.listTemplates();
  }

  applyTemplate(tripId: string, templateId: string) {
    return svc.applyTemplate(tripId, templateId);
  }

  saveAsTemplate(tripId: string, userId: number, name: string) {
    return svc.saveAsTemplate(tripId, userId, name);
  }

  getCategoryAssignees(tripId: string) {
    return svc.getCategoryAssignees(tripId);
  }

  updateCategoryAssignees(tripId: string, category: string, userIds: number[]) {
    return svc.updateCategoryAssignees(tripId, category, userIds);
  }

  /** Fire-and-forget tag notification, mirroring the legacy dynamic import. */
  notifyTagged(tripId: string, actor: User, category: string, userIds: unknown): void {
    if (!Array.isArray(userIds) || userIds.length === 0) return;
    import('../../services/notificationService').then(({ send }) => {
      const tripInfo = db.prepare('SELECT title FROM trips WHERE id = ?').get(tripId) as { title: string } | undefined;
      send({
        event: 'packing_tagged',
        actorId: actor.id,
        scope: 'trip',
        targetId: Number(tripId),
        params: { trip: tripInfo?.title || 'Untitled', actor: actor.email, category, tripId: String(tripId) },
      }).catch(() => {});
    });
  }
}
