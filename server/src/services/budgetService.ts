import { db } from '../db/database';
import { BudgetItem, BudgetItemMember, BudgetItemPayer } from '../types';
import { avatarUrl } from './avatarUrl';
import { getRates } from './exchangeRateService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export { avatarUrl };
export { verifyTripAccess } from './tripAccess';

function loadItemMembers(itemId: number | string) {
  const rows = db.prepare(`
    SELECT bm.user_id, bm.paid, bm.amount, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM budget_item_members bm
    JOIN users u ON bm.user_id = u.id
    WHERE bm.budget_item_id = ?
  `).all(itemId) as BudgetItemMember[];
  return rows.map(m => ({ ...m, avatar_url: avatarUrl(m) }));
}

function loadItemPayers(itemId: number | string) {
  const rows = db.prepare(`
    SELECT bp.user_id, bp.amount, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM budget_item_payers bp
    JOIN users u ON bp.user_id = u.id
    WHERE bp.budget_item_id = ?
  `).all(itemId) as BudgetItemPayer[];
  return rows.map(p => ({ ...p, avatar_url: avatarUrl(p) }));
}

/** Replace the payer rows of an item and keep total_price = sum of payer amounts. */
function writeItemPayers(itemId: number | string, payers: { user_id: number; amount: number }[]) {
  db.prepare('DELETE FROM budget_item_payers WHERE budget_item_id = ?').run(itemId);
  const insert = db.prepare('INSERT OR IGNORE INTO budget_item_payers (budget_item_id, user_id, amount) VALUES (?, ?, ?)');
  let total = 0;
  for (const p of payers) {
    if (!(p.amount > 0)) continue;
    insert.run(itemId, p.user_id, p.amount);
    total += p.amount;
  }
  db.prepare('UPDATE budget_items SET total_price = ? WHERE id = ?').run(total, itemId);
  return total;
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
      SELECT bm.budget_item_id, bm.user_id, bm.paid, bm.amount, COALESCE(u.display_name, u.username) AS username, u.avatar
      FROM budget_item_members bm
      JOIN users u ON bm.user_id = u.id
      WHERE bm.budget_item_id IN (${itemIds.map(() => '?').join(',')})
    `).all(...itemIds) as (BudgetItemMember & { budget_item_id: number })[];

    for (const m of allMembers) {
      if (!membersByItem[m.budget_item_id]) membersByItem[m.budget_item_id] = [];
      membersByItem[m.budget_item_id].push({
        user_id: m.user_id, paid: m.paid, username: m.username, avatar_url: avatarUrl(m), amount: m.amount,
      });
    }
  }

  const payersByItem: Record<number, (BudgetItemPayer & { avatar_url: string | null })[]> = {};
  if (itemIds.length > 0) {
    const allPayers = db.prepare(`
      SELECT bp.budget_item_id, bp.user_id, bp.amount, COALESCE(u.display_name, u.username) AS username, u.avatar
      FROM budget_item_payers bp
      JOIN users u ON bp.user_id = u.id
      WHERE bp.budget_item_id IN (${itemIds.map(() => '?').join(',')})
    `).all(...itemIds) as (BudgetItemPayer & { budget_item_id: number })[];

    for (const p of allPayers) {
      if (!payersByItem[p.budget_item_id]) payersByItem[p.budget_item_id] = [];
      payersByItem[p.budget_item_id].push({
        user_id: p.user_id, amount: p.amount, username: p.username, avatar_url: avatarUrl(p),
      });
    }
  }

  items.forEach(item => {
    item.members = membersByItem[item.id] || [];
    item.payers = payersByItem[item.id] || [];
  });
  return items;
}

/**
 * Freeze the live FX rate at entry time into `exchange_rate` so a settled position
 * isn't re-opened when live rates drift later (#1335 / #1445). The stored rate is
 * "units of the item/display currency per 1 trip currency" — the settlement
 * converts with it via `amount / rate`.
 *
 * Only freezes for a foreign currency with no explicit rate; degrades to live
 * rates if the fetch fails. On update it (re)freezes only when the currency
 * changes (checked against `budget_items`), so an unrelated edit never moves
 * money. Callers must invoke this *before* the (synchronous) DB write — the raw
 * create/update stay sync because better-sqlite3 transactions can't await.
 */
export async function freezeForeignRate(
  tripId: string | number,
  data: { currency?: string | null; exchange_rate?: number },
  existingItemId?: string | number,
  existingCurrency?: string | null,
): Promise<void> {
  if (data.exchange_rate != null) return; // an explicit rate from the caller wins
  const cur = (data.currency || '').toUpperCase();
  if (!cur) return; // currency not being set in this request
  // Skip the re-freeze when the currency isn't actually changing, so an unrelated
  // edit never moves money. Items resolve the prior currency from budget_items; a
  // settlement lives in a different table, so its caller passes it in directly.
  let prior: string | undefined;
  if (existingCurrency !== undefined) {
    prior = (existingCurrency || '').toUpperCase();
  } else if (existingItemId != null) {
    const existing = db.prepare('SELECT currency FROM budget_items WHERE id = ?')
      .get(existingItemId) as { currency?: string } | undefined;
    if (existing) prior = (existing.currency || '').toUpperCase();
  }
  if (prior !== undefined && prior === cur) return; // currency unchanged
  const trip = db.prepare('SELECT currency FROM trips WHERE id = ?')
    .get(tripId) as { currency?: string } | undefined;
  const tripCur = (trip?.currency || 'EUR').toUpperCase();
  if (cur === tripCur) return; // same as the trip currency → no conversion to freeze
  const rates = await getRates(tripCur);
  const r = rates?.[cur];
  if (r && r > 0) data.exchange_rate = r;
}

export function createBudgetItem(
  tripId: string | number,
  data: {
    category?: string; name: string; total_price?: number;
    currency?: string | null; exchange_rate?: number;
    payers?: { user_id: number; amount: number }[]; member_ids?: number[];
    members?: { user_id: number; amount?: number | null }[];
    persons?: number | null; days?: number | null; note?: string | null; expense_date?: string | null;
    reservation_id?: number | null;
  },
) {
  const maxOrder = db.prepare(
    'SELECT MAX(sort_order) as max FROM budget_items WHERE trip_id = ?'
  ).get(tripId) as { max: number | null };
  const sortOrder = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

  const cat = data.category || 'other';

  // Ensure category has a sort_order entry
  const catExists = db.prepare('SELECT 1 FROM budget_category_order WHERE trip_id = ? AND category = ?').get(tripId, cat);
  if (!catExists) {
    const maxCatOrder = db.prepare('SELECT MAX(sort_order) as max FROM budget_category_order WHERE trip_id = ?').get(tripId) as { max: number | null };
    const catOrder = (maxCatOrder?.max !== null && maxCatOrder?.max !== undefined ? maxCatOrder.max : -1) + 1;
    db.prepare('INSERT OR IGNORE INTO budget_category_order (trip_id, category, sort_order) VALUES (?, ?, ?)').run(tripId, cat, catOrder);
  }

  // total_price is derived from explicit payers when given; otherwise the caller
  // value (planning entries, or a bill no one has paid yet).
  const payerTotal = (data.payers || []).reduce((a, p) => a + (p.amount > 0 ? p.amount : 0), 0);
  const total = data.payers && data.payers.length > 0 ? payerTotal : (data.total_price || 0);

  const result = db.prepare(
    'INSERT INTO budget_items (trip_id, category, name, total_price, currency, exchange_rate, persons, days, note, sort_order, expense_date, reservation_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    tripId,
    cat,
    data.name,
    total,
    data.currency || null,
    data.exchange_rate != null ? data.exchange_rate : 1,
    data.member_ids ? data.member_ids.length : (data.persons != null ? data.persons : null),
    data.days !== undefined && data.days !== null ? data.days : null,
    data.note || null,
    sortOrder,
    data.expense_date || null,
    data.reservation_id != null ? data.reservation_id : null,
  );

  const itemId = result.lastInsertRowid as number;
  if (data.payers && data.payers.length > 0) writeItemPayers(itemId, data.payers);
  if (data.members && data.members.length > 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, 0, ?)');
    for (const m of data.members) insert.run(itemId, m.user_id, m.amount !== undefined && m.amount !== null ? m.amount : null);
  } else if (data.member_ids && data.member_ids.length > 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, 0, NULL)');
    for (const uid of data.member_ids) insert.run(itemId, uid);
  }

  const item = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(itemId) as BudgetItem;
  item.members = loadItemMembers(itemId);
  item.payers = loadItemPayers(itemId);
  return item;
}

/** Fetch a single budget item hydrated with its members and payers, scoped to the trip. */
export function getBudgetItem(id: string | number, tripId: string | number): BudgetItem | null {
  const item = db.prepare('SELECT * FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId) as BudgetItem | undefined;
  if (!item) return null;
  item.members = loadItemMembers(id);
  item.payers = loadItemPayers(id);
  return item;
}

export function linkBudgetItemToReservation(
  tripId: string | number,
  reservationId: number,
  data: { name: string; category?: string; total_price: number },
) {
  const item = createBudgetItem(tripId, data) as BudgetItem & { reservation_id?: number | null };
  db.prepare('UPDATE budget_items SET reservation_id = ? WHERE id = ?').run(reservationId, item.id);
  item.reservation_id = reservationId;
  return item;
}

export function updateBudgetItem(
  id: string | number,
  tripId: string | number,
  data: {
    category?: string; name?: string; total_price?: number;
    currency?: string | null; exchange_rate?: number;
    payers?: { user_id: number; amount: number }[]; member_ids?: number[];
    members?: { user_id: number; amount?: number | null }[];
    persons?: number | null; days?: number | null; note?: string | null; sort_order?: number; expense_date?: string | null;
  },
) {
  const item = db.prepare('SELECT * FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return null;

  db.prepare(`
    UPDATE budget_items SET
      category = COALESCE(?, category),
      name = COALESCE(?, name),
      total_price = CASE WHEN ? IS NOT NULL THEN ? ELSE total_price END,
      currency = CASE WHEN ? THEN ? ELSE currency END,
      exchange_rate = CASE WHEN ? IS NOT NULL THEN ? ELSE exchange_rate END,
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
    data.currency !== undefined ? 1 : 0, data.currency !== undefined ? (data.currency || null) : null,
    data.exchange_rate !== undefined ? 1 : null, data.exchange_rate !== undefined ? data.exchange_rate : 1,
    data.persons !== undefined ? 1 : null, data.persons !== undefined ? data.persons : null,
    data.days !== undefined ? 1 : 0, data.days !== undefined ? data.days : null,
    data.note !== undefined ? 1 : 0, data.note !== undefined ? data.note : null,
    data.sort_order !== undefined ? 1 : null, data.sort_order !== undefined ? data.sort_order : 0,
    data.expense_date !== undefined ? 1 : 0, data.expense_date !== undefined ? (data.expense_date || null) : null,
    id,
  );

  // Optional inline payer/member replacement (the edit modal saves all at once).
  if (data.payers !== undefined) {
    writeItemPayers(id, data.payers);
    // writeItemPayers derives total_price from the payer sum (0 for no payers).
    // A "recorded total, nobody assigned" expense clears payers but still carries
    // an explicit total_price — re-apply it so it isn't clobbered to 0.
    if (data.payers.length === 0 && data.total_price !== undefined) {
      db.prepare('UPDATE budget_items SET total_price = ? WHERE id = ?').run(data.total_price, id);
    }
  }
  if (data.members !== undefined) {
    db.prepare('DELETE FROM budget_item_members WHERE budget_item_id = ?').run(id);
    const insert = db.prepare('INSERT OR IGNORE INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, 0, ?)');
    for (const m of data.members) insert.run(id, m.user_id, m.amount !== undefined && m.amount !== null ? m.amount : null);
    db.prepare('UPDATE budget_items SET persons = ? WHERE id = ?').run(data.members.length || null, id);
  } else if (data.member_ids !== undefined) {
    db.prepare('DELETE FROM budget_item_members WHERE budget_item_id = ?').run(id);
    const insert = db.prepare('INSERT OR IGNORE INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, 0, NULL)');
    for (const uid of data.member_ids) insert.run(id, uid);
    db.prepare('UPDATE budget_items SET persons = ? WHERE id = ?').run(data.member_ids.length || null, id);
  }

  // If category changed, update category order table
  if (data.category) {
    const catExists = db.prepare('SELECT 1 FROM budget_category_order WHERE trip_id = ? AND category = ?').get(tripId, data.category);
    if (!catExists) {
      const maxCatOrder = db.prepare('SELECT MAX(sort_order) as max FROM budget_category_order WHERE trip_id = ?').get(tripId) as { max: number | null };
      const catOrder = (maxCatOrder?.max !== null && maxCatOrder?.max !== undefined ? maxCatOrder.max : -1) + 1;
      db.prepare('INSERT OR IGNORE INTO budget_category_order (trip_id, category, sort_order) VALUES (?, ?, ?)').run(tripId, data.category, catOrder);
    }
  }

  const updated = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(id) as BudgetItem;
  updated.members = loadItemMembers(id);
  updated.payers = loadItemPayers(id);
  return updated;
}

// ---------------------------------------------------------------------------
// Payers
// ---------------------------------------------------------------------------

export function setItemPayers(id: string | number, tripId: string | number, payers: { user_id: number; amount: number }[]) {
  const item = db.prepare('SELECT id FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return null;
  writeItemPayers(id, payers);
  const updated = db.prepare('SELECT * FROM budget_items WHERE id = ?').get(id) as BudgetItem;
  updated.members = loadItemMembers(id);
  updated.payers = loadItemPayers(id);
  return updated;
}

export function deleteBudgetItem(id: string | number, tripId: string | number): boolean {
  const item = db.prepare('SELECT id FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return false;
  db.prepare('DELETE FROM budget_items WHERE id = ?').run(id);
  return true;
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

export function toggleMemberPaid(id: string | number, tripId: string | number, userId: string | number, paid: boolean) {
  // Resolve the item within the caller's trip before updating.
  const item = db.prepare('SELECT id FROM budget_items WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!item) return null;

  db.prepare('UPDATE budget_item_members SET paid = ? WHERE budget_item_id = ? AND user_id = ?')
    .run(paid ? 1 : 0, id, userId);

  const member = db.prepare(`
    SELECT bm.user_id, bm.paid, COALESCE(u.display_name, u.username) AS username, u.avatar
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
    SELECT bm.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar,
      SUM(COALESCE(bm.amount, bi.total_price * 1.0 / (SELECT COUNT(*) FROM budget_item_members WHERE budget_item_id = bi.id))) as total_assigned,
      SUM(CASE WHEN bm.paid = 1 THEN COALESCE(bm.amount, bi.total_price * 1.0 / (SELECT COUNT(*) FROM budget_item_members WHERE budget_item_id = bi.id)) ELSE 0 END) as total_paid,
      COUNT(bi.id) as items_count
    FROM budget_item_members bm
    JOIN budget_items bi ON bm.budget_item_id = bi.id
    JOIN users u ON bm.user_id = u.id
    WHERE bi.trip_id = ?
    GROUP BY bm.user_id
  `).all(tripId) as { user_id: number; username: string; avatar: string | null; total_assigned: number; total_paid: number; items_count: number }[];

  return summary.map(s => ({ ...s, avatar_url: avatarUrl(s) }));
}

export function splitEqualShares(total: number, members: { user_id: number }[], itemId: number): Record<number, number> {
  const n = members.length;
  if (n === 0) return {};

  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / n);
  const remainder = totalCents % n;

  const shares: Record<number, number> = {};
  const sortedMembers = [...members].sort((a, b) => a.user_id - b.user_id);
  const startIndex = itemId % n;

  for (let i = 0; i < n; i++) {
    const member = sortedMembers[i];
    const hasExtraCent = ((i - startIndex + n) % n) < remainder;
    shares[member.user_id] = (baseCents + (hasExtraCent ? 1 : 0)) / 100;
  }

  return shares;
}

export function calculateSettlement(
  tripId: string | number,
  opts: { base?: string; rates?: Record<string, number> | null; tripCurrency?: string } = {},
) {
  const base = (opts.base || opts.tripCurrency || 'EUR').toUpperCase();
  const tripCurrency = (opts.tripCurrency || base).toUpperCase();
  const rates = opts.rates ?? null;
  // Net the whole settlement in the trip's canonical currency and convert the final
  // totals to the display currency once, instead of netting in the (moving) display
  // currency. Otherwise per-expense rounding shifts as live FX drifts and the greedy
  // debt-simplifier reshuffles it into phantom third-party micro-flows (#1382). When
  // the display currency IS the trip currency (the common case) every conversion below
  // is the identity, so behaviour is unchanged.
  // rates[X] = units of X per 1 base; the frozen exchange_rate is units of item-currency
  // per 1 trip-currency. Pre-rework rows store currency = NULL = "the trip's own currency".
  const toTrip = (amount: number, itemCurrency: string | null | undefined, itemRate?: number | null): number => {
    const cur = (itemCurrency || tripCurrency).toUpperCase();
    if (cur === tripCurrency) return amount;
    // Prefer the FX rate frozen at entry time (#1335): a settled expense keeps the rate
    // it was booked at, so a later live-rate drift doesn't re-open it with a residual.
    if (itemRate != null && itemRate > 0 && itemRate !== 1) return amount / itemRate;
    // Legacy rows without a frozen rate: convert via base with live rates.
    if (!rates) return amount;
    const rCur = rates[cur];
    const rTrip = rates[tripCurrency];
    if (rCur && rCur > 0 && rTrip && rTrip > 0) return (amount / rCur) * rTrip;
    return amount;
  };
  // trip-currency → display currency, applied once to the final netted totals.
  const toDisplay = (v: number): number =>
    base === tripCurrency ? v : (rates && rates[tripCurrency] > 0 ? v / rates[tripCurrency] : v);
  // A recorded settle-up amount is entered in whatever display currency the payer
  // was viewing. New rows capture that currency and the rate frozen at settle time
  // (#1445), so a settled position stays balanced when live rates drift — mirroring
  // toTrip for expenses. Legacy rows (currency = NULL) have no frozen rate, so fall
  // back to the old behaviour: assume they were entered in the current display base
  // and convert with live rates.
  const settleToTrip = (amount: number, sCurrency?: string | null, sRate?: number | null): number => {
    if (sCurrency) {
      const cur = sCurrency.toUpperCase();
      if (cur === tripCurrency) return amount;
      if (sRate != null && sRate > 0 && sRate !== 1) return amount / sRate;
      // Frozen currency but no usable rate (fetch failed at settle time): live fallback.
      if (rates) {
        const rCur = rates[cur];
        const rTrip = rates[tripCurrency];
        if (rCur && rCur > 0 && rTrip && rTrip > 0) return (amount / rCur) * rTrip;
      }
      return amount;
    }
    return base === tripCurrency ? amount : (rates && rates[tripCurrency] > 0 ? amount * rates[tripCurrency] : amount);
  };

  const items = db.prepare('SELECT * FROM budget_items WHERE trip_id = ?').all(tripId) as BudgetItem[];
  const allMembers = db.prepare(`
    SELECT bm.budget_item_id, bm.user_id, bm.amount, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM budget_item_members bm
    JOIN users u ON bm.user_id = u.id
    WHERE bm.budget_item_id IN (SELECT id FROM budget_items WHERE trip_id = ?)
  `).all(tripId) as (BudgetItemMember & { budget_item_id: number })[];
  const allPayers = db.prepare(`
    SELECT bp.budget_item_id, bp.user_id, bp.amount, COALESCE(u.display_name, u.username) AS username, u.avatar
    FROM budget_item_payers bp
    JOIN users u ON bp.user_id = u.id
    WHERE bp.budget_item_id IN (SELECT id FROM budget_items WHERE trip_id = ?)
  `).all(tripId) as (BudgetItemPayer & { budget_item_id: number })[];

  // Net balance per user, in the requested base currency: positive = is owed
  // money, negative = owes money. Each expense's amounts are converted from their
  // own currency to the base with live rates, so mixed-currency trips net correctly.
  const balances: Record<number, { user_id: number; username: string; avatar_url: string | null; balance: number }> = {};
  const ensure = (id: number, src: { username?: string; avatar?: string | null }) => {
    if (!balances[id]) balances[id] = { user_id: id, username: src.username || '', avatar_url: avatarUrl(src), balance: 0 };
    return balances[id];
  };

  for (const item of items) {
    const members = allMembers.filter(m => m.budget_item_id === item.id);
    const payers = allPayers.filter(p => p.budget_item_id === item.id);
    if (members.length === 0) continue; // planning-only entry → doesn't affect balances

    // Payers are credited what they actually paid (converted to trip currency with
    // the item's stored exchange rate)…
    for (const p of payers) ensure(p.user_id, p).balance += toTrip(p.amount > 0 ? p.amount : 0, item.currency, item.exchange_rate);
    // …and each split participant owes their share — a custom per-member amount
    // when one is set, otherwise an equal share of the expense total.
    const hasCustomSplit = members.some(m => m.amount !== null && m.amount !== undefined);
    const equalShares = !hasCustomSplit ? splitEqualShares(item.total_price, members, item.id) : {};
    for (const m of members) {
      const memberShare = hasCustomSplit && m.amount !== null && m.amount !== undefined
        ? toTrip(m.amount, item.currency, item.exchange_rate)
        : toTrip(equalShares[m.user_id] || 0, item.currency, item.exchange_rate);
      ensure(m.user_id, m).balance -= memberShare;
    }
  }

  // Persisted settle-up transfers already moved money: the payer's debt shrinks,
  // the receiver's credit shrinks, so the corresponding flow disappears. A transfer
  // counts even when neither user has an expense-derived balance yet — a manual
  // payment, or one left behind after its expense was deleted, then correctly
  // surfaces as an amount still to square up instead of silently vanishing.
  const settlements = listSettlements(tripId);
  const ensureSettled = (id: number, username: string | undefined, avatar_url: string | null | undefined) => {
    if (!balances[id]) balances[id] = { user_id: id, username: username || '', avatar_url: avatar_url ?? null, balance: 0 };
    return balances[id];
  };
  for (const s of settlements) {
    const inTrip = settleToTrip(s.amount, s.currency, s.exchange_rate);
    ensureSettled(s.from_user_id, s.from_username, s.from_avatar_url).balance += inTrip;
    ensureSettled(s.to_user_id, s.to_username, s.to_avatar_url).balance -= inTrip;
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
        amount: Math.round(toDisplay(transfer) * 100) / 100,
      });
    }
    debtors[di].amount -= transfer;
    creditors[ci].amount -= transfer;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  return {
    balances: Object.values(balances).map(b => ({ ...b, balance: Math.round(toDisplay(b.balance) * 100) / 100 })),
    flows,
    settlements,
  };
}

// ---------------------------------------------------------------------------
// Settlements (persisted settle-up transfers — history + undo)
// ---------------------------------------------------------------------------

export function listSettlements(tripId: string | number) {
  const rows = db.prepare(`
    SELECT s.id, s.trip_id, s.from_user_id, s.to_user_id, s.amount, s.currency, s.exchange_rate, s.created_at, s.created_by_user_id,
           fu.username AS from_username, fu.avatar AS from_avatar,
           tu.username AS to_username,   tu.avatar AS to_avatar
    FROM budget_settlements s
    JOIN users fu ON s.from_user_id = fu.id
    JOIN users tu ON s.to_user_id = tu.id
    WHERE s.trip_id = ?
    ORDER BY s.created_at DESC, s.id DESC
  `).all(tripId) as any[];
  return rows.map(r => ({
    id: r.id, trip_id: r.trip_id,
    from_user_id: r.from_user_id, to_user_id: r.to_user_id,
    amount: r.amount, currency: r.currency ?? null, exchange_rate: r.exchange_rate ?? 1,
    created_at: r.created_at, created_by_user_id: r.created_by_user_id,
    from_username: r.from_username, from_avatar_url: avatarUrl({ avatar: r.from_avatar }),
    to_username: r.to_username, to_avatar_url: avatarUrl({ avatar: r.to_avatar }),
  }));
}

export function createSettlement(
  tripId: string | number,
  data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null; exchange_rate?: number },
  createdByUserId?: number,
) {
  const result = db.prepare(
    'INSERT INTO budget_settlements (trip_id, from_user_id, to_user_id, amount, currency, exchange_rate, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    tripId, data.from_user_id, data.to_user_id, Math.round(data.amount * 100) / 100,
    data.currency ? data.currency.toUpperCase() : null,
    data.exchange_rate != null ? data.exchange_rate : 1,
    createdByUserId ?? null,
  );
  return listSettlements(tripId).find(s => s.id === Number(result.lastInsertRowid)) || null;
}

export function updateSettlement(
  id: string | number,
  tripId: string | number,
  data: { from_user_id: number; to_user_id: number; amount: number; currency?: string | null; exchange_rate?: number },
) {
  const row = db.prepare('SELECT id FROM budget_settlements WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!row) return null;
  db.prepare(`
    UPDATE budget_settlements SET
      from_user_id = ?, to_user_id = ?, amount = ?,
      currency = CASE WHEN ? THEN ? ELSE currency END,
      exchange_rate = CASE WHEN ? IS NOT NULL THEN ? ELSE exchange_rate END
    WHERE id = ?
  `).run(
    data.from_user_id, data.to_user_id, Math.round(data.amount * 100) / 100,
    data.currency !== undefined ? 1 : 0, data.currency ? data.currency.toUpperCase() : null,
    data.exchange_rate !== undefined ? 1 : null, data.exchange_rate !== undefined ? data.exchange_rate : 1,
    id,
  );
  return listSettlements(tripId).find(s => s.id === Number(id)) || null;
}

export function deleteSettlement(id: string | number, tripId: string | number): boolean {
  const row = db.prepare('SELECT id FROM budget_settlements WHERE id = ? AND trip_id = ?').get(id, tripId);
  if (!row) return false;
  db.prepare('DELETE FROM budget_settlements WHERE id = ?').run(id);
  return true;
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
