import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { User } from '../../types';
import { DatabaseService, type TripAccess } from '../database/database.service';

type Trip = TripAccess;

@Injectable()
export class ShoppingService {
  constructor(
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  verifyTripAccess(tripId: string | number, userId: number) {
    return this.db.canAccessTrip(tripId, userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('packing_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /** A shopping item may only point at an expense of its own trip. */
  budgetItemBelongsToTrip(tripId: string | number, budgetItemId: number): boolean {
    return !!this.db.get('SELECT id FROM budget_items WHERE id = ? AND trip_id = ?', budgetItemId, tripId);
  }

  listItems(tripId: string | number) {
    return this.db.all(
      'SELECT * FROM shopping_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC',
      tripId
    );
  }

  createItem(tripId: string | number, data: {
    name: string; quantity?: string | null; category?: string | null; assigned_user_id?: number | null; notes?: string | null;
  }) {
    const maxOrder = this.db.get<{ max: number | null }>('SELECT MAX(sort_order) as max FROM shopping_items WHERE trip_id = ?', tripId)!;
    const sortOrder = (maxOrder?.max !== null && maxOrder?.max !== undefined ? maxOrder.max : -1) + 1;

    const result = this.db.run(
      'INSERT INTO shopping_items (trip_id, name, checked, quantity, category, assigned_user_id, notes, sort_order) VALUES (?, ?, 0, ?, ?, ?, ?, ?)',
      tripId, data.name, data.quantity || null, data.category || null, data.assigned_user_id || null, data.notes || null, sortOrder
    );

    return this.db.get('SELECT * FROM shopping_items WHERE id = ?', result.lastInsertRowid);
  }

  updateItem(
    tripId: string | number,
    id: string | number,
    data: { name?: string; checked?: number; quantity?: string | null; category?: string | null; assigned_user_id?: number | null; notes?: string | null; budget_item_id?: number | null },
    bodyKeys: string[]
  ) {
    const item = this.db.get('SELECT * FROM shopping_items WHERE id = ? AND trip_id = ?', id, tripId);
    if (!item) return null;

    this.db.run(`
      UPDATE shopping_items SET
        name = COALESCE(?, name),
        checked = CASE WHEN ? IS NOT NULL THEN ? ELSE checked END,
        quantity = CASE WHEN ? THEN ? ELSE quantity END,
        category = CASE WHEN ? THEN ? ELSE category END,
        assigned_user_id = CASE WHEN ? THEN ? ELSE assigned_user_id END,
        notes = CASE WHEN ? THEN ? ELSE notes END,
        budget_item_id = CASE WHEN ? THEN ? ELSE budget_item_id END
      WHERE id = ?
    `,
      data.name || null,
      data.checked !== undefined ? 1 : null,
      data.checked ? 1 : 0,
      bodyKeys.includes('quantity') ? 1 : 0,
      data.quantity ?? null,
      bodyKeys.includes('category') ? 1 : 0,
      data.category ?? null,
      bodyKeys.includes('assigned_user_id') ? 1 : 0,
      data.assigned_user_id ?? null,
      bodyKeys.includes('notes') ? 1 : 0,
      data.notes ?? null,
      bodyKeys.includes('budget_item_id') ? 1 : 0,
      data.budget_item_id ?? null,
      id
    );

    return this.db.get('SELECT * FROM shopping_items WHERE id = ?', id);
  }

  deleteItem(tripId: string | number, id: string | number): boolean {
    const item = this.db.get('SELECT id FROM shopping_items WHERE id = ? AND trip_id = ?', id, tripId);
    if (!item) return false;
    this.db.run('DELETE FROM shopping_items WHERE id = ?', id);
    return true;
  }

  clearChecked(tripId: string | number): number[] {
    const checked = this.db.all<{ id: number }>('SELECT id FROM shopping_items WHERE trip_id = ? AND checked = 1', tripId);
    if (checked.length > 0) {
      this.db.run('DELETE FROM shopping_items WHERE trip_id = ? AND checked = 1', tripId);
    }
    return checked.map(i => i.id);
  }

  reorderItems(tripId: string | number, orderedIds: number[]): void {
    const stmt = this.db.prepare('UPDATE shopping_items SET sort_order = ? WHERE id = ? AND trip_id = ?');
    this.db.transaction(() => {
      orderedIds.forEach((id, index) => {
        stmt.run(index, id, tripId);
      });
    });
  }
}
