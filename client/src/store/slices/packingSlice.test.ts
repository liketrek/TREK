// FE-STORE-PACKING-001 to FE-STORE-PACKING-002 (reorder, #969)
// FE-STORE-PACKING-003 to FE-STORE-PACKING-015 (three-tier sharing #858, mutation and error paths)
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/helpers/msw/server';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { buildPackingItem } from '../../../tests/helpers/factories';
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

describe('packingSlice', () => {
  it('FE-STORE-PACKING-001: reorderPackingItems reorders optimistically and reindexes sort_order', async () => {
    const a = buildPackingItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildPackingItem({ id: 2, trip_id: 1, sort_order: 1 });
    seedStore(useTripStore, { packingItems: [a, b] });

    server.use(
      http.put('/api/trips/1/packing/reorder', () =>
        HttpResponse.json({ success: true })
      )
    );
    await useTripStore.getState().reorderPackingItems(1, [2, 1]);
    const items = useTripStore.getState().packingItems;
    expect(items[0].id).toBe(2);
    expect(items[0].sort_order).toBe(0);
    expect(items[1].id).toBe(1);
    expect(items[1].sort_order).toBe(1);
  });

  it('FE-STORE-PACKING-002: reorderPackingItems rolls back to previous order on API error', async () => {
    const a = buildPackingItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildPackingItem({ id: 2, trip_id: 1, sort_order: 1 });
    seedStore(useTripStore, { packingItems: [a, b] });

    server.use(
      http.put('/api/trips/1/packing/reorder', () =>
        HttpResponse.json({ error: 'error' }, { status: 500 })
      )
    );
    await useTripStore.getState().reorderPackingItems(1, [2, 1]);
    // After failure the original order is restored
    const items = useTripStore.getState().packingItems;
    expect(items[0].id).toBe(1);
    expect(items[1].id).toBe(2);
    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
  });

  it('FE-STORE-PACKING-003: updatePackingItem throws the server message and keeps the item', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1, name: 'Tent' });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.put('/api/trips/1/packing/1', () =>
        HttpResponse.json({ error: 'Item is locked' }, { status: 403 })
      )
    );
    await expect(
      useTripStore.getState().updatePackingItem(1, 1, { name: 'Tarp' })
    ).rejects.toThrow('Item is locked');
    expect(useTripStore.getState().packingItems[0].name).toBe('Tent');
  });

  it('FE-STORE-PACKING-004: setPackingItemSharing sends the tier plus recipients and replaces the item', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1, is_private: 0 });
    seedStore(useTripStore, { packingItems: [item] });

    let sent: Record<string, unknown> = {};
    server.use(
      http.put('/api/trips/1/packing/1/sharing', async ({ request }) => {
        sent = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          item: { ...item, is_private: 1, recipients: [{ user_id: 4, username: 'ben' }] },
        });
      })
    );
    await useTripStore.getState().setPackingItemSharing(1, 1, 'shared', [4]);

    expect(sent).toEqual({ visibility: 'shared', recipient_ids: [4] });
    const stored = useTripStore.getState().packingItems[0];
    expect(stored.is_private).toBe(1);
    expect(stored.recipients).toEqual([{ user_id: 4, username: 'ben' }]);
  });

  it('FE-STORE-PACKING-005: setPackingItemSharing notifies and rethrows on failure', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1, is_private: 0 });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.put('/api/trips/1/packing/1/sharing', () =>
        HttpResponse.json({ error: 'Not the owner' }, { status: 403 })
      )
    );
    await expect(
      useTripStore.getState().setPackingItemSharing(1, 1, 'personal', [])
    ).rejects.toBeDefined();
    expect(addToast).toHaveBeenCalledWith('Not the owner', 'error', undefined);
    expect(useTripStore.getState().packingItems[0].is_private).toBe(0);
  });

  it('FE-STORE-PACKING-006: clonePackingItem appends the personal copy', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1, name: 'Powerbank' });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.post('/api/trips/1/packing/1/clone', () =>
        HttpResponse.json({ item: buildPackingItem({ id: 2, trip_id: 1, name: 'Powerbank', is_private: 1 }) })
      )
    );
    await useTripStore.getState().clonePackingItem(1, 1);

    expect(useTripStore.getState().packingItems.map(i => i.id)).toEqual([1, 2]);
  });

  it('FE-STORE-PACKING-007: clonePackingItem ignores a copy the socket echo already added', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1 });
    const clone = buildPackingItem({ id: 2, trip_id: 1, is_private: 1 });
    seedStore(useTripStore, { packingItems: [item, clone] });

    server.use(
      http.post('/api/trips/1/packing/1/clone', () => HttpResponse.json({ item: clone }))
    );
    await useTripStore.getState().clonePackingItem(1, 1);

    expect(useTripStore.getState().packingItems.map(i => i.id)).toEqual([1, 2]);
  });

  it('FE-STORE-PACKING-008: clonePackingItem notifies instead of throwing on failure', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1 });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.post('/api/trips/1/packing/1/clone', () =>
        HttpResponse.json({ error: 'Cannot copy' }, { status: 500 })
      )
    );
    await expect(useTripStore.getState().clonePackingItem(1, 1)).resolves.toBeUndefined();

    expect(addToast).toHaveBeenCalledWith('Cannot copy', 'error', undefined);
    expect(useTripStore.getState().packingItems).toHaveLength(1);
  });

  it('FE-STORE-PACKING-009: addPackingContributor stores the item returned by the join', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1, contributors: [] });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.post('/api/trips/1/packing/1/contributors', () =>
        HttpResponse.json({
          item: { ...item, contributors: [{ user_id: 7, username: 'kim', status: 'joined' }] },
        })
      )
    );
    await useTripStore.getState().addPackingContributor(1, 1);

    expect(useTripStore.getState().packingItems[0].contributors).toEqual([
      { user_id: 7, username: 'kim', status: 'joined' },
    ]);
  });

  it('FE-STORE-PACKING-010: addPackingContributor notifies instead of throwing on failure', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1, contributors: [] });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.post('/api/trips/1/packing/1/contributors', () =>
        HttpResponse.json({ error: 'Already joined' }, { status: 409 })
      )
    );
    await expect(useTripStore.getState().addPackingContributor(1, 1)).resolves.toBeUndefined();

    expect(addToast).toHaveBeenCalledWith('Already joined', 'error', undefined);
    expect(useTripStore.getState().packingItems[0].contributors).toEqual([]);
  });

  it('FE-STORE-PACKING-011: removePackingContributor stores the item returned by the leave', async () => {
    const item = buildPackingItem({
      id: 1,
      trip_id: 1,
      contributors: [{ user_id: 7, username: 'kim', status: 'joined' }],
    });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.delete('/api/trips/1/packing/1/contributors/7', () =>
        HttpResponse.json({ item: { ...item, contributors: [] } })
      )
    );
    await useTripStore.getState().removePackingContributor(1, 1, 7);

    expect(useTripStore.getState().packingItems[0].contributors).toEqual([]);
  });

  it('FE-STORE-PACKING-012: removePackingContributor notifies instead of throwing on failure', async () => {
    const item = buildPackingItem({
      id: 1,
      trip_id: 1,
      contributors: [{ user_id: 7, username: 'kim', status: 'joined' }],
    });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.delete('/api/trips/1/packing/1/contributors/7', () =>
        HttpResponse.json({ error: 'Not a contributor' }, { status: 404 })
      )
    );
    await expect(useTripStore.getState().removePackingContributor(1, 1, 7)).resolves.toBeUndefined();

    expect(addToast).toHaveBeenCalledWith('Not a contributor', 'error', undefined);
    expect(useTripStore.getState().packingItems[0].contributors).toHaveLength(1);
  });

  it('FE-STORE-PACKING-014: add, update, toggle and delete only touch the targeted item', async () => {
    const target = buildPackingItem({ id: 1, trip_id: 1, name: 'Tent', checked: 0 });
    const sibling = buildPackingItem({ id: 2, trip_id: 1, name: 'Stove', checked: 0 });
    seedStore(useTripStore, { packingItems: [target, sibling] });

    server.use(
      http.post('/api/trips/1/packing', () =>
        HttpResponse.json({ item: buildPackingItem({ id: 3, trip_id: 1, name: 'Mat' }) })
      ),
      http.put('/api/trips/1/packing/1', () =>
        HttpResponse.json({ item: { ...target, name: 'Tarp', checked: 1 } })
      ),
      http.delete('/api/trips/1/packing/3', () => HttpResponse.json({ success: true }))
    );

    await useTripStore.getState().addPackingItem(1, { name: 'Mat' });
    expect(useTripStore.getState().packingItems.map(i => i.id)).toEqual([1, 2, 3]);

    await useTripStore.getState().updatePackingItem(1, 1, { name: 'Tarp' });
    await useTripStore.getState().togglePackingItem(1, 1, true);
    await useTripStore.getState().deletePackingItem(1, 3);

    const items = useTripStore.getState().packingItems;
    expect(items.map(i => i.id)).toEqual([1, 2]);
    expect(items[0].name).toBe('Tarp');
    expect(items[0].checked).toBe(1);
    expect(items[1].name).toBe('Stove');
    expect(items[1].checked).toBe(0);
  });

  it('FE-STORE-PACKING-015: reorderPackingItems drops unknown ids and keeps unlisted items at the end', async () => {
    const a = buildPackingItem({ id: 1, trip_id: 1, sort_order: 0 });
    const b = buildPackingItem({ id: 2, trip_id: 1, sort_order: 1 });
    const untouched = buildPackingItem({ id: 3, trip_id: 1, sort_order: 2 });
    seedStore(useTripStore, { packingItems: [a, b, untouched] });

    server.use(
      http.put('/api/trips/1/packing/reorder', () => HttpResponse.json({ success: true }))
    );
    await useTripStore.getState().reorderPackingItems(1, [2, 999, 1]);

    const items = useTripStore.getState().packingItems;
    expect(items.map(i => i.id)).toEqual([2, 1, 3]);
    // The unknown id is dropped before reindexing, so the reordered items get a
    // gapless sequence; the unlisted item keeps its own sort_order.
    expect(items.map(i => i.sort_order)).toEqual([0, 1, 2]);
  });

  it('FE-STORE-PACKING-013: togglePackingItem rolls the checkbox back and notifies on failure', async () => {
    const item = buildPackingItem({ id: 1, trip_id: 1, checked: 0 });
    seedStore(useTripStore, { packingItems: [item] });

    server.use(
      http.put('/api/trips/1/packing/1', () =>
        HttpResponse.json({ error: 'Write failed' }, { status: 500 })
      )
    );
    await useTripStore.getState().togglePackingItem(1, 1, true);

    expect(useTripStore.getState().packingItems[0].checked).toBe(0);
    expect(addToast).toHaveBeenCalledWith('Write failed', 'error', undefined);
  });
});
