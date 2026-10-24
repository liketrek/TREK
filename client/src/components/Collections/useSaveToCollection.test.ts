// FE-COMP-SAVETOCOLHOOK-001 to FE-COMP-SAVETOCOLHOOK-014: the store-driven save-to-list
// picker logic behind both the desktop dialog and the phone sheet.
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Collection, CollectionListResponse, CollectionMembership } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { collectionsApi } from '../../api/collections';
import { type SaveToCollectionTarget, useSaveToCollectionStore } from '../../store/saveToCollectionStore';
import { VISITED_EVERYWHERE_BUSY, useSaveToCollection } from './useSaveToCollection';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({ useNavigate: () => mockNavigate }));

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

const listResponse = (collections: Collection[]): CollectionListResponse => ({ collections, incomingInvites: [] });

const TARGET: SaveToCollectionTarget = {
  name: 'Colosseum',
  source_trip_id: 5,
  source_place_id: 42,
  lat: 41.89,
  lng: 12.49,
  google_place_id: 'gp-1',
  google_ftid: 'ft-1',
};

const SAVED_IN_FAVORITES: CollectionMembership = {
  saved: true,
  lists: [{ collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true }],
};

let addToast: ReturnType<typeof vi.fn>;

function openFor(target: SaveToCollectionTarget = TARGET) {
  act(() => useSaveToCollectionStore.setState({ target, version: 0 }));
}

async function loaded() {
  const hook = renderHook(() => useSaveToCollection());
  openFor();
  await waitFor(() => expect(hook.result.current.lists).toHaveLength(2));
  return hook;
}

beforeEach(() => {
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
  mockNavigate.mockClear();
  useSaveToCollectionStore.setState({ target: null, version: 0 });
  vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]));
  vi.spyOn(collectionsApi, 'membership').mockResolvedValue({ saved: false, lists: [] });
});

afterEach(() => {
  vi.restoreAllMocks();
  useSaveToCollectionStore.setState({ target: null, version: 0 });
  delete window.__addToast;
});

describe('useSaveToCollection', () => {
  it('FE-COMP-SAVETOCOLHOOK-001: requests nothing while no target is set', () => {
    const { result } = renderHook(() => useSaveToCollection());
    expect(result.current.target).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(collectionsApi.list).not.toHaveBeenCalled();
    expect(collectionsApi.membership).not.toHaveBeenCalled();
  });

  it('FE-COMP-SAVETOCOLHOOK-002: a new target loads the lists and the membership by maps identity', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue(SAVED_IN_FAVORITES);
    const { result } = renderHook(() => useSaveToCollection());
    openFor();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists.map((l) => l.id)).toEqual([1, 2]);
    expect(collectionsApi.membership).toHaveBeenCalledWith({
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      name: 'Colosseum',
      lat: 41.89,
      lng: 12.49,
    });
    expect(result.current.savedByCollection.get(1)?.place_id).toBe(900);
    expect(result.current.savedByCollection.has(2)).toBe(false);
    expect(result.current.unvisited.map((l) => l.place_id)).toEqual([900]);
  });

  it('FE-COMP-SAVETOCOLHOOK-003: failing requests fall back to no lists and saved nowhere', async () => {
    vi.spyOn(collectionsApi, 'list').mockRejectedValue(new Error('offline'));
    vi.spyOn(collectionsApi, 'membership').mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useSaveToCollection());
    openFor();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lists).toEqual([]);
    expect(result.current.savedByCollection.size).toBe(0);
    expect(result.current.unvisited).toEqual([]);
  });

  it('FE-COMP-SAVETOCOLHOOK-004: unvisited leaves out visited and read-only lists', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue({
      saved: true,
      lists: [
        { collection_id: 1, name: 'Favorites', place_id: 900, status: 'visited', can_edit: true },
        { collection_id: 2, name: 'Wishlist', place_id: 901, status: 'idea', can_edit: false },
        { collection_id: 3, name: 'Team', place_id: 902, status: 'want', can_edit: true },
      ],
    });
    const { result } = await loaded();
    await waitFor(() => expect(result.current.savedByCollection.size).toBe(3));
    expect(result.current.unvisited.map((l) => l.place_id)).toEqual([902]);
  });

  it('FE-COMP-SAVETOCOLHOOK-005: toggling an unsaved list saves the whole target with nulls, then refreshes and bumps', async () => {
    const save = vi.spyOn(collectionsApi, 'savePlace').mockResolvedValue({});
    const { result } = await loaded();
    const membershipCalls = vi.mocked(collectionsApi.membership).mock.calls.length;

    await act(() => result.current.handleToggle(WISHLIST));

    expect(save).toHaveBeenCalledWith({
      collection_id: 2,
      source_trip_id: 5,
      source_place_id: 42,
      name: 'Colosseum',
      description: null,
      lat: 41.89,
      lng: 12.49,
      address: null,
      category_id: null,
      price: null,
      currency: null,
      notes: null,
      image_url: null,
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      osm_id: null,
      website: null,
      phone: null,
      force: true,
    });
    expect(addToast).toHaveBeenCalledWith('collections.addedToList:{"name":"Wishlist"}', 'success', undefined);
    expect(vi.mocked(collectionsApi.membership).mock.calls.length).toBe(membershipCalls + 1);
    expect(useSaveToCollectionStore.getState().version).toBe(1);
    expect(result.current.busyId).toBeNull();
  });

  it('FE-COMP-SAVETOCOLHOOK-006: toggling a saved list deletes that place instead', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue(SAVED_IN_FAVORITES);
    const del = vi.spyOn(collectionsApi, 'deletePlace').mockResolvedValue({});
    const save = vi.spyOn(collectionsApi, 'savePlace');
    const { result } = await loaded();
    await waitFor(() => expect(result.current.savedByCollection.has(1)).toBe(true));

    await act(() => result.current.handleToggle(FAVORITES));

    expect(del).toHaveBeenCalledWith(900);
    expect(save).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith('collections.removedFromList:{"name":"Favorites"}', 'success', undefined);
  });

  it('FE-COMP-SAVETOCOLHOOK-007: a failing toggle toasts the error and leaves the version alone', async () => {
    vi.spyOn(collectionsApi, 'savePlace').mockRejectedValue(new Error('boom'));
    const { result } = await loaded();

    await act(() => result.current.handleToggle(WISHLIST));

    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
    expect(useSaveToCollectionStore.getState().version).toBe(0);
    expect(result.current.busyId).toBeNull();
  });

  it('FE-COMP-SAVETOCOLHOOK-008: while one change runs, every other change is dropped', async () => {
    let resolve!: (v: unknown) => void;
    const save = vi.spyOn(collectionsApi, 'savePlace').mockReturnValue(new Promise((r) => (resolve = r)) as never);
    const status = vi.spyOn(collectionsApi, 'setStatus');
    const { result } = await loaded();

    let first!: Promise<void>;
    act(() => {
      first = result.current.handleToggle(WISHLIST);
    });
    expect(result.current.busyId).toBe(2);
    await act(() => result.current.handleToggle(FAVORITES));
    await act(() => result.current.handleStatus(SAVED_IN_FAVORITES.lists[0], 'visited'));
    expect(save).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();

    resolve({});
    await act(() => first);
    expect(result.current.busyId).toBeNull();
  });

  it('FE-COMP-SAVETOCOLHOOK-009: a status change sets it per list, then refreshes and bumps', async () => {
    const status = vi.spyOn(collectionsApi, 'setStatus').mockResolvedValue({} as never);
    const { result } = await loaded();

    await act(() => result.current.handleStatus(SAVED_IN_FAVORITES.lists[0], 'visited'));

    expect(status).toHaveBeenCalledWith(900, 'visited');
    expect(useSaveToCollectionStore.getState().version).toBe(1);
  });

  it('FE-COMP-SAVETOCOLHOOK-010: a failing status change toasts the error', async () => {
    vi.spyOn(collectionsApi, 'setStatus').mockRejectedValue(new Error('boom'));
    const { result } = await loaded();

    await act(() => result.current.handleStatus(SAVED_IN_FAVORITES.lists[0], 'visited'));

    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
    expect(useSaveToCollectionStore.getState().version).toBe(0);
  });

  it('FE-COMP-SAVETOCOLHOOK-011: visited everywhere marks every unvisited list in one call', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue({
      saved: true,
      lists: [
        { collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true },
        { collection_id: 2, name: 'Wishlist', place_id: 901, status: 'idea', can_edit: true },
      ],
    });
    let resolve!: (v: { updated: number }) => void;
    const many = vi.spyOn(collectionsApi, 'setStatusMany').mockReturnValue(new Promise((r) => (resolve = r)) as never);
    const { result } = await loaded();
    await waitFor(() => expect(result.current.unvisited).toHaveLength(2));

    let run!: Promise<void>;
    act(() => {
      run = result.current.handleVisitedEverywhere();
    });
    expect(result.current.busyId).toBe(VISITED_EVERYWHERE_BUSY);
    resolve({ updated: 2 });
    await act(() => run);

    expect(many).toHaveBeenCalledWith([900, 901], 'visited');
    expect(addToast).toHaveBeenCalledWith('collections.markedVisited:{"count":2}', 'success', undefined);
    expect(useSaveToCollectionStore.getState().version).toBe(1);
  });

  it('FE-COMP-SAVETOCOLHOOK-012: visited everywhere does nothing without an unvisited list, and toasts a failure', async () => {
    const many = vi.spyOn(collectionsApi, 'setStatusMany').mockRejectedValue(new Error('boom'));
    const { result } = await loaded();

    await act(() => result.current.handleVisitedEverywhere());
    expect(many).not.toHaveBeenCalled();

    vi.spyOn(collectionsApi, 'membership').mockResolvedValue(SAVED_IN_FAVORITES);
    openFor({ ...TARGET, name: 'Pantheon' });
    await waitFor(() => expect(result.current.unvisited).toHaveLength(1));
    await act(() => result.current.handleVisitedEverywhere());
    expect(many).toHaveBeenCalledWith([900], 'visited');
    expect(addToast).toHaveBeenCalledWith(expect.any(String), 'error', undefined);
  });

  it('FE-COMP-SAVETOCOLHOOK-013: opening the collections page closes the picker and navigates', async () => {
    const { result } = await loaded();

    act(() => result.current.openCollections());

    expect(useSaveToCollectionStore.getState().target).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/collections');
  });

  it('FE-COMP-SAVETOCOLHOOK-014: a load landing after the target changed is dropped', async () => {
    let resolveFirst!: (v: CollectionListResponse) => void;
    vi.spyOn(collectionsApi, 'list')
      .mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
      .mockResolvedValue(listResponse([WISHLIST]));
    const { result } = renderHook(() => useSaveToCollection());
    openFor();
    openFor({ ...TARGET, name: 'Pantheon' });
    await waitFor(() => expect(result.current.lists.map((l) => l.id)).toEqual([2]));

    resolveFirst(listResponse([FAVORITES, WISHLIST]));
    await act(async () => {});
    expect(result.current.lists.map((l) => l.id)).toEqual([2]);
  });
});
