// LIB-03: the tours the open collection keeps, read when it opens, kept current
// by its members' changes and never shown under another collection.
import type { CollectionTourItem } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addListener, removeListener } from '../api/websocket';
import { collectionToursRepo } from '../repo/collectionToursRepo';
import { OnlineOnlyError } from '../repo/onlineOnly';
import type { WebSocketEvent } from '../types';
import { useCollectionTourStore, watchCollectionTours } from './collectionTourStore';

// FE-STORE-COLLECTION-TOURS-001 to FE-STORE-COLLECTION-TOURS-007

const tour = (id: number, name: string) => ({ id, collection_id: 3, name }) as CollectionTourItem;

function later<T>() {
  let settle: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

beforeEach(() => {
  useCollectionTourStore.getState().clear();
  vi.mocked(addListener).mockClear();
  vi.mocked(removeListener).mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe('collectionTourStore', () => {
  it('FE-STORE-COLLECTION-TOURS-001: reads a collection’s tours and says how far it got', async () => {
    vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({ tours: [tour(1, 'Ridge')] });
    const loading = useCollectionTourStore.getState().load(3);
    expect(useCollectionTourStore.getState()).toMatchObject({ collectionId: 3, status: 'loading', tours: [] });
    await loading;
    expect(useCollectionTourStore.getState()).toMatchObject({ status: 'ready', tours: [tour(1, 'Ridge')] });
  });

  it('FE-STORE-COLLECTION-TOURS-002: an answer for a collection left meanwhile counts for nothing', async () => {
    const slow = later<{ tours: CollectionTourItem[] }>();
    vi.spyOn(collectionToursRepo, 'list')
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce({ tours: [tour(2, 'Lake')] });
    const first = useCollectionTourStore.getState().load(3);
    await useCollectionTourStore.getState().load(4);
    slow.settle({ tours: [tour(1, 'Ridge')] });
    await first;
    expect(useCollectionTourStore.getState()).toMatchObject({ collectionId: 4, tours: [tour(2, 'Lake')] });
  });

  it('FE-STORE-COLLECTION-TOURS-003: offline and failed reads say so', async () => {
    vi.spyOn(collectionToursRepo, 'list')
      .mockRejectedValueOnce(new OnlineOnlyError())
      .mockRejectedValueOnce(new Error('500'));
    await useCollectionTourStore.getState().load(3);
    expect(useCollectionTourStore.getState().status).toBe('offline');
    await useCollectionTourStore.getState().load(3);
    expect(useCollectionTourStore.getState().status).toBe('error');
  });

  it('FE-STORE-COLLECTION-TOURS-004: removing takes the tour off at once and puts it back on a refusal', async () => {
    vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({ tours: [tour(1, 'Ridge'), tour(2, 'Lake')] });
    await useCollectionTourStore.getState().load(3);
    const remove = vi.spyOn(collectionToursRepo, 'remove').mockResolvedValueOnce(undefined);
    await useCollectionTourStore.getState().remove(3, 1);
    expect(useCollectionTourStore.getState().tours.map((kept) => kept.id)).toEqual([2]);
    remove.mockRejectedValueOnce(new Error('403'));
    await expect(useCollectionTourStore.getState().remove(3, 2)).rejects.toThrow('403');
    expect(useCollectionTourStore.getState().tours.map((kept) => kept.id)).toEqual([2]);
  });

  it('FE-STORE-COLLECTION-TOURS-006: of two reads of the same collection, an older answer coming last counts for nothing', async () => {
    const older = later<{ tours: CollectionTourItem[] }>();
    const newer = later<{ tours: CollectionTourItem[] }>();
    vi.spyOn(collectionToursRepo, 'list').mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const first = useCollectionTourStore.getState().load(3);
    const second = useCollectionTourStore.getState().load(3);
    newer.settle({ tours: [tour(1, 'Ridge'), tour(2, 'Lake')] });
    await second;
    older.settle({ tours: [tour(1, 'Ridge')] });
    await first;
    expect(useCollectionTourStore.getState().tours.map((kept) => kept.id)).toEqual([1, 2]);
  });

  it('FE-STORE-COLLECTION-TOURS-007: a refused removal puts back only its tour, keeping a list read meanwhile', async () => {
    const both = [tour(1, 'Ridge'), tour(2, 'Lake')];
    const list = vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({ tours: both });
    await useCollectionTourStore.getState().load(3);
    const refusal = later<undefined>();
    const refused = refusal.promise.then(() => Promise.reject(new Error('403')));
    vi.spyOn(collectionToursRepo, 'remove').mockReturnValueOnce(refused);
    const removing = useCollectionTourStore.getState().remove(3, 1);
    // Another member kept a tour meanwhile; the list read for it no longer holds the tour being removed.
    list.mockResolvedValueOnce({ tours: [tour(2, 'Lake'), tour(3, 'Summit')] });
    await useCollectionTourStore.getState().load(3);
    refusal.settle(undefined);
    await expect(removing).rejects.toThrow('403');
    expect(useCollectionTourStore.getState().tours.map((kept) => kept.id)).toEqual([1, 2, 3]);
  });

  it('FE-STORE-COLLECTION-TOURS-005: reads again when a member changes the open collection, and stops listening', async () => {
    const list = vi.spyOn(collectionToursRepo, 'list').mockResolvedValue({ tours: [] });
    await useCollectionTourStore.getState().load(3);
    list.mockClear();
    const stop = watchCollectionTours();
    const onEvent = vi.mocked(addListener).mock.calls[0]?.[0] as (event: WebSocketEvent) => void;
    onEvent({ type: 'collections:updated', collectionId: 4 });
    onEvent({ type: 'collections:left', collectionId: 3 });
    expect(list).not.toHaveBeenCalled();
    onEvent({ type: 'collections:updated', collectionId: 3 });
    expect(list).toHaveBeenCalledWith(3);
    stop();
    expect(removeListener).toHaveBeenCalledWith(onEvent);
  });
});
