import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/reservationService';
import { createBudgetItem, updateBudgetItem, deleteBudgetItem, linkBudgetItemToReservation } from '../../services/budgetService';
import { typeToCostCategory } from '@trek/shared';

type Trip = NonNullable<ReturnType<typeof svc.verifyTripAccess>>;
type BudgetEntry = { total_price?: number; category?: string } | undefined;

/**
 * Thin Nest wrapper around the existing reservation service. Trip-access, the
 * 'reservation_edit' permission, the SQL and the WebSocket broadcasts reuse the
 * legacy code unchanged. The legacy route's budget side effects (auto-create /
 * update / delete a linked budget item) and the booking notification are
 * encapsulated here so the controller stays thin — behaviour is 1:1.
 */
@Injectable()
export class ReservationsService {
  verifyTripAccess(tripId: string, userId: number) {
    return svc.verifyTripAccess(tripId, userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('reservation_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  list(tripId: string) {
    return svc.listReservations(tripId);
  }

  // Cross-trip "upcoming reservations" feed (dashboard widget). Reuses the legacy
  // query unchanged; the default limit (6) matches the legacy inline handler.
  listUpcoming(userId: number) {
    return svc.getUpcomingReservations(userId);
  }

  create(tripId: string, data: Parameters<typeof svc.createReservation>[1]) {
    return svc.createReservation(tripId, data);
  }

  updatePositions(tripId: string, positions: Parameters<typeof svc.updatePositions>[1], dayId: unknown): void {
    svc.updatePositions(tripId, positions, dayId as Parameters<typeof svc.updatePositions>[2]);
  }

  getReservation(id: string, tripId: string) {
    return svc.getReservation(id, tripId);
  }

  update(id: string, tripId: string, data: Parameters<typeof svc.updateReservation>[2], current: Parameters<typeof svc.updateReservation>[3]) {
    return svc.updateReservation(id, tripId, data, current);
  }

  remove(id: string, tripId: string) {
    return svc.deleteReservation(id, tripId);
  }

  /** POST side effect: auto-create a linked budget item when a price is provided. */
  syncBudgetOnCreate(tripId: string, reservationId: number, title: string, type: string | undefined, entry: BudgetEntry, socketId: string | undefined): void {
    if (!entry || !(Number(entry.total_price) > 0)) return;
    try {
      const item = linkBudgetItemToReservation(tripId, reservationId, {
        name: title,
        category: entry.category || type || 'Other',
        total_price: entry.total_price!,
      });
      broadcast(tripId, 'budget:created', { item }, socketId);
    } catch (err) {
      console.error('[reservations] Failed to create budget entry:', err);
    }
  }

  /** PUT side effect: drop the linked budget item when the price is cleared, else create/update it. */
  syncBudgetOnUpdate(tripId: string, id: string, title: string, type: string | undefined, currentTitle: string, currentType: string | undefined, entry: BudgetEntry, socketId: string | undefined): void {
    // When the booking type changes, keep a linked expense's category in sync —
    // but only if it still carries the auto-derived category (so a manual pick in
    // the Costs editor is preserved). Runs regardless of create_budget_entry.
    if (type && currentType && type !== currentType) {
      const linked = db.prepare('SELECT id, category FROM budget_items WHERE trip_id = ? AND reservation_id = ?').get(tripId, id) as { id: number; category: string } | undefined;
      if (linked) {
        const oldCat = typeToCostCategory(currentType);
        const newCat = typeToCostCategory(type);
        if (oldCat !== newCat && linked.category === oldCat) {
          const updated = updateBudgetItem(linked.id, tripId, { category: newCat });
          broadcast(tripId, 'budget:updated', { item: updated }, socketId);
        }
      }
    }

    // No budget entry on the payload — the booking edit isn't touching its linked
    // expense, so leave any linked item alone. Expenses are managed from the
    // booking's Costs section / the Costs tab, not by re-saving the booking.
    if (!entry) return;

    if (!(Number(entry.total_price) > 0)) {
      // Explicit clear (total_price 0/empty) — drop the linked item.
      const linked = db.prepare('SELECT id FROM budget_items WHERE trip_id = ? AND reservation_id = ?').get(tripId, id) as { id: number } | undefined;
      if (linked) {
        deleteBudgetItem(linked.id, tripId);
        broadcast(tripId, 'budget:deleted', { itemId: linked.id }, socketId);
      }
      return;
    }

    try {
      const itemName = title || currentTitle;
      const category = entry.category || type || currentType || 'Other';
      const existing = db.prepare('SELECT id FROM budget_items WHERE trip_id = ? AND reservation_id = ?').get(tripId, id) as { id: number } | undefined;
      if (existing) {
        const updated = updateBudgetItem(existing.id, tripId, { name: itemName, category, total_price: entry.total_price });
        broadcast(tripId, 'budget:updated', { item: updated }, socketId);
      } else {
        const item = createBudgetItem(tripId, { name: itemName, category, total_price: entry.total_price });
        db.prepare('UPDATE budget_items SET reservation_id = ? WHERE id = ?').run(id, item.id);
        item.reservation_id = Number(id);
        broadcast(tripId, 'budget:created', { item }, socketId);
      }
    } catch (err) {
      console.error('[reservations] Failed to create/update budget entry:', err);
    }
  }

  /** Fire-and-forget booking-change notification, mirroring the legacy dynamic import. */
  notifyBookingChange(tripId: string, actor: User, booking: string, type: string): void {
    import('../../services/notificationService').then(({ send }) => {
      const tripInfo = db.prepare('SELECT title FROM trips WHERE id = ?').get(tripId) as { title: string } | undefined;
      send({
        event: 'booking_change',
        actorId: actor.id,
        scope: 'trip',
        targetId: Number(tripId),
        params: { trip: tripInfo?.title || 'Untitled', actor: actor.email, booking, type: type || 'booking', tripId: String(tripId) },
      }).catch(() => {});
    });
  }
}
