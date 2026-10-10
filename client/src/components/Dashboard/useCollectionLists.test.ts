// FE-COMP-COLLISTS-001 to -003: the saved-place lists both dashboards show.
import { renderHook, waitFor } from '@testing-library/react';
import type { Collection } from '@trek/shared';

import { collectionsApi } from '../../api/collections';
import { useCollectionLists } from './useCollectionLists';

afterEach(() => vi.restoreAllMocks());

describe('useCollectionLists', () => {
  it('FE-COMP-COLLISTS-001: starts loading, then holds the fetched lists', async () => {
    const lists = [{ id: 1, name: 'Food' }] as unknown as Collection[];
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ collections: lists } as never);
    const { result } = renderHook(() => useCollectionLists());
    expect(result.current).toEqual({ lists: [], loading: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists).toBe(lists);
  });

  it('FE-COMP-COLLISTS-002: a failed fetch ends loading with no lists', async () => {
    vi.spyOn(collectionsApi, 'list').mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useCollectionLists());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists).toEqual([]);
  });

  it('FE-COMP-COLLISTS-003: an answer after unmount is dropped', async () => {
    let resolve!: (v: { collections: Collection[] }) => void;
    vi.spyOn(collectionsApi, 'list').mockImplementation(() => new Promise((r) => (resolve = r)) as never);
    const { result, unmount } = renderHook(() => useCollectionLists());
    unmount();
    resolve({ collections: [{ id: 2 } as unknown as Collection] });
    await Promise.resolve();
    expect(result.current).toEqual({ lists: [], loading: true });
  });
});
