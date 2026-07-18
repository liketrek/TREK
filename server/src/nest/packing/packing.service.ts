import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/packingService';

/** Privacy fields stamped on a packing item (#858). */
type PrivacyFields = { is_private?: number; owner_id?: number | null };

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

  /**
   * Broadcast an item event, but keep private items (#858) off other members'
   * screens: when the item is private the event is delivered only to its owner's
   * sockets. Shared items broadcast to the whole trip room as before.
   */
  broadcastItem(tripId: string, event: string, payload: Record<string, unknown>, item: PrivacyFields | null | undefined, socketId: string | undefined): void {
    const onlyUserId = item?.is_private && item.owner_id != null ? item.owner_id : undefined;
    broadcast(tripId, event, payload, socketId, onlyUserId);
  }

  /** Deliver an item event to a specific set of viewers (#858 shared items) — the
   *  owner plus the recipients it was shared with — without leaking to the room. */
  broadcastToViewers(tripId: string, event: string, payload: Record<string, unknown>, viewerIds: number[], socketId: string | undefined): void {
    for (const uid of new Set(viewerIds)) {
      if (uid != null) broadcast(tripId, event, payload, socketId, uid);
    }
  }

  /** The users who can currently see an item: everyone (null) for Common, or
   *  owner + recipients for a restricted item. */
  viewersOf(item: { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] } | null | undefined): number[] | null {
    if (!item || !item.is_private) return null; // Common — visible to the whole room
    const ids = [item.owner_id, ...(item.recipients || []).map(r => r.user_id)].filter((x): x is number => x != null);
    return ids;
  }

  listItems(tripId: string, userId?: number) {
    return svc.listItems(tripId, userId);
  }

  /** Reads an item's current privacy fields (#858) before an update, so the
   *  controller can detect a public↔private transition and route the broadcast. */
  getItemPrivacy(tripId: string, id: string): PrivacyFields | undefined {
    return db.prepare('SELECT is_private, owner_id FROM packing_items WHERE id = ? AND trip_id = ?').get(id, tripId) as PrivacyFields | undefined;
  }

  createItem(tripId: string, data: Parameters<typeof svc.createItem>[1], ownerId?: number) {
    return svc.createItem(tripId, data, ownerId);
  }

  setItemSharing(tripId: string, id: string, actingUserId: number, visibility: svc.PackingVisibility, recipientIds: number[]) {
    return svc.setItemSharing(tripId, id, actingUserId, visibility, recipientIds);
  }

  addContributor(tripId: string, id: string, userId: number) {
    return svc.addContributor(tripId, id, userId);
  }

  removeContributor(tripId: string, id: string, userId: number) {
    return svc.removeContributor(tripId, id, userId);
  }

  cloneItem(tripId: string, id: string, userId: number) {
    return svc.cloneItem(tripId, id, userId);
  }

  updateItem(tripId: string, id: string, data: Parameters<typeof svc.updateItem>[2], changedKeys: string[], ifMatch?: string, actingUserId?: number) {
    return svc.updateItem(tripId, id, data, changedKeys, ifMatch, actingUserId);
  }

  deleteItem(tripId: string, id: string) {
    return svc.deleteItem(tripId, id);
  }

  bulkImport(tripId: string, items: Parameters<typeof svc.bulkImport>[1], ownerId?: number) {
    return svc.bulkImport(tripId, items, ownerId);
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

  applyTemplate(tripId: string, templateId: string, visibility: 'common' | 'personal', ownerId: number) {
    return svc.applyTemplate(tripId, templateId, visibility, ownerId);
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
