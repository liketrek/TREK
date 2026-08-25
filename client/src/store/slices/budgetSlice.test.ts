// FE-STORE-BUDGET-001 to FE-STORE-BUDGET-016
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildBudgetItem } from '../../../tests/helpers/factories';
import { useTripStore } from '../tripStore';

let addToast: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetAllStores();
  server.resetHandlers();
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
});

afterEach(() => {
  delete window.__addToast;
});

describe('budgetSlice', () => {
  it('FE-STORE-BUDGET-001: loadBudgetItems populates store', async () => {
    const item = buildBudgetItem({ trip_id: 1 });
    server.use(
      http.get('/api/trips/1/budget', () =>
        HttpResponse.json({ items: [item] })
      )
    );
    await useTripStore.getState().loadBudgetItems(1);
    expect(useTripStore.getState().budgetItems).toHaveLength(1);
    expect(useTripStore.getState().budgetItems[0].id).toBe(item.id);
  });

  it('FE-STORE-BUDGET-002: loadBudgetItems swallows errors silently', async () => {
    server.use(
      http.get('/api/trips/1/budget', () =>
        HttpResponse.json({ error: 'server error' }, { status: 500 })
      )
    );
    // Should NOT throw
    await expect(useTripStore.getState().loadBudgetItems(1)).resolves.toBeUndefined();
    expect(useTripStore.getState().budgetItems).toEqual([]);
  });

  it('FE-STORE-BUDGET-003: addBudgetItem appends to store and returns item', async () => {
    const newItem = buildBudgetItem({ name: 'Hotel', trip_id: 1 });
    server.use(
      http.post('/api/trips/1/budget', () =>
        HttpResponse.json({ item: newItem })
      )
    );
    const result = await useTripStore.getState().addBudgetItem(1, { name: 'Hotel' });
    expect(result.id).toBe(newItem.id);
    expect(useTripStore.getState().budgetItems).toContainEqual(newItem);
  });

  it('FE-STORE-BUDGET-004: addBudgetItem throws on API error', async () => {
    server.use(
      http.post('/api/trips/1/budget', () =>
        HttpResponse.json({ error: 'Validation failed' }, { status: 422 })
      )
    );
    await expect(useTripStore.getState().addBudgetItem(1, { name: 'x' })).rejects.toThrow();
  });

  it('FE-STORE-BUDGET-005: updateBudgetItem replaces item in store', async () => {
    const existing = buildBudgetItem({ id: 10, trip_id: 1, name: 'Old' });
    seedStore(useTripStore, { budgetItems: [existing] });

    const updated = { ...existing, name: 'New' };
    server.use(
      http.put('/api/trips/1/budget/10', () =>
        HttpResponse.json({ item: updated })
      )
    );
    await useTripStore.getState().updateBudgetItem(1, 10, { name: 'New' });
    const items = useTripStore.getState().budgetItems;
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('New');
  });

  it('FE-STORE-BUDGET-006: updateBudgetItem calls loadReservations when reservation_id + total_price provided', async () => {
    const existing = buildBudgetItem({ id: 20, trip_id: 1 });
    seedStore(useTripStore, { budgetItems: [existing] });

    const loadReservations = vi.fn().mockResolvedValue(undefined);
    seedStore(useTripStore, { loadReservations });

    const itemWithReservation = { ...existing, reservation_id: 99 };
    server.use(
      http.put('/api/trips/1/budget/20', () =>
        HttpResponse.json({ item: itemWithReservation })
      )
    );
    await useTripStore.getState().updateBudgetItem(1, 20, { total_price: 50 });
    expect(loadReservations).toHaveBeenCalledWith(1);
  });

  it('FE-STORE-BUDGET-007: deleteBudgetItem optimistically removes and rolls back on error', async () => {
    const item = buildBudgetItem({ id: 5, trip_id: 1 });
    seedStore(useTripStore, { budgetItems: [item] });

    server.use(
      http.delete('/api/trips/1/budget/5', () =>
        HttpResponse.json({ error: 'forbidden' }, { status: 403 })
      )
    );
    // The item is removed immediately (optimistic), then restored on error
    const deletePromise = useTripStore.getState().deleteBudgetItem(1, 5);
    await expect(deletePromise).rejects.toThrow();
    // After rollback, item is back
    expect(useTripStore.getState().budgetItems).toContainEqual(item);
  });

  it('FE-STORE-BUDGET-008: setBudgetItemMembers updates members on matching item', async () => {
    const item = buildBudgetItem({ id: 7, trip_id: 1, members: [] });
    seedStore(useTripStore, { budgetItems: [item] });

    const members = [{ user_id: 1, paid: false }, { user_id: 2, paid: false }];
    const updatedItem = { ...item, persons: 2, members };
    server.use(
      http.put('/api/trips/1/budget/7/members', () =>
        HttpResponse.json({ members, item: updatedItem })
      )
    );
    await useTripStore.getState().setBudgetItemMembers(1, 7, [1, 2]);
    const stored = useTripStore.getState().budgetItems.find(i => i.id === 7);
    expect(stored?.members).toHaveLength(2);
    expect(stored?.persons).toBe(2);
  });

  it('FE-STORE-BUDGET-009: toggleBudgetMemberPaid updates paid flag on matching member', async () => {
    const item = buildBudgetItem({
      id: 8,
      trip_id: 1,
      members: [{ user_id: 3, paid: 0, username: 'carol' }],
    });
    seedStore(useTripStore, { budgetItems: [item] });

    server.use(
      http.put('/api/trips/1/budget/8/members/3/paid', () =>
        HttpResponse.json({ success: true, paid: true })
      )
    );
    await useTripStore.getState().toggleBudgetMemberPaid(1, 8, 3, true);
    const stored = useTripStore.getState().budgetItems.find(i => i.id === 8);
    expect(stored?.members?.[0]?.paid).toBe(1);
  });

  it('FE-STORE-BUDGET-010: reorderBudgetItems reorders optimistically and reloads on error', async () => {
    const a = buildBudgetItem({ id: 1, trip_id: 1 });
    const b = buildBudgetItem({ id: 2, trip_id: 1 });
    seedStore(useTripStore, { budgetItems: [a, b] });

    // Reorder succeeds
    server.use(
      http.put('/api/trips/1/budget/reorder/items', () =>
        HttpResponse.json({ success: true })
      )
    );
    await useTripStore.getState().reorderBudgetItems(1, [2, 1]);
    const items = useTripStore.getState().budgetItems;
    expect(items[0].id).toBe(2);
    expect(items[1].id).toBe(1);
  });

  it('FE-STORE-BUDGET-011: reorderBudgetItems reloads list on API error', async () => {
    const a = buildBudgetItem({ id: 1, trip_id: 1 });
    const b = buildBudgetItem({ id: 2, trip_id: 1 });
    seedStore(useTripStore, { budgetItems: [a, b] });

    const freshItem = buildBudgetItem({ id: 99, trip_id: 1 });
    server.use(
      http.put('/api/trips/1/budget/reorder/items', () =>
        HttpResponse.json({ error: 'error' }, { status: 500 })
      ),
      http.get('/api/trips/1/budget', () =>
        HttpResponse.json({ items: [freshItem] })
      )
    );
    await useTripStore.getState().reorderBudgetItems(1, [2, 1]);
    // After failure, fresh list from server
    expect(useTripStore.getState().budgetItems[0].id).toBe(freshItem.id);
    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
  });

  it('FE-STORE-BUDGET-016: toggleBudgetMemberPaid tolerates an item that carries no members array', async () => {
    const bare = buildBudgetItem({ id: 40, trip_id: 1 });
    delete (bare as Partial<typeof bare>).members;
    const other = buildBudgetItem({ id: 41, trip_id: 1, members: [{ user_id: 3, paid: 0, username: 'carol' }] });
    seedStore(useTripStore, { budgetItems: [bare, other] });

    server.use(
      http.put('/api/trips/1/budget/40/members/3/paid', () => HttpResponse.json({ success: true, paid: true }))
    );
    await useTripStore.getState().toggleBudgetMemberPaid(1, 40, 3, true);

    expect(useTripStore.getState().budgetItems[0].members).toEqual([]);
    // The untouched item keeps its own members.
    expect(useTripStore.getState().budgetItems[1].members?.[0]?.paid).toBe(0);
  });

  it('FE-STORE-BUDGET-012: updateBudgetItem throws the server message and keeps the item', async () => {
    const existing = buildBudgetItem({ id: 30, trip_id: 1, name: 'Old' });
    seedStore(useTripStore, { budgetItems: [existing] });

    server.use(
      http.put('/api/trips/1/budget/30', () =>
        HttpResponse.json({ error: 'Budget is locked' }, { status: 403 })
      )
    );
    await expect(
      useTripStore.getState().updateBudgetItem(1, 30, { name: 'New' })
    ).rejects.toThrow('Budget is locked');
    expect(useTripStore.getState().budgetItems[0].name).toBe('Old');
  });

  it('FE-STORE-BUDGET-013: reorderBudgetCategories regroups items and appends unlisted categories', async () => {
    const food = buildBudgetItem({ id: 1, trip_id: 1, category: 'Food' });
    const transport = buildBudgetItem({ id: 2, trip_id: 1, category: 'Transport' });
    const food2 = buildBudgetItem({ id: 3, trip_id: 1, category: 'Food' });
    // No category at all — grouped under the 'Other' bucket.
    const uncategorised = buildBudgetItem({ id: 4, trip_id: 1, category: null });
    seedStore(useTripStore, { budgetItems: [food, transport, food2, uncategorised] });

    let sent: Record<string, unknown> = {};
    server.use(
      http.put('/api/trips/1/budget/reorder/categories', async ({ request }) => {
        sent = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ success: true });
      })
    );
    await useTripStore.getState().reorderBudgetCategories(1, ['Transport', 'Food']);

    expect(sent).toEqual({ orderedCategories: ['Transport', 'Food'] });
    expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([2, 1, 3, 4]);
  });

  it('FE-STORE-BUDGET-014: reorderBudgetCategories ignores a category with no items', async () => {
    const food = buildBudgetItem({ id: 1, trip_id: 1, category: 'Food' });
    seedStore(useTripStore, { budgetItems: [food] });

    server.use(
      http.put('/api/trips/1/budget/reorder/categories', () => HttpResponse.json({ success: true }))
    );
    await useTripStore.getState().reorderBudgetCategories(1, ['Lodging', 'Food']);

    expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([1]);
  });

  it('FE-STORE-BUDGET-015: reorderBudgetCategories reloads the server order and notifies on failure', async () => {
    const food = buildBudgetItem({ id: 1, trip_id: 1, category: 'Food' });
    const transport = buildBudgetItem({ id: 2, trip_id: 1, category: 'Transport' });
    seedStore(useTripStore, { budgetItems: [food, transport] });

    server.use(
      http.put('/api/trips/1/budget/reorder/categories', () =>
        HttpResponse.json({ error: 'Reorder rejected' }, { status: 500 })
      ),
      http.get('/api/trips/1/budget', () => HttpResponse.json({ items: [food, transport] }))
    );
    await useTripStore.getState().reorderBudgetCategories(1, ['Transport', 'Food']);

    expect(useTripStore.getState().budgetItems.map(i => i.id)).toEqual([1, 2]);
    expect(addToast).toHaveBeenCalledWith('Reorder rejected', 'error', undefined);
  });

  it('FE-STORE-BUDGET-017: a reorder whose reload also fails still notifies instead of rejecting', async () => {
    const a = buildBudgetItem({ id: 1, trip_id: 1 });
    const b = buildBudgetItem({ id: 2, trip_id: 1 });
    seedStore(useTripStore, { budgetItems: [a, b] });

    // Offline: the reorder and the recovery read both fail. The caller fires
    // this without awaiting, so nothing may escape as a rejection.
    server.use(
      http.put('/api/trips/1/budget/reorder/items', () => HttpResponse.error()),
      http.put('/api/trips/1/budget/reorder/categories', () => HttpResponse.error()),
      http.get('/api/trips/1/budget', () => HttpResponse.error())
    );

    await expect(useTripStore.getState().reorderBudgetItems(1, [2, 1])).resolves.toBeUndefined();
    await expect(useTripStore.getState().reorderBudgetCategories(1, ['Transport'])).resolves.toBeUndefined();

    expect(addToast).toHaveBeenCalledTimes(2);
  });
});
