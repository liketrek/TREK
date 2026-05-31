import { db } from '../db/database';

export { verifyTripAccess } from './tripAccess';

// ── Items ──────────────────────────────────────────────────────────────────

export function listItems(tripId: string | number) {
  return db.prepare(
    'SELECT * FROM todo_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC'
  ).all(tripId);
}

export function createItem(tripId: string | number, data: {
  name: string; category?: string; due_date?: string; description?: string; assigned_user_id?: number; priority?: number;
}) {
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM todo_items WHERE trip_id = ?').get(tripId) as { max: number | null };
  const sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

  const result = db.prepare(
    'INSERT INTO todo_items (trip_id, name, checked, category, sort_order, due_date, description, assigned_user_id, priority) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)'
  ).run(
    tripId, data.name, data.category || null, sortOrder,
    data.due_date || null, data.description || null, data.assigned_user_id || null, data.priority || 0
  );

  return db.prepare('SELECT * FROM todo_items WHERE id = ?').get(result.lastInsertRowid);
}

export function updateItem(
  tripId: string | number,
  id: string | number,
  data: { name?: string; checked?: number; category?: string; due_date?: string | null; description?: string | null; assigned_user_id?: number | null; priority?: number | null },
  bodyKeys: string[]
) {
  const item = db.prepare('SELECT * FROM todo_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return null;

  db.prepare(`
    UPDATE todo_items SET
      name = COALESCE(?, name),
      checked = CASE WHEN ? IS NOT NULL THEN ? ELSE checked END,
      category = COALESCE(?, category),
      due_date = CASE WHEN ? THEN ? ELSE due_date END,
      description = CASE WHEN ? THEN ? ELSE description END,
      assigned_user_id = CASE WHEN ? THEN ? ELSE assigned_user_id END,
      priority = CASE WHEN ? THEN ? ELSE priority END
    WHERE id = ?
  `).run(
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
    id
  );

  return db.prepare('SELECT * FROM todo_items WHERE id = ?').get(id);
}

export function deleteItem(tripId: string | number, id: string | number) {
  const item = db.prepare('SELECT id FROM todo_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return false;

  db.prepare('DELETE FROM todo_items WHERE id = ?').run(id);
  return true;
}

// ── Category Assignees ─────────────────────────────────────────────────────

export function getCategoryAssignees(tripId: string | number) {
  const rows = db.prepare(`
    SELECT tca.category_name, tca.user_id, u.username, u.avatar
    FROM todo_category_assignees tca
    JOIN users u ON tca.user_id = u.id
    WHERE tca.trip_id = ?
  `).all(tripId);

  const assignees: Record<string, { user_id: number; username: string; avatar: string | null }[]> = {};
  for (const row of rows as any[]) {
    if (!assignees[row.category_name]) assignees[row.category_name] = [];
    assignees[row.category_name].push({ user_id: row.user_id, username: row.username, avatar: row.avatar });
  }

  return assignees;
}

export function updateCategoryAssignees(tripId: string | number, categoryName: string, userIds: number[] | undefined) {
  db.prepare('DELETE FROM todo_category_assignees WHERE trip_id = ? AND category_name = ?').run(tripId, categoryName);

  if (Array.isArray(userIds) && userIds.length > 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO todo_category_assignees (trip_id, category_name, user_id) VALUES (?, ?, ?)');
    for (const uid of userIds) insert.run(tripId, categoryName, uid);
  }

  return db.prepare(`
    SELECT tca.user_id, u.username, u.avatar
    FROM todo_category_assignees tca
    JOIN users u ON tca.user_id = u.id
    WHERE tca.trip_id = ? AND tca.category_name = ?
  `).all(tripId, categoryName);
}

// ── Reorder ────────────────────────────────────────────────────────────────

export function reorderItems(tripId: string | number, orderedIds: number[]) {
  const update = db.prepare('UPDATE todo_items SET sort_order = ? WHERE id = ? AND trip_id = ?');
  const updateMany = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      update.run(index, id, tripId);
    });
  });
  updateMany(orderedIds);
}
