import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildShoppingItem } from '../../../tests/helpers/factories';
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

describe('shoppingSlice', () => {
  it('FE-STORE-SHOP-001: reorderShoppingItems reorders optimistically and reindexes sort_order', async () => {
    const a = buildShoppingItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildShoppingItem({ id: 2, trip_id: 1, sort_order: 1 });
    seedStore(useTripStore, { shoppingItems: [a, b] });

    server.use(
      http.put('/api/trips/1/shopping/reorder', () =>
        HttpResponse.json({ success: true })
      )
    );
    await useTripStore.getState().reorderShoppingItems(1, [2, 1]);
    const items = useTripStore.getState().shoppingItems;
    expect(items[0].id).toBe(2);
    expect(items[0].sort_order).toBe(0);
    expect(items[1].id).toBe(1);
    expect(items[1].sort_order).toBe(1);
  });

  it('FE-STORE-SHOP-002: reorderShoppingItems rolls back on API error', async () => {
    const a = buildShoppingItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildShoppingItem({ id: 2, trip_id: 1, sort_order: 1 });
    seedStore(useTripStore, { shoppingItems: [a, b] });

    server.use(
      http.put('/api/trips/1/shopping/reorder', () =>
        HttpResponse.json({ error: 'error' }, { status: 500 })
      )
    );
    await useTripStore.getState().reorderShoppingItems(1, [2, 1]);
    const items = useTripStore.getState().shoppingItems;
    expect(items[0].id).toBe(1);
    expect(items[1].id).toBe(2);
    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
  });

  it('FE-STORE-SHOP-003: toggleShoppingItem flips checked and rolls back on error', async () => {
    const item = buildShoppingItem({ id: 1, trip_id: 1, checked: 0 });
    seedStore(useTripStore, { shoppingItems: [item] });

    server.use(
      http.put('/api/trips/1/shopping/1', () =>
        HttpResponse.json({ error: 'fail' }, { status: 500 })
      )
    );

    await useTripStore.getState().toggleShoppingItem(1, 1, true);
    // Rolled back after error
    expect(useTripStore.getState().shoppingItems[0].checked).toBe(0);
    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
  });

  it('FE-STORE-SHOP-004: clearCheckedShoppingItems filters out completed items', async () => {
    const a = buildShoppingItem({ id: 1, trip_id: 1, checked: 1 });
    const b = buildShoppingItem({ id: 2, trip_id: 1, checked: 0 });
    seedStore(useTripStore, { shoppingItems: [a, b] });

    server.use(
      http.post('/api/trips/1/shopping/clear-checked', () =>
        HttpResponse.json({ success: true, deletedIds: [1] })
      )
    );

    await useTripStore.getState().clearCheckedShoppingItems(1);
    const items = useTripStore.getState().shoppingItems;
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(2);
  });
});
