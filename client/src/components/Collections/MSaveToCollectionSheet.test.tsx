// FE-COMP-MSAVESHEET-001 to FE-COMP-MSAVESHEET-016
import React from 'react';
import { afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render';
import type { Collection, CollectionListResponse, CollectionMembership, CollectionSaveResult } from '@trek/shared';
import { collectionsApi } from '../../api/collections';
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore';
import type { SaveToCollectionTarget } from '../../store/saveToCollectionStore';
import MSaveToCollectionSheet from './MSaveToCollectionSheet';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

function list(over: Partial<Collection>): Collection {
  return { id: 1, owner_id: 7, name: 'List', color: null, place_count: 0, ...over } as Collection;
}

const FAVORITES = list({ id: 1, name: 'Favorites', color: '#ef4444', place_count: 4 });
const WISHLIST = list({ id: 2, name: 'Wishlist' });
const SHARED = list({ id: 3, name: 'Team ideas', is_owner: false });

const listResponse = (collections: Collection[]): CollectionListResponse => ({ collections, incomingInvites: [] });
const EMPTY_MEMBERSHIP: CollectionMembership = { saved: false, lists: [] };

const TARGET: SaveToCollectionTarget = {
  name: 'Colosseum',
  source_trip_id: 5,
  source_place_id: 42,
  lat: 41.89,
  lng: 12.49,
  google_place_id: 'gp-1',
  google_ftid: 'ft-1',
};

let addToast: ReturnType<typeof vi.fn>;

function openFor(target: SaveToCollectionTarget = TARGET) {
  useSaveToCollectionStore.setState({ target, version: 0 });
}

beforeEach(() => {
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
  mockNavigate.mockClear();
  useSaveToCollectionStore.setState({ target: null, version: 0 });
  vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]));
  vi.spyOn(collectionsApi, 'membership').mockResolvedValue(EMPTY_MEMBERSHIP);
});

afterEach(() => {
  vi.restoreAllMocks();
  useSaveToCollectionStore.setState({ target: null, version: 0 });
  delete window.__addToast;
});

describe('MSaveToCollectionSheet', () => {
  it('FE-COMP-MSAVESHEET-001: stays closed and silent while no target is set', () => {
    render(<MSaveToCollectionSheet />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(collectionsApi.list).not.toHaveBeenCalled();
  });

  it('FE-COMP-MSAVESHEET-002: opens a labelled sheet showing the target name and the lists', async () => {
    openFor();
    render(<MSaveToCollectionSheet />);

    expect(await screen.findByText('Favorites')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Save to list' })).toBeInTheDocument();
    expect(screen.getByText('Colosseum')).toBeInTheDocument();
    expect(screen.getByText('4 places')).toBeInTheDocument();
    expect(screen.getByText('0 places')).toBeInTheDocument();
  });

  it('FE-COMP-MSAVESHEET-003: queries membership with the maps identity of the target', async () => {
    openFor();
    render(<MSaveToCollectionSheet />);
    await screen.findByText('Favorites');
    expect(collectionsApi.membership).toHaveBeenCalledWith({
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      name: 'Colosseum',
      lat: 41.89,
      lng: 12.49,
    });
  });

  it('FE-COMP-MSAVESHEET-004: shows the spinner until the lists arrive', async () => {
    let resolve!: (v: CollectionListResponse) => void;
    vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    openFor();
    render(<MSaveToCollectionSheet />);
    expect(document.querySelector('.animate-spin')).not.toBeNull();

    resolve(listResponse([FAVORITES]));
    expect(await screen.findByText('Favorites')).toBeInTheDocument();
  });

  it('FE-COMP-MSAVESHEET-005: a failing list request shows the empty state and its create shortcut', async () => {
    vi.spyOn(collectionsApi, 'list').mockRejectedValue(new Error('offline'));
    openFor();
    render(<MSaveToCollectionSheet />);

    expect(await screen.findByText('Create a list first to save places.')).toBeInTheDocument();
    // With no lists the sheet drops its footer bar entirely.
    expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /New list/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections');
    expect(useSaveToCollectionStore.getState().target).toBeNull();
  });

  it('FE-COMP-MSAVESHEET-006: lists already holding the place are marked saved', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue({
      saved: true,
      lists: [{ collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true }],
    });
    openFor();
    render(<MSaveToCollectionSheet />);

    const favorites = await screen.findByRole('button', { name: /Favorites/ });
    expect(favorites.querySelector('.lucide-bookmark-check')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Wishlist/ }).querySelector('.lucide-bookmark-check')).toBeNull();
  });

  it('FE-COMP-MSAVESHEET-007: a failing membership lookup degrades to "saved nowhere"', async () => {
    vi.spyOn(collectionsApi, 'membership').mockRejectedValue(new Error('offline'));
    openFor();
    render(<MSaveToCollectionSheet />);

    const favorites = await screen.findByRole('button', { name: /Favorites/ });
    expect(favorites.querySelector('.lucide-bookmark-check')).toBeNull();
  });

  it('FE-COMP-MSAVESHEET-008: a shared list carries the SHARED badge', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, SHARED]));
    openFor();
    render(<MSaveToCollectionSheet />);

    const shared = await screen.findByRole('button', { name: /Team ideas/ });
    expect(within(shared).getByText('Shared')).toBeInTheDocument();
  });

  it('FE-COMP-MSAVESHEET-009: tapping an unsaved list saves the target and bumps the version', async () => {
    const save = vi.spyOn(collectionsApi, 'savePlace').mockResolvedValue({});
    openFor();
    render(<MSaveToCollectionSheet />);

    fireEvent.click(await screen.findByRole('button', { name: /Wishlist/ }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Added to Wishlist', 'success', undefined));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      collection_id: 2,
      source_trip_id: 5,
      source_place_id: 42,
      name: 'Colosseum',
      lat: 41.89,
      lng: 12.49,
      address: null,
      force: true,
    }));
    expect(useSaveToCollectionStore.getState().version).toBe(1);
  });

  it('FE-COMP-MSAVESHEET-010: tapping a saved list removes that place instead', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue({
      saved: true,
      lists: [{ collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true }],
    });
    const del = vi.spyOn(collectionsApi, 'deletePlace').mockResolvedValue({});
    openFor();
    render(<MSaveToCollectionSheet />);

    fireEvent.click(await screen.findByRole('button', { name: /Favorites/ }));

    await waitFor(() => expect(del).toHaveBeenCalledWith(900));
    expect(addToast).toHaveBeenCalledWith('Removed from Favorites', 'success', undefined);
  });

  it('FE-COMP-MSAVESHEET-011: a failing save surfaces the server message and leaves the version alone', async () => {
    vi.spyOn(collectionsApi, 'savePlace').mockRejectedValue({ response: { data: { error: 'List is full' } } });
    openFor();
    render(<MSaveToCollectionSheet />);

    fireEvent.click(await screen.findByRole('button', { name: /Wishlist/ }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('List is full', 'error', undefined));
    expect(useSaveToCollectionStore.getState().version).toBe(0);
  });

  it('FE-COMP-MSAVESHEET-012: every row locks while one save runs, so a second tap is dropped', async () => {
    let resolve!: (v: CollectionSaveResult) => void;
    const save = vi.spyOn(collectionsApi, 'savePlace').mockReturnValue(new Promise(r => { resolve = r; }));
    openFor();
    render(<MSaveToCollectionSheet />);

    const wishlist = await screen.findByRole('button', { name: /Wishlist/ });
    fireEvent.click(wishlist);
    const favorites = screen.getByRole('button', { name: /Favorites/ });
    expect(wishlist).toBeDisabled();
    expect(favorites).toBeDisabled();
    fireEvent.click(favorites);
    expect(save).toHaveBeenCalledTimes(1);

    resolve({});
    await waitFor(() => expect(useSaveToCollectionStore.getState().version).toBe(1));
  });

  it('FE-COMP-MSAVESHEET-015: a membership refresh that fails after a save falls back to "saved nowhere"', async () => {
    vi.spyOn(collectionsApi, 'membership')
      .mockResolvedValueOnce(EMPTY_MEMBERSHIP)
      .mockRejectedValue(new Error('offline'));
    vi.spyOn(collectionsApi, 'savePlace').mockResolvedValue({});
    openFor();
    render(<MSaveToCollectionSheet />);

    fireEvent.click(await screen.findByRole('button', { name: /Wishlist/ }));

    await waitFor(() => expect(useSaveToCollectionStore.getState().version).toBe(1));
    expect(screen.getByRole('button', { name: /Wishlist/ }).querySelector('.lucide-bookmark-check')).toBeNull();
  });

  it('FE-COMP-MSAVESHEET-016: a response landing after the sheet closed is dropped', async () => {
    let resolve!: (v: CollectionListResponse) => void;
    vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    openFor();
    const { unmount } = render(<MSaveToCollectionSheet />);
    unmount();

    resolve(listResponse([FAVORITES]));
    await Promise.resolve();
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
  });

  it('FE-COMP-MSAVESHEET-013: the footer View navigates to the collections page', async () => {
    openFor();
    render(<MSaveToCollectionSheet />);
    await screen.findByText('Favorites');

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections');
    expect(useSaveToCollectionStore.getState().target).toBeNull();
  });

  it('FE-COMP-MSAVESHEET-014: both the header X and the footer Close dismiss without navigating', async () => {
    openFor();
    const { unmount } = render(<MSaveToCollectionSheet />);
    await screen.findByText('Favorites');

    // Header icon button first in the DOM, footer button last.
    const closes = screen.getAllByRole('button', { name: 'Close' });
    expect(closes).toHaveLength(2);
    fireEvent.click(closes[closes.length - 1]);
    expect(useSaveToCollectionStore.getState().target).toBeNull();
    unmount();

    openFor();
    render(<MSaveToCollectionSheet />);
    await screen.findByText('Favorites');
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(useSaveToCollectionStore.getState().target).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
