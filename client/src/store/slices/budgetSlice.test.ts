// FE-STORE-BUDGET-001 to FE-STORE-BUDGET-027
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildBudgetItem, buildTrip } from '../../../tests/helpers/factories';
import { clearExchangeRateCache } from '../../hooks/useExchangeRates';
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

  // ── Which writes refresh the bookings (#2084) ───────────────────────────────
  // A booking mirrors the total of its linked expenses, so the reservations are
  // reloaded after any write to an expense on a booking and whenever a link
  // moves, and only then.

  function spyReload() {
    const loadReservations = vi.fn().mockResolvedValue(undefined);
    seedStore(useTripStore, { loadReservations });
    return loadReservations;
  }

  it('FE-STORE-BUDGET-018: linking an expense to a booking reloads the reservations without a new total', async () => {
    const existing = buildBudgetItem({ id: 50, trip_id: 1 });
    seedStore(useTripStore, { budgetItems: [existing] });
    const loadReservations = spyReload();
    server.use(
      http.put('/api/trips/1/budget/50', () => HttpResponse.json({ item: { ...existing, reservation_id: 9 } }))
    );
    await useTripStore.getState().updateBudgetItem(1, 50, { reservation_id: 9 });
    expect(loadReservations).toHaveBeenCalledWith(1);
    expect(useTripStore.getState().budgetItems[0].reservation_id).toBe(9);
  });

  it('FE-STORE-BUDGET-019: unlinking reloads the reservations although the saved item has no booking any more', async () => {
    const existing = buildBudgetItem({ id: 51, trip_id: 1, reservation_id: 9 });
    seedStore(useTripStore, { budgetItems: [existing] });
    const loadReservations = spyReload();
    server.use(
      http.put('/api/trips/1/budget/51', () => HttpResponse.json({ item: { ...existing, reservation_id: null } }))
    );
    await useTripStore.getState().updateBudgetItem(1, 51, { reservation_id: null });
    expect(loadReservations).toHaveBeenCalledWith(1);
  });

  it('FE-STORE-BUDGET-020: a new total on an expense without a booking, or a place link, leaves the reservations alone', async () => {
    const existing = buildBudgetItem({ id: 52, trip_id: 1 });
    seedStore(useTripStore, { budgetItems: [existing] });
    const loadReservations = spyReload();
    server.use(
      http.put('/api/trips/1/budget/52', async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ item: { ...existing, ...body } });
      })
    );
    await useTripStore.getState().updateBudgetItem(1, 52, { total_price: 80 });
    await useTripStore.getState().updateBudgetItem(1, 52, { place_id: 4 });
    expect(loadReservations).not.toHaveBeenCalled();
    expect(useTripStore.getState().budgetItems[0].place_id).toBe(4);
  });

  it('FE-STORE-BUDGET-021: any edit of an expense on a booking reloads the reservations, not only a new total', async () => {
    const existing = buildBudgetItem({ id: 53, trip_id: 1, reservation_id: 9 });
    seedStore(useTripStore, { budgetItems: [existing] });
    const loadReservations = spyReload();
    server.use(
      http.put('/api/trips/1/budget/53', () => HttpResponse.json({ item: { ...existing, currency: 'USD' } }))
    );
    await useTripStore.getState().updateBudgetItem(1, 53, { currency: 'USD' });
    expect(loadReservations).toHaveBeenCalledWith(1);
  });

  it('FE-STORE-BUDGET-022: an expense created on a booking reloads the reservations', async () => {
    const loadReservations = spyReload();
    const created = buildBudgetItem({ id: 54, trip_id: 1, reservation_id: 9 });
    server.use(http.post('/api/trips/1/budget', () => HttpResponse.json({ item: created })));
    await useTripStore.getState().addBudgetItem(1, { name: 'Upgrade', reservation_id: 9 });
    expect(loadReservations).toHaveBeenCalledWith(1);
    expect(useTripStore.getState().budgetItems).toContainEqual(created);
  });

  it('FE-STORE-BUDGET-023: an expense created without a booking leaves the reservations alone', async () => {
    const loadReservations = spyReload();
    const created = buildBudgetItem({ id: 55, trip_id: 1, place_id: 4 });
    server.use(http.post('/api/trips/1/budget', () => HttpResponse.json({ item: created })));
    await useTripStore.getState().addBudgetItem(1, { name: 'Museum', place_id: 4 });
    expect(loadReservations).not.toHaveBeenCalled();
  });
});

// An AUD trip whose server cannot fetch rates while the browser can: a write in another
// currency lends the browser's rate, so the server can freeze one on entry.
describe('budgetSlice: lent rates', () => {
  let sent: Record<string, unknown>[] = [];

  beforeEach(() => {
    clearExchangeRateCache();
    sent = [];
    seedStore(useTripStore, { trip: buildTrip({ id: 1, currency: 'AUD' }) });
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3 }, ts: Date.now() }));
    server.use(
      http.post('/api/trips/:id/budget', async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        sent.push(body);
        return HttpResponse.json({ item: buildBudgetItem({ trip_id: 1, name: String(body.name) }) });
      }),
      http.put('/api/trips/1/budget/:itemId', async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        sent.push(body);
        return HttpResponse.json({ item: { ...buildBudgetItem({ id: 50, trip_id: 1 }), ...body } });
      }),
    );
  });

  afterEach(clearExchangeRateCache);

  it('FE-STORE-BUDGET-024: addBudgetItem lends the fresh trip-currency rate for a foreign currency', async () => {
    await useTripStore.getState().addBudgetItem(1, { name: 'Pho', total_price: 8920000, currency: 'VND' });

    expect(sent[0]).toMatchObject({ name: 'Pho', currency: 'VND', fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } } });
  });

  it('FE-STORE-BUDGET-025: nothing is lent for the trip currency, another trip or a stale table', async () => {
    await useTripStore.getState().addBudgetItem(1, { name: 'Tram', currency: 'AUD' });
    // The store only knows the open trip's currency, and a rate has to be quoted against it.
    await useTripStore.getState().addBudgetItem(2, { name: 'Pho', currency: 'VND' });
    clearExchangeRateCache();
    localStorage.setItem('trek_fx_AUD', JSON.stringify({ rates: { AUD: 1, VND: 18241.3 }, ts: Date.now() - 7 * 60 * 60 * 1000 }));
    await useTripStore.getState().addBudgetItem(1, { name: 'Banh mi', currency: 'VND' });

    expect(sent).toHaveLength(3);
    for (const body of sent) expect(body).not.toHaveProperty('fallback_fx');
  });

  it('FE-STORE-BUDGET-026: updateBudgetItem lends it too, for a change into a foreign currency', async () => {
    seedStore(useTripStore, { budgetItems: [buildBudgetItem({ id: 50, trip_id: 1, currency: 'USD', exchange_rate: 0.66 })] });

    await useTripStore.getState().updateBudgetItem(1, 50, { currency: 'VND', total_price: 8920000 });

    expect(sent[0]).toEqual({ currency: 'VND', total_price: 8920000, fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } } });
  });

  it('FE-STORE-BUDGET-027: freezeMissingRates sends the lent rates and takes the healed rows in', async () => {
    const bill = buildBudgetItem({ id: 60, trip_id: 1, currency: 'VND', exchange_rate: 1 });
    const other = buildBudgetItem({ id: 61, trip_id: 1, currency: 'AUD', exchange_rate: 1 });
    seedStore(useTripStore, { budgetItems: [bill, other] });
    const bodies: unknown[] = [];
    server.use(http.post('/api/trips/1/budget/freeze-rates', async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ items: [{ ...bill, exchange_rate: 18241.3 }], settlements: [], unresolved: [] });
    }));

    const result = await useTripStore.getState().freezeMissingRates(1, { base: 'AUD', rates: { VND: 18241.3 } });
    // Without a table of its own to lend, the call asks the server to use its own rates.
    await useTripStore.getState().freezeMissingRates(1);

    expect(bodies).toEqual([{ fallback_fx: { base: 'AUD', rates: { VND: 18241.3 } } }, {}]);
    expect(result.unresolved).toEqual([]);
    expect(useTripStore.getState().budgetItems.map(i => [i.id, i.exchange_rate])).toEqual([[60, 18241.3], [61, 1]]);
  });
});
