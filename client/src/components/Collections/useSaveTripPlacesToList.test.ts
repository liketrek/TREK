// FE-COMP-SAVETRIPHOOK-001 to FE-COMP-SAVETRIPHOOK-010: the bulk save-to-list logic
// behind both the desktop dialog and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Collection, CollectionListResponse } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { collectionsApi } from '../../api/collections';
import { useSaveTripPlacesToList, type SaveTripPlacesToListOptions } from './useSaveTripPlacesToList';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (k: string, p?: Record<string, unknown>) => (p ? `${k}:${JSON.stringify(p)}` : k),
  }),
}));

function list(over: Partial<Collection>): Collection {
  return { id: 1, owner_id: 7, name: 'List', color: null, place_count: 0, ...over } as Collection;
}

const FAVORITES = list({ id: 1, name: 'Favorites' });
const WISHLIST = list({ id: 2, name: 'Wishlist' });
const SHARED = list({ id: 3, name: 'Team ideas', is_owner: false });

const listResponse = (collections: Collection[]): CollectionListResponse => ({ collections, incomingInvites: [] });

let addToast: ReturnType<typeof vi.fn>;

function setup(over: Partial<SaveTripPlacesToListOptions> = {}) {
  const props: SaveTripPlacesToListOptions = {
    open: true,
    tripId: 5,
    placeIds: [11, 12],
    onClose: vi.fn(),
    onDone: vi.fn(),
    ...over,
  };
  const hook = renderHook((p: SaveTripPlacesToListOptions) => useSaveTripPlacesToList(p), { initialProps: props });
  return { ...hook, props };
}

beforeEach(() => {
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('useSaveTripPlacesToList', () => {
  it('FE-COMP-SAVETRIPHOOK-001: loads the writable lists on open and drops the read-only shares', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, SHARED, WISHLIST]));
    const { result } = setup();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists.map((l) => l.id)).toEqual([1, 2]);
    expect(result.current.filtered).toBe(result.current.lists);
  });

  it('FE-COMP-SAVETRIPHOOK-002: requests nothing while closed, and loads again on the next opening', async () => {
    const spy = vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]));
    const { result, rerender, props } = setup({ open: false });
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    rerender({ ...props, open: true });
    await waitFor(() => expect(result.current.lists).toHaveLength(1));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-SAVETRIPHOOK-003: a missing or failing response leaves no lists', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ incomingInvites: [] } as unknown as CollectionListResponse);
    const first = setup();
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.lists).toEqual([]);
    first.unmount();

    vi.spyOn(collectionsApi, 'list').mockRejectedValue(new Error('offline'));
    const second = setup();
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.lists).toEqual([]);
  });

  it('FE-COMP-SAVETRIPHOOK-004: an answer that arrives after the picker closed is dropped', async () => {
    let resolve!: (v: CollectionListResponse) => void;
    vi.spyOn(collectionsApi, 'list').mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const { result, rerender, props } = setup();
    rerender({ ...props, open: false });
    await act(async () => {
      resolve(listResponse([FAVORITES]));
    });
    expect(result.current.lists).toEqual([]);
    // The cancelled load leaves its spinner flag alone, as before.
    expect(result.current.loading).toBe(true);
  });

  it('FE-COMP-SAVETRIPHOOK-005: the search narrows by name, trimmed and case-insensitive, and an opening clears it', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]));
    const { result, rerender, props } = setup();
    await waitFor(() => expect(result.current.lists).toHaveLength(2));

    act(() => result.current.setSearch('  WISH '));
    expect(result.current.filtered.map((l) => l.name)).toEqual(['Wishlist']);

    rerender({ ...props, open: false });
    rerender({ ...props, open: true });
    expect(result.current.search).toBe('');
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.filtered).toHaveLength(2);
  });

  it('FE-COMP-SAVETRIPHOOK-006: a pick copies the selection, reports it, then calls onDone before onClose', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]));
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany').mockResolvedValue({ copied: 2, skipped: [] });
    const { result, props } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.pick(FAVORITES);
    });

    expect(save).toHaveBeenCalledWith(1, 5, [11, 12]);
    expect(addToast).toHaveBeenCalledWith(
      'collections.addedNToList:{"count":2,"name":"Favorites"}',
      'success',
      undefined
    );
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(vi.mocked(props.onDone).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(props.onClose).mock.invocationCallOrder[0]
    );
    expect(result.current.busyId).toBeNull();
  });

  it('FE-COMP-SAVETRIPHOOK-007: duplicates the server skipped are reported, and a no-op save says so', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]));
    const save = vi
      .spyOn(collectionsApi, 'saveFromTripMany')
      .mockResolvedValueOnce({ copied: 0, skipped: [{ id: 12, name: 'Louvre' }] })
      .mockResolvedValueOnce({ copied: 0, skipped: [] });
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.pick(FAVORITES);
    });
    expect(addToast).toHaveBeenCalledWith('collections.skippedDuplicates:{"count":1}', 'info', undefined);
    expect(addToast).not.toHaveBeenCalledWith('collections.copyNothing', 'info', undefined);

    await act(async () => {
      await result.current.pick(FAVORITES);
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(addToast).toHaveBeenLastCalledWith('collections.copyNothing', 'info', undefined);
  });

  it('FE-COMP-SAVETRIPHOOK-008: a failed save shows the server message and keeps the picker open', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]));
    vi.spyOn(collectionsApi, 'saveFromTripMany')
      .mockRejectedValueOnce({ response: { data: { error: 'List is full' } } })
      .mockRejectedValueOnce(new Error('network'));
    const { result, props } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.pick(FAVORITES);
    });
    expect(addToast).toHaveBeenCalledWith('List is full', 'error', undefined);

    await act(async () => {
      await result.current.pick(FAVORITES);
    });
    expect(addToast).toHaveBeenLastCalledWith('common.error', 'error', undefined);
    expect(props.onDone).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
    expect(result.current.busyId).toBeNull();
  });

  it('FE-COMP-SAVETRIPHOOK-009: a second pick while one is running is ignored', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]));
    let release!: (v: { copied: number; skipped: { id: number; name: string }[] }) => void;
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany').mockReturnValue(
      new Promise((r) => {
        release = r;
      })
    );
    const { result } = setup();
    await waitFor(() => expect(result.current.loading).toBe(false));

    let first!: Promise<void>;
    act(() => {
      first = result.current.pick(FAVORITES);
    });
    expect(result.current.busyId).toBe(1);

    await act(async () => {
      await result.current.pick(WISHLIST);
    });
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => {
      release({ copied: 1, skipped: [] });
      await first;
    });
    expect(result.current.busyId).toBeNull();
  });

  it('FE-COMP-SAVETRIPHOOK-010: an empty selection sends nothing', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]));
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany');
    const { result, props } = setup({ placeIds: [] });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.pick(FAVORITES);
    });
    expect(save).not.toHaveBeenCalled();
    expect(props.onDone).not.toHaveBeenCalled();
    expect(result.current.busyId).toBeNull();
  });
});
