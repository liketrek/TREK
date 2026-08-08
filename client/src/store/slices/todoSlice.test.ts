// FE-STORE-TODO-001 to FE-STORE-TODO-006 (reorder, #969, plus mutation and error paths)
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildTodoItem } from '../../../tests/helpers/factories';
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

describe('todoSlice', () => {
  it('FE-STORE-TODO-001: reorderTodoItems reorders optimistically and reindexes sort_order', async () => {
    const a = buildTodoItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildTodoItem({ id: 2, trip_id: 1, sort_order: 1 });
    seedStore(useTripStore, { todoItems: [a, b] });

    server.use(
      http.put('/api/trips/1/todo/reorder', () =>
        HttpResponse.json({ success: true })
      )
    );
    await useTripStore.getState().reorderTodoItems(1, [2, 1]);
    const items = useTripStore.getState().todoItems;
    expect(items[0].id).toBe(2);
    expect(items[0].sort_order).toBe(0);
    expect(items[1].id).toBe(1);
    expect(items[1].sort_order).toBe(1);
  });

  it('FE-STORE-TODO-002: reorderTodoItems rolls back to previous order on API error', async () => {
    const a = buildTodoItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildTodoItem({ id: 2, trip_id: 1, sort_order: 1 });
    seedStore(useTripStore, { todoItems: [a, b] });

    server.use(
      http.put('/api/trips/1/todo/reorder', () =>
        HttpResponse.json({ error: 'error' }, { status: 500 })
      )
    );
    await useTripStore.getState().reorderTodoItems(1, [2, 1]);
    // After failure the original order is restored
    const items = useTripStore.getState().todoItems;
    expect(items[0].id).toBe(1);
    expect(items[1].id).toBe(2);
    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
  });

  it('FE-STORE-TODO-003: updateTodoItem throws the server message and keeps the item', async () => {
    const item = buildTodoItem({ id: 1, trip_id: 1, name: 'Book ferry' });
    seedStore(useTripStore, { todoItems: [item] });

    server.use(
      http.put('/api/trips/1/todo/1', () =>
        HttpResponse.json({ error: 'Todo is locked' }, { status: 403 })
      )
    );
    await expect(
      useTripStore.getState().updateTodoItem(1, 1, { name: 'Book train' })
    ).rejects.toThrow('Todo is locked');
    expect(useTripStore.getState().todoItems[0].name).toBe('Book ferry');
  });

  it('FE-STORE-TODO-005: add, update, toggle and delete only touch the targeted todo', async () => {
    const target = buildTodoItem({ id: 1, trip_id: 1, name: 'Book ferry', checked: 0 });
    const sibling = buildTodoItem({ id: 2, trip_id: 1, name: 'Renew passport', checked: 0 });
    seedStore(useTripStore, { todoItems: [target, sibling] });

    server.use(
      http.post('/api/trips/1/todo', () =>
        HttpResponse.json({ item: buildTodoItem({ id: 3, trip_id: 1, name: 'Pack meds' }) })
      ),
      http.put('/api/trips/1/todo/1', () =>
        HttpResponse.json({ item: { ...target, name: 'Book train', checked: 1 } })
      ),
      http.delete('/api/trips/1/todo/3', () => HttpResponse.json({ success: true }))
    );

    await useTripStore.getState().addTodoItem(1, { name: 'Pack meds' });
    expect(useTripStore.getState().todoItems.map(i => i.id)).toEqual([1, 2, 3]);

    await useTripStore.getState().updateTodoItem(1, 1, { name: 'Book train' });
    await useTripStore.getState().toggleTodoItem(1, 1, true);
    await useTripStore.getState().deleteTodoItem(1, 3);

    const items = useTripStore.getState().todoItems;
    expect(items.map(i => i.id)).toEqual([1, 2]);
    expect(items[0].name).toBe('Book train');
    expect(items[0].checked).toBe(1);
    expect(items[1].name).toBe('Renew passport');
    expect(items[1].checked).toBe(0);
  });

  it('FE-STORE-TODO-006: reorderTodoItems drops unknown ids and keeps unlisted todos at the end', async () => {
    const a = buildTodoItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildTodoItem({ id: 2, trip_id: 1, sort_order: 1 });
    const untouched = buildTodoItem({ id: 3, trip_id: 1, sort_order: 2 });
    seedStore(useTripStore, { todoItems: [a, b, untouched] });

    server.use(
      http.put('/api/trips/1/todo/reorder', () => HttpResponse.json({ success: true }))
    );
    await useTripStore.getState().reorderTodoItems(1, [2, 999, 1]);

    const items = useTripStore.getState().todoItems;
    expect(items.map(i => i.id)).toEqual([2, 1, 3]);
    // The unknown id is dropped before reindexing, so the reordered todos get a
    // gapless sequence; the unlisted todo keeps its own sort_order.
    expect(items.map(i => i.sort_order)).toEqual([0, 1, 2]);
  });

  it('FE-STORE-TODO-004: toggleTodoItem rolls the checkbox back and notifies on failure', async () => {
    const item = buildTodoItem({ id: 1, trip_id: 1, checked: 0 });
    seedStore(useTripStore, { todoItems: [item] });

    server.use(
      http.put('/api/trips/1/todo/1', () =>
        HttpResponse.json({ error: 'Write failed' }, { status: 500 })
      )
    );
    await useTripStore.getState().toggleTodoItem(1, 1, true);

    expect(useTripStore.getState().todoItems[0].checked).toBe(0);
    expect(addToast).toHaveBeenCalledWith('Write failed', 'error', undefined);
  });
});
