import { db, canAccessTrip } from '../db/database';
import { BudgetItem, BudgetItemMember, BudgetTransfer } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function avatarUrl(user: { avatar?: string | null }): string | null {
  return user.avatar ? `/uploads/avatars/${user.avatar}` : null;
}

export function verifyTripAccess(tripId: string | number, userId: number) {
  return canAccessTrip(tripId, userId);
}

function loadItemMembers(itemId: number | string) {
  const rows = db.prepare(`
    SELECT bm.user_id, bm.paid, u.username, u.avatar
    FROM budget_item_members bm
    JOIN users u ON bm.user_id = u.id
    WHERE bm.budget_item_id = ?
  `).all(itemId) as BudgetItemMember[];
  return rows.map(m => ({ ...m, avatar_url: avatarUrl(m) }));
}

type ServiceResult<T> = T | { error: string; status: number };

type Participant = { user_id: number; username: string; avatar: string | null };

function isErrorResult<T>(result: ServiceResult<T>): result is { error: string; status: number } {
  return typeof result === 'object' && result !== null && 'error' in result;
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeNote(note: unknown): string | null {
  if (note === undefined || note === null) return null;
  const value = String(note).trim();
  return value ? value : null;
}

export function normalizeTransferAmount(value: unknown): number | { error: string; status: number } {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return { error: 'Amount is required', status: 400 };
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return { error: 'Amount must be a finite number', status: 400 };
  }

  const raw = typeof value === 'number' ? String(value) : value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    return { error: 'Amount must be a non-negative decimal number', status: 400 };
  }

  const [wholeRaw, fracRaw = ''] = raw.split('.');
  const whole = BigInt(wholeRaw);
  const frac = (fracRaw + '000').slice(0, 3);
  const cents = whole * 100n + BigInt(frac.slice(0, 2)) + (Number(frac[2]) >= 5 ? 1n : 0n);

  if (cents <= 0n) {
    return { error: 'Amount must round to at least 0.01', status: 400 };
  }

  return Number(cents) / 100;
}

function validateTransferDate(value: unknown, required: boolean): string | { error: string; status: number } {
  if ((value === undefined || value === null || value === '') && !required) return todayDateOnly();
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: 'transfer_date must be YYYY-MM-DD', status: 400 };
  }
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return { error: 'transfer_date must be a valid date', status: 400 };
  }
  return value;
}

function listTripParticipants(tripId: string | number): Participant[] {
  return db.prepare(`
    SELECT u.id as user_id, u.username, u.avatar
    FROM users u
    JOIN trips t ON t.user_id = u.id
    WHERE t.id = ?
    UNION
    SELECT u.id as user_id, u.username, u.avatar
    FROM trip_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.trip_id = ?
  `).all(tripId, tripId) as Participant[];
}

function participantMap(tripId: string | number): Map<number, Participant> {
  return new Map(listTripParticipants(tripId).map(p => [p.user_id, p]));
}

function getTransferRow(id: number | bigint | string): BudgetTransfer | null {
  const row = db.prepare(`
    SELECT bt.*, fu.username as from_username, fu.avatar as from_avatar, tu.username as to_username, tu.avatar as to_avatar
    FROM budget_transfers bt
    JOIN users fu ON fu.id = bt.from_user_id
    JOIN users tu ON tu.id = bt.to_user_id
    WHERE bt.id = ?
  `).get(id) as (BudgetTransfer & { from_avatar?: string | null; to_avatar?: string | null }) | undefined;
  if (!row) return null;
  const { from_avatar, to_avatar, ...transfer } = row;
  return {
    ...transfer,
    from_avatar_url: avatarUrl({ avatar: from_avatar }),
    to_avatar_url: avatarUrl({ avatar: to_avatar }),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function listBudgetItems(tripId: string | number) {
  const items = db.prepare(`
    SELECT bi.* FROM budget_items bi
    LEFT JOIN budget_category_order bco ON bco.trip_id = bi.trip_id AND bco.category = bi.category
    WHERE bi.trip_id = ?
    ORDER BY COALESCE(bco.sort_order, 999999) ASC, bi.sort_order ASC
  `).all(tripId) as BudgetItem[];

  const itemIds = items.map(i => i.id);
  const membersByItem: Record<number, (BudgetItemMember & { avatar_url: string | null })[]> = {};

  if (itemIds.length > 0) {
    const allMembers = db.prepare(`
      SELECT bm.budget_item_id, bm.user_id, bm.paid, u.username, u.avatar
      FROM budget_item_members bm
      JOIN users u ON bm.user_id = u.id
      WHERE bm.budget_item_id IN (${itemIds.map(() => '?').join(',')})
    `).all(...itemIds) as (BudgetItemMember & { budget_item_id: number })[];

    for (const m of allMembers) {
      if (!membersByItem[m.budget_item_id]) membersByItem[m.budget_item_id] = [];
      membersByItem[m.budget_item_id].push({
        user_id: m.user_id, paid: m.paid, username: m.username, avatar_url: avatarUrl(m),
      });
    }
  }

  items.forEach(item => { item.members = membersByItem[item.id] || []; });
  return items;
}

export function createBudgetItem(
  tripId: string | number,
  data: { category?: string; name: string; total_price?: number; persons?: number | null; days?: number | null; note?: string | null; expense_date?: string | null },
) {
  const maxOrder = db.prepare(
    'SELECT MAX(sort_order) as max FROM budget_items WHERE trip_id = ?'
  ).get(tripId) as { max: number | null };
  const sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

  const cat = data.category || 'Other';

  // Ensure category has a sort_order entry
  const catExists = db.prepare('SELECT 1 FROM budget_category_order WHERE trip_id = ? AND category = ?').get(tripId, cat);
  if (!catExists) {
    const maxCatOrder = db.prepare('SELECT MAX(sort_order) as max FROM budget_category_order WHERE trip_id = ?').get(tripId) as { max: number | null };
    const catOrder = (maxCatOrder?.max !== null && maxCatOrder?.max !== undefined ? maxCatOrder.max : -1) + 1;
    db.prepare('INSERT OR IGNORE INTO budget_category_order (trip_id, category, sort_order) VALUES (?, ?, ?)').run(tripId, cat, catOrder);
  }

  const result = db.prepare(
    'INSERT INTO budget_items (trip_id, category, name, total_price, persons, days, note, sort_order, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    tripId,
    cat,
    data.name,
    data.total_price || 0,
    data.persons != null ? data.persons : null,
    data.days !== undefined && data.days !== null ? data.days : null,
    data.note || null,
    sortOrder,
    data.expense_date || null,
  );

  const item = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(result.lastInsertRowid) as BudgetItem & { members?: BudgetItemMember[] };
  item.members = [];
  return item;
}

export function updateBudgetItem(
  id: string | number,
  tripId: string | number,
  data: { category?: string; name?: string; total_price?: number; persons?: number | null; days?: number | null; note?: string | null; sort_order?: number; expense_date?: string | null },
) {
  const item = db.prepare('SELECT * FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return null;

  db.prepare(`
    UPDATE budget_items SET
      category = COALESCE(?, category),
      name = COALESCE(?, name),
      total_price = CASE WHEN ? IS NOT NULL THEN ? ELSE total_price END,
      persons = CASE WHEN ? IS NOT NULL THEN ? ELSE persons END,
      days = CASE WHEN ? THEN ? ELSE days END,
      note = CASE WHEN ? THEN ? ELSE note END,
      sort_order = CASE WHEN ? IS NOT NULL THEN ? ELSE sort_order END,
      expense_date = CASE WHEN ? THEN ? ELSE expense_date END
    WHERE id = ?
  `).run(
    data.category || null,
    data.name || null,
    data.total_price !== undefined ? 1 : null, data.total_price !== undefined ? data.total_price : 0,
    data.persons !== undefined ? 1 : null, data.persons !== undefined ? data.persons : null,
    data.days !== undefined ? 1 : 0, data.days !== undefined ? data.days : null,
    data.note !== undefined ? 1 : 0, data.note !== undefined ? data.note : null,
    data.sort_order !== undefined ? 1 : null, data.sort_order !== undefined ? data.sort_order : 0,
    data.expense_date !== undefined ? 1 : 0, data.expense_date !== undefined ? (data.expense_date || null) : null,
    id,
  );

  // If category changed, update category order table
  if (data.category) {
    const catExists = db.prepare('SELECT 1 FROM budget_category_order WHERE trip_id = ? AND category = ?').get(tripId, data.category);
    if (!catExists) {
      const maxCatOrder = db.prepare('SELECT MAX(sort_order) as max FROM budget_category_order WHERE trip_id = ?').get(tripId) as { max: number | null };
      const catOrder = (maxCatOrder?.max !== null && maxCatOrder?.max !== undefined ? maxCatOrder.max : -1) + 1;
      db.prepare('INSERT OR IGNORE INTO budget_category_order (trip_id, category, sort_order) VALUES (?, ?, ?)').run(tripId, data.category, catOrder);
    }
  }

  const updated = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(id) as BudgetItem & { members?: BudgetItemMember[] };
  updated.members = loadItemMembers(id);
  return updated;
}

export function deleteBudgetItem(id: string | number, tripId: string | number): boolean {
  const item = db.prepare('SELECT id FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return false;
  db.prepare('DELETE FROM budget_items WHERE id = ?').run(id);
  return true;
}

// ---------------------------------------------------------------------------
// Settlement transfers
// ---------------------------------------------------------------------------

export function listBudgetTransfers(tripId: string | number): BudgetTransfer[] {
  const rows = db.prepare(`
    SELECT bt.*, fu.username as from_username, fu.avatar as from_avatar, tu.username as to_username, tu.avatar as to_avatar
    FROM budget_transfers bt
    JOIN users fu ON fu.id = bt.from_user_id
    JOIN users tu ON tu.id = bt.to_user_id
    WHERE bt.trip_id = ?
    ORDER BY bt.transfer_date DESC, bt.created_at DESC, bt.id DESC
  `).all(tripId) as (BudgetTransfer & { from_avatar?: string | null; to_avatar?: string | null })[];

  return rows.map(({ from_avatar, to_avatar, ...transfer }) => ({
    ...transfer,
    from_avatar_url: avatarUrl({ avatar: from_avatar }),
    to_avatar_url: avatarUrl({ avatar: to_avatar }),
  }));
}

function validateTransferPayload(
  tripId: string | number,
  data: { from_user_id?: unknown; to_user_id?: unknown; amount?: unknown; transfer_date?: unknown; note?: unknown },
  options: { dateRequired: boolean },
): ServiceResult<{ from_user_id: number; to_user_id: number; amount: number; transfer_date: string; note: string | null }> {
  const fromUserId = Number(data.from_user_id);
  const toUserId = Number(data.to_user_id);
  if (!Number.isInteger(fromUserId) || fromUserId <= 0) return { error: 'from_user_id is required', status: 400 };
  if (!Number.isInteger(toUserId) || toUserId <= 0) return { error: 'to_user_id is required', status: 400 };
  if (fromUserId === toUserId) return { error: 'Payer and recipient must be different users', status: 400 };

  const amount = normalizeTransferAmount(data.amount);
  if (isErrorResult(amount)) return amount;

  const transferDate = validateTransferDate(data.transfer_date, options.dateRequired);
  if (isErrorResult(transferDate)) return transferDate;

  const participants = participantMap(tripId);
  if (!participants.has(fromUserId)) return { error: 'Payer must be a current trip participant', status: 400 };
  if (!participants.has(toUserId)) return { error: 'Recipient must be a current trip participant', status: 400 };

  return {
    from_user_id: fromUserId,
    to_user_id: toUserId,
    amount,
    transfer_date: transferDate,
    note: normalizeNote(data.note),
  };
}

export function createBudgetTransfer(
  tripId: string | number,
  data: { from_user_id?: unknown; to_user_id?: unknown; amount?: unknown; transfer_date?: unknown; note?: unknown },
): ServiceResult<{ transfer: BudgetTransfer }> {
  const validated = validateTransferPayload(tripId, data, { dateRequired: false });
  if (isErrorResult(validated)) return validated;

  const result = db.prepare(`
    INSERT INTO budget_transfers (trip_id, from_user_id, to_user_id, amount, transfer_date, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(tripId, validated.from_user_id, validated.to_user_id, validated.amount, validated.transfer_date, validated.note);

  return { transfer: getTransferRow(result.lastInsertRowid)! };
}

export function updateBudgetTransfer(
  transferId: string | number,
  tripId: string | number,
  data: { from_user_id?: unknown; to_user_id?: unknown; amount?: unknown; transfer_date?: unknown; note?: unknown },
): ServiceResult<{ transfer: BudgetTransfer }> {
  const existing = db.prepare('SELECT id FROM budget_transfers WHERE id = ? AND trip_id = ?').get(transferId, tripId);
  if (!existing) return { error: 'Budget transfer not found', status: 404 };

  const validated = validateTransferPayload(tripId, data, { dateRequired: true });
  if (isErrorResult(validated)) return validated;

  db.prepare(`
    UPDATE budget_transfers
    SET from_user_id = ?, to_user_id = ?, amount = ?, transfer_date = ?, note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND trip_id = ?
  `).run(validated.from_user_id, validated.to_user_id, validated.amount, validated.transfer_date, validated.note, transferId, tripId);

  return { transfer: getTransferRow(transferId)! };
}

export function deleteBudgetTransfer(transferId: string | number, tripId: string | number): ServiceResult<{ success: true }> {
  const result = db.prepare('DELETE FROM budget_transfers WHERE id = ? AND trip_id = ?').run(transferId, tripId);
  if (result.changes === 0) return { error: 'Budget transfer not found', status: 404 };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export function updateMembers(id: string | number, tripId: string | number, userIds: number[]) {
  const item = db.prepare('SELECT * FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return null;

  const existingPaid: Record<number, number> = {};
  const existing = db.prepare('SELECT user_id, paid FROM budget_item_members WHERE budget_item_id = ?').all(id) as { user_id: number; paid: number }[];
  for (const e of existing) existingPaid[e.user_id] = e.paid;

  db.prepare('DELETE FROM budget_item_members WHERE budget_item_id = ?').run(id);

  if (userIds.length > 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO budget_item_members (budget_item_id, user_id, paid) VALUES (?, ?, ?)');
    for (const userId of userIds) insert.run(id, userId, existingPaid[userId] || 0);
    db.prepare('UPDATE budget_items SET persons = ? WHERE id = ?').run(userIds.length, id);
  } else {
    db.prepare('UPDATE budget_items SET persons = NULL WHERE id = ?').run(id);
  }

  const members = loadItemMembers(id).map(m => ({ ...m, avatar_url: avatarUrl(m) }));
  const updated = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(id) as BudgetItem;
  return { members, item: updated };
}

export function toggleMemberPaid(id: string | number, userId: string | number, paid: boolean) {
  db.prepare('UPDATE budget_item_members SET paid = ? WHERE budget_item_id = ? AND user_id = ?')
    .run(paid ? 1 : 0, id, userId);

  const member = db.prepare(`
    SELECT bm.user_id, bm.paid, u.username, u.avatar
    FROM budget_item_members bm JOIN users u ON bm.user_id = u.id
    WHERE bm.budget_item_id = ? AND bm.user_id = ?
  `).get(id, userId) as BudgetItemMember | undefined;

  return member ? { ...member, avatar_url: avatarUrl(member) } : null;
}

// ---------------------------------------------------------------------------
// Per-person summary
// ---------------------------------------------------------------------------

export function getPerPersonSummary(tripId: string | number) {
  const summary = db.prepare(`
    SELECT bm.user_id, u.username, u.avatar,
      SUM(bi.total_price * 1.0 / (SELECT COUNT(*) FROM budget_item_members WHERE budget_item_id = bi.id)) as total_assigned,
      SUM(CASE WHEN bm.paid = 1 THEN bi.total_price * 1.0 / (SELECT COUNT(*) FROM budget_item_members WHERE budget_item_id = bi.id) ELSE 0 END) as total_paid,
      COUNT(bi.id) as items_count
    FROM budget_item_members bm
    JOIN budget_items bi ON bm.budget_item_id = bi.id
    JOIN users u ON bm.user_id = u.id
    WHERE bi.trip_id = ?
    GROUP BY bm.user_id
  `).all(tripId) as { user_id: number; username: string; avatar: string | null; total_assigned: number; total_paid: number; items_count: number }[];

  return summary.map(s => ({ ...s, avatar_url: avatarUrl(s) }));
}

// ---------------------------------------------------------------------------
// Settlement calculation (greedy debt matching)
// ---------------------------------------------------------------------------

export function calculateSettlement(tripId: string | number) {
  const items = db.prepare('SELECT * FROM budget_items WHERE trip_id = ?').all(tripId) as BudgetItem[];
  const allMembers = db.prepare(`
    SELECT bm.budget_item_id, bm.user_id, bm.paid, u.username, u.avatar
    FROM budget_item_members bm
    JOIN users u ON bm.user_id = u.id
    WHERE bm.budget_item_id IN (SELECT id FROM budget_items WHERE trip_id = ?)
  `).all(tripId) as (BudgetItemMember & { budget_item_id: number })[];

  // Calculate net balance per user: positive = is owed money, negative = owes money
  const balances: Record<number, { user_id: number; username: string; avatar_url: string | null; balance: number }> = {};

  for (const item of items) {
    const members = allMembers.filter(m => m.budget_item_id === item.id);
    if (members.length === 0) continue;

    const payers = members.filter(m => m.paid);
    if (payers.length === 0) continue; // no one marked as paid

    const sharePerMember = item.total_price / members.length;
    const paidPerPayer = item.total_price / payers.length;

    for (const m of members) {
      if (!balances[m.user_id]) {
        balances[m.user_id] = { user_id: m.user_id, username: m.username, avatar_url: avatarUrl(m), balance: 0 };
      }
      // Everyone owes their share
      balances[m.user_id].balance -= sharePerMember;
      // Payers get credited what they paid
      if (m.paid) balances[m.user_id].balance += paidPerPayer;
    }
  }

  const participants = participantMap(tripId);
  const transfers = db.prepare(`
    SELECT from_user_id, to_user_id, amount
    FROM budget_transfers
    WHERE trip_id = ?
  `).all(tripId) as { from_user_id: number; to_user_id: number; amount: number }[];

  const ensureBalance = (userId: number) => {
    if (balances[userId]) return balances[userId];
    const participant = participants.get(userId);
    if (!participant) return null;
    balances[userId] = {
      user_id: userId,
      username: participant.username,
      avatar_url: avatarUrl(participant),
      balance: 0,
    };
    return balances[userId];
  };

  for (const transfer of transfers) {
    if (!participants.has(transfer.from_user_id) || !participants.has(transfer.to_user_id)) continue;
    const from = ensureBalance(transfer.from_user_id);
    const to = ensureBalance(transfer.to_user_id);
    if (!from || !to) continue;
    from.balance += transfer.amount;
    to.balance -= transfer.amount;
  }

  // Calculate optimized payment flows (greedy algorithm)
  const people = Object.values(balances).filter(b => Math.abs(b.balance) > 0.01);
  const debtors = people.filter(p => p.balance < -0.01).map(p => ({ ...p, amount: -p.balance }));
  const creditors = people.filter(p => p.balance > 0.01).map(p => ({ ...p, amount: p.balance }));

  // Sort by amount descending for efficient matching
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const flows: { from: { user_id: number; username: string; avatar_url: string | null }; to: { user_id: number; username: string; avatar_url: string | null }; amount: number }[] = [];

  let di = 0, ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
    if (transfer > 0.01) {
      flows.push({
        from: { user_id: debtors[di].user_id, username: debtors[di].username, avatar_url: debtors[di].avatar_url },
        to: { user_id: creditors[ci].user_id, username: creditors[ci].username, avatar_url: creditors[ci].avatar_url },
        amount: Math.round(transfer * 100) / 100,
      });
    }
    debtors[di].amount -= transfer;
    creditors[ci].amount -= transfer;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  return {
    balances: Object.values(balances).map(b => ({ ...b, balance: Math.round(b.balance * 100) / 100 })),
    flows,
  };
}

// ---------------------------------------------------------------------------
// Reorder
// ---------------------------------------------------------------------------

export function reorderBudgetItems(tripId: string | number, orderedIds: number[]) {
  const update = db.prepare('UPDATE budget_items SET sort_order = ? WHERE id = ? AND trip_id = ?');
  db.transaction(() => {
    orderedIds.forEach((id, index) => update.run(index, id, tripId));
  })();
}

export function reorderBudgetCategories(tripId: string | number, orderedCategories: string[]) {
  const upsert = db.prepare(
    'INSERT INTO budget_category_order (trip_id, category, sort_order) VALUES (?, ?, ?) ON CONFLICT(trip_id, category) DO UPDATE SET sort_order = excluded.sort_order'
  );
  db.transaction(() => {
    orderedCategories.forEach((cat, index) => upsert.run(tripId, cat, index));
  })();
}
