import { db } from '../db/database';
import { avatarUrl } from './authService';
import type { UpdateConflict } from './conflictResult';

const BAG_COLORS = ['#6366f1', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', '#f59e0b', '#3b82f6', '#84cc16', '#d946ef', '#14b8a6', '#f43f5e', '#a855f7', '#eab308', '#64748b'];

export { verifyTripAccess } from './tripAccess';

// ── Items ──────────────────────────────────────────────────────────────────

/**
 * Attach the bringer name, recipients and co-contributors to a set of packing
 * items (#858 three-tier sharing). Batched so the list endpoint stays one round
 * of queries regardless of item count.
 */
function enrichItems(items: any[]): any[] {
  if (items.length === 0) return items;
  const ids = items.map(i => i.id);
  const placeholders = ids.map(() => '?').join(',');

  const owners = db.prepare(`SELECT id, username FROM users WHERE id IN (SELECT owner_id FROM packing_items WHERE id IN (${placeholders}))`).all(...ids) as { id: number; username: string }[];
  const ownerName = new Map(owners.map(o => [o.id, o.username]));

  const recipientRows = db.prepare(`
    SELECT r.item_id, r.user_id, COALESCE(u.display_name, u.username) AS username
    FROM packing_item_recipients r JOIN users u ON u.id = r.user_id
    WHERE r.item_id IN (${placeholders})
  `).all(...ids) as { item_id: number; user_id: number; username: string }[];
  const recipientsByItem = new Map<number, { user_id: number; username: string }[]>();
  for (const r of recipientRows) {
    if (!recipientsByItem.has(r.item_id)) recipientsByItem.set(r.item_id, []);
    recipientsByItem.get(r.item_id)!.push({ user_id: r.user_id, username: r.username });
  }

  const contributorRows = db.prepare(`
    SELECT c.item_id, c.user_id, c.status, COALESCE(u.display_name, u.username) AS username
    FROM packing_item_contributors c JOIN users u ON u.id = c.user_id
    WHERE c.item_id IN (${placeholders})
  `).all(...ids) as { item_id: number; user_id: number; status: string; username: string }[];
  const contributorsByItem = new Map<number, { user_id: number; username: string; status: string }[]>();
  for (const c of contributorRows) {
    if (!contributorsByItem.has(c.item_id)) contributorsByItem.set(c.item_id, []);
    contributorsByItem.get(c.item_id)!.push({ user_id: c.user_id, username: c.username, status: c.status });
  }

  return items.map(i => ({
    ...i,
    owner_username: i.owner_id != null ? ownerName.get(i.owner_id) ?? null : null,
    recipients: recipientsByItem.get(i.id) || [],
    contributors: contributorsByItem.get(i.id) || [],
  }));
}

export function listItems(tripId: string | number, userId?: number) {
  // Three-tier visibility (#858): Common (is_private=0) is visible to everyone;
  // Personal/Shared (is_private=1) only to the owner (bringer) and the recipients
  // it was explicitly shared with. Without a userId (internal callers such as
  // trip export) the unfiltered list is returned for back-compat.
  let rows: any[];
  if (userId == null) {
    rows = db.prepare(
      'SELECT * FROM packing_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC'
    ).all(tripId) as any[];
  } else {
    rows = db.prepare(`
      SELECT * FROM packing_items
      WHERE trip_id = ?
        AND (is_private = 0
             OR owner_id = ?
             OR EXISTS (SELECT 1 FROM packing_item_recipients r WHERE r.item_id = packing_items.id AND r.user_id = ?))
      ORDER BY sort_order ASC, created_at ASC
    `).all(tripId, userId, userId) as any[];
  }
  return enrichItems(rows);
}

export type PackingVisibility = 'common' | 'personal' | 'shared';

/** Maps the three-tier visibility (#858) onto the stored is_private flag. */
function visibilityToPrivate(visibility?: PackingVisibility, isPrivateFallback?: boolean): number {
  if (visibility) return visibility === 'common' ? 0 : 1;
  return isPrivateFallback ? 1 : 0;
}

export function createItem(
  tripId: string | number,
  data: { name: string; category?: string; checked?: boolean; quantity?: number; is_private?: boolean; visibility?: PackingVisibility; recipient_ids?: number[] },
  ownerId?: number,
) {
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM packing_items WHERE trip_id = ?').get(tripId) as { max: number | null };
  const sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;
  const qty = Math.max(1, Math.min(999, Number(data.quantity) || 1));
  const isPrivate = visibilityToPrivate(data.visibility, data.is_private);

  const create = db.transaction(() => {
    const result = db.prepare(
      'INSERT INTO packing_items (trip_id, name, checked, category, sort_order, quantity, is_private, owner_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(tripId, data.name, data.checked ? 1 : 0, data.category || 'Allgemein', sortOrder, qty, isPrivate, ownerId ?? null);
    const itemId = Number(result.lastInsertRowid);
    // "Shared with specific people" — record the recipients it covers.
    if (data.visibility === 'shared' && Array.isArray(data.recipient_ids)) {
      const ins = db.prepare('INSERT OR IGNORE INTO packing_item_recipients (item_id, user_id) VALUES (?, ?)');
      for (const uid of data.recipient_ids) if (uid !== ownerId) ins.run(itemId, uid);
    }
    return itemId;
  });
  const itemId = create();

  return enrichItems([db.prepare('SELECT * FROM packing_items WHERE id = ?').get(itemId)])[0];
}

export function updateItem(
  tripId: string | number,
  id: string | number,
  data: { name?: string; checked?: number; category?: string; weight_grams?: number | null; bag_id?: number | null; quantity?: number; is_private?: boolean },
  bodyKeys: string[],
  ifMatch?: string,
  actingUserId?: number,
): unknown | UpdateConflict | null {
  const item = db.prepare('SELECT * FROM packing_items WHERE id = ? AND trip_id = ?').get(id, tripId) as { updated_at?: string | null; owner_id?: number | null } | undefined;
  if (!item) return null;

  // Optimistic concurrency (#1135): reject a stale offline overwrite. Absent
  // token => unconditional update (back-compat with older clients).
  if (ifMatch !== undefined && item.updated_at != null && String(item.updated_at) !== ifMatch) {
    return { conflict: true, server: db.prepare('SELECT * FROM packing_items WHERE id = ?').get(id) };
  }

  // Privatizing an unowned (legacy) item stamps the acting user as its owner so
  // the visibility filter still has someone to match (#858).
  const claimOwner = bodyKeys.includes('is_private') && !!data.is_private && item.owner_id == null && actingUserId != null;

  db.prepare(`
    UPDATE packing_items SET
      name = COALESCE(?, name),
      checked = CASE WHEN ? IS NOT NULL THEN ? ELSE checked END,
      category = COALESCE(?, category),
      weight_grams = CASE WHEN ? THEN ? ELSE weight_grams END,
      bag_id = CASE WHEN ? THEN ? ELSE bag_id END,
      quantity = CASE WHEN ? THEN ? ELSE quantity END,
      is_private = CASE WHEN ? THEN ? ELSE is_private END,
      owner_id = CASE WHEN ? THEN ? ELSE owner_id END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    data.name || null,
    data.checked !== undefined ? 1 : null,
    data.checked ? 1 : 0,
    data.category || null,
    bodyKeys.includes('weight_grams') ? 1 : 0,
    data.weight_grams ?? null,
    bodyKeys.includes('bag_id') ? 1 : 0,
    data.bag_id ?? null,
    bodyKeys.includes('quantity') ? 1 : 0,
    data.quantity ? Math.max(1, Math.min(999, Number(data.quantity))) : 1,
    bodyKeys.includes('is_private') ? 1 : 0,
    data.is_private ? 1 : 0,
    claimOwner ? 1 : 0,
    actingUserId ?? null,
    id
  );

  return enrichItems([db.prepare('SELECT * FROM packing_items WHERE id = ?').get(id)])[0];
}

// ── Three-tier sharing (#858): recipients, contributors, clone ───────────────

/** Loads an item scoped to its trip (the trip-access check happens in the controller). */
function getItemInTrip(tripId: string | number, id: string | number) {
  return db.prepare('SELECT * FROM packing_items WHERE id = ? AND trip_id = ?').get(id, tripId) as
    { id: number; owner_id: number | null; is_private: number; name: string; category: string | null; quantity: number } | undefined;
}

/**
 * Re-set who a "shared with specific people" item covers, and its visibility tier.
 * Only the owner (bringer) may change this; a non-owner caller is rejected with null.
 */
export function setItemSharing(
  tripId: string | number,
  id: string | number,
  actingUserId: number,
  visibility: PackingVisibility,
  recipientIds: number[],
) {
  const item = getItemInTrip(tripId, id);
  if (!item) return null;
  // The owner controls sharing; an unowned legacy item is claimed by the actor.
  if (item.owner_id != null && item.owner_id !== actingUserId) return { forbidden: true as const };

  const run = db.transaction(() => {
    db.prepare('UPDATE packing_items SET is_private = ?, owner_id = COALESCE(owner_id, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(visibilityToPrivate(visibility), actingUserId, id);
    db.prepare('DELETE FROM packing_item_recipients WHERE item_id = ?').run(id);
    if (visibility === 'shared') {
      const ins = db.prepare('INSERT OR IGNORE INTO packing_item_recipients (item_id, user_id) VALUES (?, ?)');
      const owner = item.owner_id ?? actingUserId;
      for (const uid of recipientIds) if (uid !== owner) ins.run(id, uid);
    }
    // Leaving the Common tier drops any co-contributors (they only apply to Common).
    if (visibility !== 'common') db.prepare('DELETE FROM packing_item_contributors WHERE item_id = ?').run(id);
  });
  run();
  return enrichItems([db.prepare('SELECT * FROM packing_items WHERE id = ?').get(id)])[0];
}

/** "I can bring that too" — adds the user as a co-contributor on a Common item. */
export function addContributor(tripId: string | number, id: string | number, userId: number) {
  const item = getItemInTrip(tripId, id);
  if (!item || item.is_private !== 0) return null; // co-contribution is a Common-list concept
  if (item.owner_id === userId) return null; // the bringer is already covering it
  db.prepare("INSERT OR IGNORE INTO packing_item_contributors (item_id, user_id, status) VALUES (?, ?, 'accepted')").run(id, userId);
  return enrichItems([db.prepare('SELECT * FROM packing_items WHERE id = ?').get(id)])[0];
}

export function removeContributor(tripId: string | number, id: string | number, userId: number) {
  const item = getItemInTrip(tripId, id);
  if (!item) return null;
  db.prepare('DELETE FROM packing_item_contributors WHERE item_id = ? AND user_id = ?').run(id, userId);
  return enrichItems([db.prepare('SELECT * FROM packing_items WHERE id = ?').get(id)])[0];
}

/** Clone a (Common) item onto the caller's Personal list as a private starting point. */
export function cloneItem(tripId: string | number, id: string | number, userId: number) {
  const item = getItemInTrip(tripId, id);
  if (!item) return null;
  return createItem(tripId, { name: item.name, category: item.category || undefined, quantity: item.quantity, visibility: 'personal' }, userId);
}

export function deleteItem(tripId: string | number, id: string | number) {
  // Return the deleted row (not just a boolean) so callers can target the
  // delete broadcast at the owner when the item was private (#858).
  const item = db.prepare('SELECT * FROM packing_items WHERE id = ? AND trip_id = ?').get(id, tripId) as { is_private?: number; owner_id?: number | null } | undefined;
  if (!item) return null;

  db.prepare('DELETE FROM packing_items WHERE id = ?').run(id);
  return item;
}

// ── Bulk Import ────────────────────────────────────────────────────────────

interface ImportItem {
  name?: string;
  checked?: boolean;
  category?: string;
  weight_grams?: string | number;
  bag?: string;
  quantity?: number;
  is_private?: boolean;
}

export function bulkImport(tripId: string | number, items: ImportItem[], ownerId?: number) {
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM packing_items WHERE trip_id = ?').get(tripId) as { max: number | null };
  let sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

  const stmt = db.prepare('INSERT INTO packing_items (trip_id, name, checked, category, weight_grams, bag_id, sort_order, quantity, is_private, owner_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
  const created: any[] = [];

  const insertAll = db.transaction(() => {
    for (const item of items) {
      if (!item.name?.trim()) continue;
      const checked = item.checked ? 1 : 0;
      const weight = item.weight_grams ? parseInt(String(item.weight_grams)) || null : null;

      // Resolve bag by name if provided
      let bagId = null;
      if (item.bag?.trim()) {
        const bagName = item.bag.trim();
        const existing = db.prepare('SELECT id FROM packing_bags WHERE trip_id = ? AND name = ?').get(tripId, bagName) as { id: number } | undefined;
        if (existing) {
          bagId = existing.id;
        } else {
          const bagCount = (db.prepare('SELECT COUNT(*) as c FROM packing_bags WHERE trip_id = ?').get(tripId) as { c: number }).c;
          const newBag = db.prepare('INSERT INTO packing_bags (trip_id, name, color) VALUES (?, ?, ?)').run(tripId, bagName, BAG_COLORS[bagCount % BAG_COLORS.length]);
          bagId = newBag.lastInsertRowid;
        }
      }

      const qty = Math.max(1, Math.min(999, Number(item.quantity) || 1));
      const result = stmt.run(tripId, item.name.trim(), checked, item.category?.trim() || 'Other', weight, bagId, sortOrder++, qty, item.is_private ? 1 : 0, ownerId ?? null);
      created.push(db.prepare('SELECT * FROM packing_items WHERE id = ?').get(result.lastInsertRowid));
    }
  });

  insertAll();
  return created;
}

// ── Bags ───────────────────────────────────────────────────────────────────

export function listBags(tripId: string | number) {
  const bags = db.prepare('SELECT * FROM packing_bags WHERE trip_id = ? ORDER BY sort_order, id').all(tripId) as any[];
  const members = db.prepare(`
    SELECT bm.bag_id, bm.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_bag_members bm
    JOIN users u ON bm.user_id = u.id
    JOIN packing_bags b ON bm.bag_id = b.id
    WHERE b.trip_id = ?
  `).all(tripId) as { bag_id: number; user_id: number; username: string; avatar: string | null }[];
  const membersByBag = new Map<number, typeof members>();
  for (const m of members) {
    if (!membersByBag.has(m.bag_id)) membersByBag.set(m.bag_id, []);
    membersByBag.get(m.bag_id)!.push(m);
  }
  return bags.map(b => ({
    ...b,
    members: (membersByBag.get(b.id) || []).map(m => ({ ...m, avatar: avatarUrl(m) })),
  }));
}

/** Owner + collaborators of a trip — the only user ids that may be assigned to a bag. */
function tripRosterIds(tripId: string | number): Set<number> {
  const rows = db.prepare('SELECT user_id FROM trip_members WHERE trip_id = ? UNION SELECT user_id FROM trips WHERE id = ?').all(tripId, tripId) as { user_id: number }[];
  return new Set(rows.map(r => r.user_id));
}

export function setBagMembers(tripId: string | number, bagId: string | number, userIds: number[]) {
  const bag = db.prepare('SELECT * FROM packing_bags WHERE id = ? AND trip_id = ?').get(bagId, tripId);
  if (!bag) return null;
  db.prepare('DELETE FROM packing_bag_members WHERE bag_id = ?').run(bagId);
  const ins = db.prepare('INSERT OR IGNORE INTO packing_bag_members (bag_id, user_id) VALUES (?, ?)');
  // Only real trip members may be bag members — never write an arbitrary account id.
  const roster = tripRosterIds(tripId);
  for (const uid of userIds) if (roster.has(uid)) ins.run(bagId, uid);
  const rows = db.prepare(`
    SELECT bm.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_bag_members bm JOIN users u ON bm.user_id = u.id
    WHERE bm.bag_id = ?
  `).all(bagId) as { user_id: number; username: string; avatar: string | null }[];
  return rows.map(m => ({ ...m, avatar: avatarUrl(m) }));
}

export function createBag(tripId: string | number, data: { name: string; color?: string }) {
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM packing_bags WHERE trip_id = ?').get(tripId) as { max: number | null };
  const result = db.prepare('INSERT INTO packing_bags (trip_id, name, color, sort_order) VALUES (?, ?, ?, ?)').run(
    tripId, data.name.trim(), data.color || '#6366f1', (maxOrder.max ?? -1) + 1
  );
  return db.prepare('SELECT * FROM packing_bags WHERE id = ?').get(result.lastInsertRowid);
}

export function updateBag(
  tripId: string | number,
  bagId: string | number,
  data: { name?: string; color?: string; weight_limit_grams?: number | null; user_id?: number | null },
  bodyKeys?: string[]
) {
  const bag = db.prepare('SELECT * FROM packing_bags WHERE id = ? AND trip_id = ?').get(bagId, tripId);
  if (!bag) return null;

  // A bag may only be assigned to a real trip member; an off-roster id becomes unassigned.
  const assignUser = data.user_id != null && tripRosterIds(tripId).has(data.user_id) ? data.user_id : null;
  db.prepare(`UPDATE packing_bags SET
    name = COALESCE(?, name),
    color = COALESCE(?, color),
    weight_limit_grams = ?,
    user_id = CASE WHEN ? THEN ? ELSE user_id END
    WHERE id = ?`).run(
    data.name?.trim() || null,
    data.color || null,
    data.weight_limit_grams ?? (bag as any).weight_limit_grams ?? null,
    bodyKeys?.includes('user_id') ? 1 : 0,
    assignUser,
    bagId
  );
  return db.prepare('SELECT b.*, COALESCE(u.display_name, u.username) as assigned_username FROM packing_bags b LEFT JOIN users u ON b.user_id = u.id WHERE b.id = ?').get(bagId);
}

export function deleteBag(tripId: string | number, bagId: string | number) {
  const bag = db.prepare('SELECT * FROM packing_bags WHERE id = ? AND trip_id = ?').get(bagId, tripId);
  if (!bag) return false;

  db.prepare('DELETE FROM packing_bags WHERE id = ?').run(bagId);
  return true;
}

// ── List Templates ─────────────────────────────────────────────────────────

/**
 * Read-only template list for trip members (name + item count), so non-admins
 * can pick a template to apply. Management (create/edit/delete) stays admin-only
 * under /api/admin/packing-templates.
 */
export function listTemplates() {
  return db.prepare(`
    SELECT pt.id, pt.name,
      (SELECT COUNT(*) FROM packing_template_items ti JOIN packing_template_categories tc ON ti.category_id = tc.id WHERE tc.template_id = pt.id) as item_count
    FROM packing_templates pt
    ORDER BY pt.created_at DESC
  `).all() as { id: number; name: string; item_count: number }[];
}

// ── Apply Template ─────────────────────────────────────────────────────────

export function applyTemplate(tripId: string | number, templateId: string | number) {
  const templateItems = db.prepare(`
    SELECT ti.name, tc.name as category
    FROM packing_template_items ti
    JOIN packing_template_categories tc ON ti.category_id = tc.id
    WHERE tc.template_id = ?
    ORDER BY tc.sort_order, ti.sort_order
  `).all(templateId) as { name: string; category: string }[];

  if (templateItems.length === 0) return null;

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM packing_items WHERE trip_id = ?').get(tripId) as { max: number | null };
  let sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

  const insert = db.prepare('INSERT INTO packing_items (trip_id, name, checked, category, sort_order, updated_at) VALUES (?, ?, 0, ?, ?, CURRENT_TIMESTAMP)');
  const added: any[] = [];
  for (const ti of templateItems) {
    const result = insert.run(tripId, ti.name, ti.category, sortOrder++);
    const item = db.prepare('SELECT * FROM packing_items WHERE id = ?').get(result.lastInsertRowid);
    added.push(item);
  }

  return added;
}

// ── Save as Template ──────────────────────────────────────────────────────

export function saveAsTemplate(tripId: string | number, userId: number, templateName: string) {
  const items = db.prepare(
    'SELECT name, category FROM packing_items WHERE trip_id = ? ORDER BY sort_order ASC'
  ).all(tripId) as { name: string; category: string }[];

  if (items.length === 0) return null;

  const result = db.prepare('INSERT INTO packing_templates (name, created_by) VALUES (?, ?)').run(templateName, userId);
  const templateId = result.lastInsertRowid;

  const categories = [...new Set(items.map(i => i.category || 'Other'))];
  const catIdMap = new Map<string, number | bigint>();

  for (let i = 0; i < categories.length; i++) {
    const catResult = db.prepare('INSERT INTO packing_template_categories (template_id, name, sort_order) VALUES (?, ?, ?)').run(templateId, categories[i], i);
    catIdMap.set(categories[i], catResult.lastInsertRowid);
  }

  const itemsByCategory = new Map<string, number>();
  for (const item of items) {
    const catId = catIdMap.get(item.category || 'Other')!;
    const order = itemsByCategory.get(item.category || 'Other') || 0;
    db.prepare('INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, ?, ?)').run(catId, item.name, order);
    itemsByCategory.set(item.category || 'Other', order + 1);
  }

  return { id: Number(templateId), name: templateName, categoryCount: categories.length, itemCount: items.length };
}

// ── Category Assignees ─────────────────────────────────────────────────────

export function getCategoryAssignees(tripId: string | number) {
  const rows = db.prepare(`
    SELECT pca.category_name, pca.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_category_assignees pca
    JOIN users u ON pca.user_id = u.id
    WHERE pca.trip_id = ?
  `).all(tripId);

  // Group by category
  const assignees: Record<string, { user_id: number; username: string; avatar: string | null }[]> = {};
  for (const row of rows as any[]) {
    if (!assignees[row.category_name]) assignees[row.category_name] = [];
    assignees[row.category_name].push({ user_id: row.user_id, username: row.username, avatar: avatarUrl(row) });
  }

  return assignees;
}

export function updateCategoryAssignees(tripId: string | number, categoryName: string, userIds: number[] | undefined) {
  db.prepare('DELETE FROM packing_category_assignees WHERE trip_id = ? AND category_name = ?').run(tripId, categoryName);

  if (Array.isArray(userIds) && userIds.length > 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO packing_category_assignees (trip_id, category_name, user_id) VALUES (?, ?, ?)');
    for (const uid of userIds) insert.run(tripId, categoryName, uid);
  }

  const updated = db.prepare(`
    SELECT pca.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM packing_category_assignees pca
    JOIN users u ON pca.user_id = u.id
    WHERE pca.trip_id = ? AND pca.category_name = ?
  `).all(tripId, categoryName) as { user_id: number; username: string; avatar: string | null }[];
  return updated.map(m => ({ ...m, avatar: avatarUrl(m) }));
}

// ── Reorder ────────────────────────────────────────────────────────────────

export function reorderItems(tripId: string | number, orderedIds: number[]) {
  const update = db.prepare('UPDATE packing_items SET sort_order = ? WHERE id = ? AND trip_id = ?');
  const updateMany = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      update.run(index, id, tripId);
    });
  });
  updateMany(orderedIds);
}
