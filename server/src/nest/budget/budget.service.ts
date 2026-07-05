import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/budgetService';
import { getRates } from '../../services/exchangeRateService';

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

  async settlement(tripId: string, base: string | undefined, tripCurrency: string) {
    const effectiveBase = (base || tripCurrency || 'EUR').toUpperCase();
    const rates = await getRates(effectiveBase);
    return svc.calculateSettlement(tripId, { base: effectiveBase, rates, tripCurrency });
  }

  async create(tripId: string, data: Parameters<typeof svc.createBudgetItem>[1]) {
    await svc.freezeForeignRate(tripId, data);
    return svc.createBudgetItem(tripId, data);
  }

  async update(id: string, tripId: string, data: Parameters<typeof svc.updateBudgetItem>[2]) {
    await svc.freezeForeignRate(tripId, data, id);
    return svc.updateBudgetItem(id, tripId, data);
  }

  remove(id: string, tripId: string): boolean {
    return svc.deleteBudgetItem(id, tripId);
  }

  updateMembers(id: string, tripId: string, userIds: number[]) {
    return svc.updateMembers(id, tripId, userIds);
  }

  toggleMemberPaid(id: string, tripId: string, userId: string, paid: boolean) {
    return svc.toggleMemberPaid(id, tripId, userId, paid);
  }

  setPayers(id: string, tripId: string, payers: { user_id: number; amount: number }[]) {
    return svc.setItemPayers(id, tripId, payers);
  }

  listSettlements(tripId: string) {
    return svc.listSettlements(tripId);
  }

  async createSettlement(tripId: string, data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null }, userId: number) {
    // Freeze the FX rate for the display currency the amount was entered in so the
    // transfer keeps cancelling its expense when live rates drift (#1445).
    await svc.freezeForeignRate(tripId, data);
    return svc.createSettlement(tripId, data, userId);
  }

  async updateSettlement(id: string, tripId: string, data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null }) {
    // Pass the settlement's stored currency so an edit that doesn't change it keeps
    // the already-frozen rate (#1445) — otherwise a live-rate drift would re-open a
    // settled position on an unrelated edit.
    const existing = svc.listSettlements(tripId).find((s) => s.id === Number(id));
    await svc.freezeForeignRate(tripId, data, undefined, existing?.currency ?? null);
    return svc.updateSettlement(id, tripId, data);
  }

  deleteSettlement(id: string, tripId: string): boolean {
    return svc.deleteSettlement(id, tripId);
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
