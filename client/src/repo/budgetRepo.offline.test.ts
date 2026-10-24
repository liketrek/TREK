// FE-REPO-BUDGET-OFF-001 to FE-REPO-BUDGET-OFF-010
// Offline write paths (#2601) — budgetRepo.test.ts covers the online reads.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBudgetItem } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { mutationQueue } from '../sync/mutationQueue';
import { budgetRepo } from './budgetRepo';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

async function queue(): Promise<QueuedMutation[]> {
  return (await offlineDb.mutationQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt);
}

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setOnline(false);
  await offlineDb.tripMembers.bulkPut([
    { tripId: 4, id: 1, username: 'ana' },
    { tripId: 4, id: 2, username: 'ben' },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
  setOnline(true);
});

describe('budgetRepo expenses — offline', () => {
  it('FE-REPO-BUDGET-OFF-001: a new expense gets a temp row with the total, payers and split the server would derive', async () => {
    const { item } = await budgetRepo.create(4, {
      name: 'Dinner',
      category: 'food',
      currency: 'EUR',
      total_price: 30,
      payers: [
        { user_id: 1, amount: 20.1 },
        { user_id: 2, amount: 9.9 },
      ],
      members: [
        { user_id: 1, amount: null },
        { user_id: 2, amount: null },
      ],
      member_ids: [1, 2],
      receipt_file_ids: [],
      fallback_fx: { base: 'EUR', rates: { USD: 1.1 } },
    });
    expect(item.id).toBeLessThan(0);
    expect(item).toMatchObject({ trip_id: 4, name: 'Dinner', category: 'food', total_price: 30, persons: 2 });
    expect(item.payers?.map((p) => [p.user_id, p.amount, p.username])).toEqual([
      [1, 20.1, 'ana'],
      [2, 9.9, 'ben'],
    ]);
    expect(item.members?.map((m) => [m.user_id, m.paid, m.username])).toEqual([
      [1, 0, 'ana'],
      [2, 0, 'ben'],
    ]);
    // Request-only fields stay out of the row.
    expect(item).not.toHaveProperty('fallback_fx');
    expect(item).not.toHaveProperty('member_ids');

    expect(await offlineDb.budgetItems.get(item.id)).toMatchObject({ name: 'Dinner' });
    const [mutation] = await queue();
    expect(mutation).toMatchObject({
      method: 'POST',
      url: '/trips/4/budget',
      resource: 'budgetItems',
      tempId: item.id,
    });
    expect(mutation.body).toMatchObject({ name: 'Dinner', fallback_fx: { base: 'EUR' } });
  });

  it('FE-REPO-BUDGET-OFF-002: an edit and a delete of an unsynced expense wait for its id', async () => {
    const { item } = await budgetRepo.create(4, { name: 'Taxi', total_price: 12 });
    const { item: edited } = await budgetRepo.update(4, item.id, { name: 'Cab', total_price: 15 });
    expect(edited).toMatchObject({ id: item.id, name: 'Cab', total_price: 15 });
    await budgetRepo.delete(4, item.id);

    expect(await offlineDb.budgetItems.get(item.id)).toBeUndefined();
    const [, put, del] = await queue();
    expect(put).toMatchObject({ method: 'PUT', url: '/trips/4/budget/{id}', tempEntityId: item.id, entityId: item.id });
    expect(del).toMatchObject({ method: 'DELETE', url: '/trips/4/budget/{id}', tempEntityId: item.id });
  });

  it('FE-REPO-BUDGET-OFF-003: an edit keeps the paid ticks and drops the receipts taken off', async () => {
    await offlineDb.budgetItems.put(
      buildBudgetItem({
        id: 70,
        trip_id: 4,
        name: 'Hotel',
        total_price: 200,
        members: [
          { user_id: 1, paid: 1, username: 'ana' },
          { user_id: 2, paid: 0, username: 'ben' },
        ],
        receipts: [
          { id: 5, filename: 'a', original_name: 'a.pdf', url: '/a' },
          { id: 6, filename: 'b', original_name: 'b.pdf', url: '/b' },
        ],
      })
    );
    const { item } = await budgetRepo.update(4, 70, {
      members: [
        { user_id: 1, amount: 150 },
        { user_id: 2, amount: 50 },
      ],
      receipt_file_ids: [6],
    });
    expect(item.members?.map((m) => [m.user_id, m.paid, m.amount])).toEqual([
      [1, 1, 150],
      [2, 0, 50],
    ]);
    expect(item.receipts?.map((r) => r.id)).toEqual([6]);
    expect(item.total_price).toBe(200);
    const [mutation] = await queue();
    expect(mutation).toMatchObject({ method: 'PUT', url: '/trips/4/budget/70', entityId: 70 });
  });

  it('FE-REPO-BUDGET-OFF-004: the split and the paid tick are written here and queued', async () => {
    await offlineDb.budgetItems.put(
      buildBudgetItem({ id: 71, trip_id: 4, members: [{ user_id: 1, paid: 0, username: 'ana' }] })
    );
    const { members } = await budgetRepo.setMembers(4, 71, [1, 2]);
    expect(members.map((m) => m.user_id)).toEqual([1, 2]);
    await budgetRepo.togglePaid(4, 71, 2, true);

    const cached = await offlineDb.budgetItems.get(71);
    expect(cached?.members?.map((m) => [m.user_id, m.paid])).toEqual([
      [1, 0],
      [2, 1],
    ]);
    expect(cached?.persons).toBe(2);
    const [set, paid] = await queue();
    expect(set).toMatchObject({ url: '/trips/4/budget/71/members', body: { user_ids: [1, 2] }, entityId: 71 });
    expect(paid).toMatchObject({ url: '/trips/4/budget/71/members/2/paid', body: { paid: true }, entityId: 71 });
  });

  it('FE-REPO-BUDGET-OFF-005: a reorder is queued without the expenses that have no server id yet', async () => {
    await offlineDb.budgetItems.bulkPut([
      buildBudgetItem({ id: 72, trip_id: 4 }),
      buildBudgetItem({ id: 73, trip_id: 4 }),
    ]);
    await budgetRepo.reorderItems(4, [73, -5, 72]);
    expect((await offlineDb.budgetItems.get(73))?.sort_order).toBe(0);
    expect((await offlineDb.budgetItems.get(72))?.sort_order).toBe(2);
    await budgetRepo.reorderCategories(4, ['food', 'other']);
    const [items, categories] = await queue();
    expect(items).toMatchObject({ url: '/trips/4/budget/reorder/items', body: { orderedIds: [73, 72] } });
    expect(items.resource).toBeUndefined();
    expect(categories).toMatchObject({
      url: '/trips/4/budget/reorder/categories',
      body: { orderedCategories: ['food', 'other'] },
    });
  });

  it('FE-REPO-BUDGET-OFF-006: online, an edit of an expense with a queued write joins the queue behind it', async () => {
    await offlineDb.budgetItems.put(buildBudgetItem({ id: 74, trip_id: 4, name: 'Old' }));
    await budgetRepo.update(4, 74, { name: 'Offline' });
    setOnline(true);
    let sent = 0;
    server.use(
      http.put('/api/trips/4/budget/74', () => {
        sent += 1;
        return HttpResponse.error();
      })
    );
    const sendSoon = vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => {});

    await budgetRepo.update(4, 74, { name: 'Online' });

    expect(sent).toBe(0);
    expect(sendSoon).toHaveBeenCalled();
    expect((await queue()).map((m) => (m.body as { name: string }).name)).toEqual(['Offline', 'Online']);
  });
});

describe('budgetRepo settlements — offline', () => {
  it('FE-REPO-BUDGET-OFF-007: a payment is queued without a local row', async () => {
    const created = await budgetRepo.createSettlement(4, {
      from_user_id: 1,
      to_user_id: 2,
      amount: 10,
      currency: 'EUR',
    });
    const edited = await budgetRepo.updateSettlement(4, 30, { from_user_id: 1, to_user_id: 2, amount: 12 });
    const undone = await budgetRepo.deleteSettlement(4, 31);
    expect([created, edited, undone]).toEqual([{ queued: true }, { queued: true }, { queued: true }]);

    const [post, put, del] = await queue();
    expect(post).toMatchObject({ method: 'POST', url: '/trips/4/budget/settlements', resource: 'budgetSettlements' });
    expect(post.tempId).toBeUndefined();
    expect(put).toMatchObject({ method: 'PUT', url: '/trips/4/budget/settlements/30', entityId: 30 });
    expect(del).toMatchObject({ method: 'DELETE', url: '/trips/4/budget/settlements/31', entityId: 31 });
    expect(await budgetRepo.pendingWrites(4)).toBe(3);
    expect(await budgetRepo.pendingWrites(5)).toBe(0);
  });

  it('FE-REPO-BUDGET-OFF-008: online a payment goes straight out', async () => {
    setOnline(true);
    server.use(http.post('/api/trips/4/budget/settlements', () => HttpResponse.json({ settlement: { id: 40 } })));
    expect(await budgetRepo.createSettlement(4, { from_user_id: 1, to_user_id: 2, amount: 10 })).toEqual({
      queued: false,
    });
    expect(await queue()).toEqual([]);
  });

  it('FE-REPO-BUDGET-OFF-009: the settlement read online is what answers offline, for the same display currency', async () => {
    setOnline(true);
    const answer = {
      balances: [{ user_id: 1, username: 'ana', balance: 5 }],
      flows: [],
      settlements: [],
      finalBudgets: [],
    };
    server.use(http.get('/api/trips/4/budget/settlement', () => HttpResponse.json(answer)));
    expect(await budgetRepo.settlement(4, 'EUR')).toEqual(answer);

    setOnline(false);
    expect(await budgetRepo.settlement(4, 'EUR')).toEqual(answer);
    await expect(budgetRepo.settlement(4, 'USD')).rejects.toThrow();
    await expect(budgetRepo.settlement(5, 'EUR')).rejects.toThrow();
  });

  it('FE-REPO-BUDGET-OFF-010: a trip taken off the device takes its settlement with it', async () => {
    const { clearTripData } = await import('../db/offlineDb');
    await offlineDb.budgetSettlements.put({ tripId: 4, base: 'EUR', settlement: {} });
    await clearTripData(4);
    expect(await offlineDb.budgetSettlements.get(4)).toBeUndefined();
  });
});
