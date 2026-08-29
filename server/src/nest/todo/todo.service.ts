import type { User } from '../../types';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';

type Trip = TripAccess;

/**
 * Todo domain service — owns the todo SQL (moved 1:1 from the legacy
 * services/todoService.ts: identical statements, the `||` falsy-coercion
 * defaults, the bodyKeys sentinel protocol on update and the post-write
 * re-selects). Trip access, the 'packing_edit' permission (shared with
 * packing) and the WebSocket broadcast keep their legacy call paths.
 * Non-Nest consumers (plugin RPC host, the legacy MCP trips registrar) go
 * through todo.bridge.ts instead of importing this class directly.
 */
@Injectable()
export class TodoService {
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

  broadcast<E extends TrekWsTripEventName>(
    tripId: string,
    event: E,
    payload: TrekWsPayload<E>,
    socketId: string | undefined,
  ): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  listItems(tripId: string | number) {
    return this.db.all('SELECT * FROM todo_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC', tripId);
  }

  createItem(
    tripId: string | number,
    data: {
      name: string;
      category?: string | null;
      due_date?: string | null;
      description?: string | null;
      assigned_user_id?: number | null;
      priority?: number;
    },
  ) {
    const maxOrder = this.db.get<{ max: number | null }>(
      'SELECT MAX(sort_order) as max FROM todo_items WHERE trip_id = ?',
      tripId,
    )!;
    const sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

    const result = this.db.run(
      'INSERT INTO todo_items (trip_id, name, checked, category, sort_order, due_date, description, assigned_user_id, priority) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)',
      tripId,
      data.name,
      data.category || null,
      sortOrder,
      data.due_date || null,
      data.description || null,
      data.assigned_user_id || null,
      data.priority || 0,
    );

    return this.db.get('SELECT * FROM todo_items WHERE id = ?', result.lastInsertRowid);
  }

  updateItem(
    tripId: string | number,
    id: string | number,
    data: {
      name?: string;
      checked?: number;
      category?: string | null;
      due_date?: string | null;
      description?: string | null;
      assigned_user_id?: number | null;
      priority?: number | null;
    },
    bodyKeys: string[],
  ) {
    const item = this.db.get('SELECT * FROM todo_items WHERE id = ? AND trip_id = ?', id, tripId);
    if (!item) return null;

    this.db.run(
      `
    UPDATE todo_items SET
      name = COALESCE(?, name),
      checked = CASE WHEN ? IS NOT NULL THEN ? ELSE checked END,
      category = COALESCE(?, category),
      due_date = CASE WHEN ? THEN ? ELSE due_date END,
      description = CASE WHEN ? THEN ? ELSE description END,
      assigned_user_id = CASE WHEN ? THEN ? ELSE assigned_user_id END,
      priority = CASE WHEN ? THEN ? ELSE priority END
    WHERE id = ?
  `,
      data.name || null,
      data.checked !== undefined ? 1 : null,
      data.checked ? 1 : 0,
      data.category || null,
      bodyKeys.includes('due_date') ? 1 : 0,
      data.due_date ?? null,
      bodyKeys.includes('description') ? 1 : 0,
      data.description ?? null,
      bodyKeys.includes('assigned_user_id') ? 1 : 0,
      data.assigned_user_id ?? null,
      bodyKeys.includes('priority') ? 1 : 0,
      data.priority ?? 0,
      id,
    );

    return this.db.get('SELECT * FROM todo_items WHERE id = ?', id);
  }

  deleteItem(tripId: string | number, id: string | number): boolean {
    const item = this.db.get('SELECT id FROM todo_items WHERE id = ? AND trip_id = ?', id, tripId);
    if (!item) return false;

    this.db.run('DELETE FROM todo_items WHERE id = ?', id);
    return true;
  }

  reorderItems(tripId: string | number, orderedIds: number[]): void {
    const update = this.db.prepare('UPDATE todo_items SET sort_order = ? WHERE id = ? AND trip_id = ?');
    this.db.transaction(() => {
      orderedIds.forEach((id, index) => {
        update.run(index, id, tripId);
      });
    });
  }

  getCategoryAssignees(tripId: string | number) {
    const rows = this.db.all<{ category_name: string; user_id: number; username: string; avatar: string | null }>(
      `
    SELECT tca.category_name, tca.user_id, u.username, u.avatar
    FROM todo_category_assignees tca
    JOIN users u ON tca.user_id = u.id
    WHERE tca.trip_id = ?
  `,
      tripId,
    );

    const assignees: Record<string, { user_id: number; username: string; avatar: string | null }[]> = {};
    for (const row of rows) {
      if (!assignees[row.category_name]) assignees[row.category_name] = [];
      assignees[row.category_name].push({ user_id: row.user_id, username: row.username, avatar: row.avatar });
    }

    return assignees;
  }

  updateCategoryAssignees(tripId: string | number, categoryName: string, userIds: number[] | undefined) {
    this.db.transaction(() => {
      this.db.run('DELETE FROM todo_category_assignees WHERE trip_id = ? AND category_name = ?', tripId, categoryName);

      if (Array.isArray(userIds) && userIds.length > 0) {
        const insert = this.db.prepare(
          'INSERT OR IGNORE INTO todo_category_assignees (trip_id, category_name, user_id) VALUES (?, ?, ?)',
        );
        // Only people on this trip may be assigned, the way packing filters bag
        // members and reservations filter travellers. Dropped rather than
        // rejected: a copied trip carries assignee ids across before its members
        // exist, and a 400 would make the picker unusable there.
        const roster = this.db.rosterUserIds(tripId);
        for (const uid of userIds) if (roster.has(uid)) insert.run(tripId, categoryName, uid);
      }
    });

    return this.db.all(
      `
    SELECT tca.user_id, u.username, u.avatar
    FROM todo_category_assignees tca
    JOIN users u ON tca.user_id = u.id
    WHERE tca.trip_id = ? AND tca.category_name = ?
  `,
      tripId,
      categoryName,
    );
  }
}
