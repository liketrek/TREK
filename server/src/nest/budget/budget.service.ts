import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/budgetService';

type Trip = NonNullable<ReturnType<typeof svc.verifyTripAccess>>;

/**
 * Thin Nest wrapper around the existing budget service. Trip-access, the
 * 'budget_edit' permission, the SQL, settlement maths and the WebSocket
 * broadcasts all reuse the legacy code unchanged.
 */
@Injectable()
export class BudgetService {
  verifyTripAccess(tripId: string, userId: number) {
    return svc.verifyTripAccess(tripId, userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('budget_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  list(tripId: string) {
    return svc.listBudgetItems(tripId);
  }

  perPersonSummary(tripId: string) {
    return svc.getPerPersonSummary(tripId);
  }

  settlement(tripId: string) {
    return svc.calculateSettlement(tripId);
  }

  create(tripId: string, data: Parameters<typeof svc.createBudgetItem>[1]) {
    return svc.createBudgetItem(tripId, data);
  }

  update(id: string, tripId: string, data: Parameters<typeof svc.updateBudgetItem>[2]) {
    return svc.updateBudgetItem(id, tripId, data);
  }

  remove(id: string, tripId: string): boolean {
    return svc.deleteBudgetItem(id, tripId);
  }

  updateMembers(id: string, tripId: string, userIds: number[]) {
    return svc.updateMembers(id, tripId, userIds);
  }

  toggleMemberPaid(id: string, userId: string, paid: boolean) {
    return svc.toggleMemberPaid(id, userId, paid);
  }

  reorderItems(tripId: string, orderedIds: number[]): void {
    svc.reorderBudgetItems(tripId, orderedIds);
  }

  reorderCategories(tripId: string, orderedCategories: string[]): void {
    svc.reorderBudgetCategories(tripId, orderedCategories);
  }

  /**
   * Mirrors the legacy PUT /:id side effect: when a price-linked budget item's
   * total_price changes, write it into the reservation's metadata and broadcast
   * reservation:updated. Non-fatal — a failure here never breaks the budget update.
   */
  syncReservationPrice(tripId: string, reservationId: number, totalPrice: number, socketId: string | undefined): void {
    try {
      const reservation = db.prepare(
        'SELECT id, metadata FROM reservations WHERE id = ? AND trip_id = ?',
      ).get(reservationId, tripId) as { id: number; metadata: string | null } | undefined;
      if (!reservation) return;
      const meta = reservation.metadata ? JSON.parse(reservation.metadata) : {};
      meta.price = String(totalPrice);
      db.prepare('UPDATE reservations SET metadata = ? WHERE id = ?').run(JSON.stringify(meta), reservation.id);
      const updatedRes = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservation.id);
      broadcast(tripId, 'reservation:updated', { reservation: updatedRes }, socketId);
    } catch (err) {
      console.error('[budget] Failed to sync price to reservation:', err);
    }
  }
}
