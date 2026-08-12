// FE-COMP-SAVETOCOL-001 to FE-COMP-SAVETOCOL-020
import React from 'react';
import { afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render';
import type { Collection, CollectionListResponse, CollectionMembership, CollectionSaveResult } from '@trek/shared';
import { collectionsApi } from '../../api/collections';
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore';
import type { SaveToCollectionTarget } from '../../store/saveToCollectionStore';
import SaveToCollectionModal from './SaveToCollectionModal';

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
  description: 'Ancient arena',
  lat: 41.89,
  lng: 12.49,
  address: 'Rome',
  category_id: 3,
  price: 16,
  currency: 'EUR',
  notes: 'Book ahead',
  image_url: '/uploads/places/colosseum.jpg',
  google_place_id: 'gp-1',
  google_ftid: 'ft-1',
  osm_id: 'osm-1',
  website: 'https://colosseo.example',
  phone: '+39',
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

describe('SaveToCollectionModal', () => {
  it('FE-COMP-SAVETOCOL-001: renders nothing and calls no api while no target is set', () => {
    render(<SaveToCollectionModal />);
    expect(screen.queryByRole('heading', { name: 'Save to list' })).not.toBeInTheDocument();
    expect(collectionsApi.list).not.toHaveBeenCalled();
  });

  it('FE-COMP-SAVETOCOL-002: shows the target name plus every list once loaded', async () => {
    openFor();
    render(<SaveToCollectionModal />);
    expect(await screen.findByText('Favorites')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Save to list' })).toBeInTheDocument();
    expect(screen.getByText('Colosseum')).toBeInTheDocument();
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
  });

  it('FE-COMP-SAVETOCOL-003: queries membership with the maps identity of the target', async () => {
    openFor();
    render(<SaveToCollectionModal />);
    await screen.findByText('Favorites');
    expect(collectionsApi.membership).toHaveBeenCalledWith({
      google_place_id: 'gp-1',
      google_ftid: 'ft-1',
      name: 'Colosseum',
      lat: 41.89,
      lng: 12.49,
    });
  });

  it('FE-COMP-SAVETOCOL-004: shows the spinner until the lists arrive', async () => {
    let resolve!: (v: CollectionListResponse) => void;
    vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    openFor();
    render(<SaveToCollectionModal />);
    expect(document.querySelector('.animate-spin')).not.toBeNull();

    resolve(listResponse([FAVORITES]));
    expect(await screen.findByText('Favorites')).toBeInTheDocument();
  });

  it('FE-COMP-SAVETOCOL-005: a failing list request falls back to the empty state with a create shortcut', async () => {
    vi.spyOn(collectionsApi, 'list').mockRejectedValue(new Error('offline'));
    openFor();
    render(<SaveToCollectionModal />);

    expect(await screen.findByText('Create a list first to save places.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /New list/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections');
    expect(useSaveToCollectionStore.getState().target).toBeNull();
  });

  it('FE-COMP-SAVETOCOL-006: lists already holding the place are marked saved', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue({
      saved: true,
      lists: [{ collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true }],
    });
    openFor();
    render(<SaveToCollectionModal />);

    const favorites = await screen.findByRole('button', { name: /Favorites/ });
    expect(favorites).toHaveClass('border-accent');
    expect(favorites.querySelector('.lucide-bookmark-check')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Wishlist/ })).not.toHaveClass('border-accent');
  });

  it('FE-COMP-SAVETOCOL-007: a failing membership lookup degrades to "saved nowhere"', async () => {
    vi.spyOn(collectionsApi, 'membership').mockRejectedValue(new Error('offline'));
    openFor();
    render(<SaveToCollectionModal />);

    const favorites = await screen.findByRole('button', { name: /Favorites/ });
    expect(favorites).not.toHaveClass('border-accent');
  });

  it('FE-COMP-SAVETOCOL-008: a shared list carries the SHARED badge', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, SHARED]));
    openFor();
    render(<SaveToCollectionModal />);

    const shared = await screen.findByRole('button', { name: /Team ideas/ });
    expect(within(shared).getByText('Shared')).toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: /Favorites/ })).queryByText('Shared')).not.toBeInTheDocument();
  });

  it('FE-COMP-SAVETOCOL-009: picking an unsaved list forwards the whole target payload and bumps the version', async () => {
    const save = vi.spyOn(collectionsApi, 'savePlace').mockResolvedValue({});
    openFor();
    render(<SaveToCollectionModal />);

    fireEvent.click(await screen.findByRole('button', { name: /Wishlist/ }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Added to Wishlist', 'success', undefined));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      collection_id: 2,
      source_trip_id: 5,
      source_place_id: 42,
      name: 'Colosseum',
      lat: 41.89,
      lng: 12.49,
      google_place_id: 'gp-1',
      osm_id: 'osm-1',
      website: 'https://colosseo.example',
      force: true,
    }));
    expect(useSaveToCollectionStore.getState().version).toBe(1);
  });

  it('FE-COMP-SAVETOCOL-010: a sparse target sends explicit nulls rather than undefined', async () => {
    const save = vi.spyOn(collectionsApi, 'savePlace').mockResolvedValue({});
    openFor({ name: 'Nameless bar' });
    render(<SaveToCollectionModal />);

    fireEvent.click(await screen.findByRole('button', { name: /Wishlist/ }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      collection_id: 2,
      name: 'Nameless bar',
      lat: null,
      lng: null,
      source_trip_id: null,
      phone: null,
    }));
  });

  it('FE-COMP-SAVETOCOL-011: picking a saved list removes that place instead', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue({
      saved: true,
      lists: [{ collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true }],
    });
    const del = vi.spyOn(collectionsApi, 'deletePlace').mockResolvedValue({});
    const save = vi.spyOn(collectionsApi, 'savePlace');
    openFor();
    render(<SaveToCollectionModal />);

    fireEvent.click(await screen.findByRole('button', { name: /Favorites/ }));

    await waitFor(() => expect(del).toHaveBeenCalledWith(900));
    expect(save).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith('Removed from Favorites', 'success', undefined);
  });

  it('FE-COMP-SAVETOCOL-012: a failing save surfaces the server message and leaves the version alone', async () => {
    vi.spyOn(collectionsApi, 'savePlace').mockRejectedValue({ response: { data: { error: 'List is full' } } });
    openFor();
    render(<SaveToCollectionModal />);

    fireEvent.click(await screen.findByRole('button', { name: /Wishlist/ }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('List is full', 'error', undefined));
    expect(useSaveToCollectionStore.getState().version).toBe(0);
  });

  it('FE-COMP-SAVETOCOL-013: every row locks while a save runs', async () => {
    let resolve!: (v: CollectionSaveResult) => void;
    const save = vi.spyOn(collectionsApi, 'savePlace').mockReturnValue(new Promise(r => { resolve = r; }));
    openFor();
    render(<SaveToCollectionModal />);

    const wishlist = await screen.findByRole('button', { name: /Wishlist/ });
    fireEvent.click(wishlist);
    expect(wishlist).toBeDisabled();
    const favorites = screen.getByRole('button', { name: /Favorites/ });
    expect(favorites).toBeDisabled();
    fireEvent.click(favorites);
    expect(save).toHaveBeenCalledTimes(1);

    resolve({});
    await waitFor(() => expect(useSaveToCollectionStore.getState().version).toBe(1));
  });

  it('FE-COMP-SAVETOCOL-015: a membership refresh that fails after a save falls back to "saved nowhere"', async () => {
    vi.spyOn(collectionsApi, 'membership')
      .mockResolvedValueOnce(EMPTY_MEMBERSHIP)
      .mockRejectedValue(new Error('offline'));
    vi.spyOn(collectionsApi, 'savePlace').mockResolvedValue({});
    openFor();
    render(<SaveToCollectionModal />);

    fireEvent.click(await screen.findByRole('button', { name: /Wishlist/ }));

    await waitFor(() => expect(useSaveToCollectionStore.getState().version).toBe(1));
    expect(screen.getByRole('button', { name: /Wishlist/ })).not.toHaveClass('border-accent');
  });

  it('FE-COMP-SAVETOCOL-016: a response landing after the picker closed is dropped', async () => {
    let resolve!: (v: CollectionListResponse) => void;
    vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    openFor();
    const { unmount } = render(<SaveToCollectionModal />);
    unmount();

    resolve(listResponse([FAVORITES]));
    await Promise.resolve();
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
  });

  // ── Per-list status + "visited everywhere" (#1469) ────────────────────────

  const savedIn = (over: Partial<CollectionMembership['lists'][number]> = {}): CollectionMembership => ({
    saved: true,
    lists: [{ collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true, ...over }],
  });

  it('FE-COMP-SAVETOCOL-017: a saved list shows its own status and one tap cycles it', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue(savedIn());
    const setStatus = vi.spyOn(collectionsApi, 'setStatus').mockResolvedValue({} as never);
    const del = vi.spyOn(collectionsApi, 'deletePlace').mockResolvedValue({});
    openFor();
    render(<SaveToCollectionModal />);

    const badge = await screen.findByRole('button', { name: 'Want to go' });
    fireEvent.click(badge);

    // want → visited, and the row toggle must NOT have fired underneath it.
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith(900, 'visited'));
    expect(del).not.toHaveBeenCalled();
  });

  it('FE-COMP-SAVETOCOL-018: the header action marks every list holding the place visited', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue({
      saved: true,
      lists: [
        { collection_id: 1, name: 'Favorites', place_id: 900, status: 'want', can_edit: true },
        { collection_id: 2, name: 'Wishlist', place_id: 901, status: 'idea', can_edit: true },
      ],
    });
    const many = vi.spyOn(collectionsApi, 'setStatusMany').mockResolvedValue({ updated: 2 });
    openFor();
    render(<SaveToCollectionModal />);

    fireEvent.click(await screen.findByRole('button', { name: 'Visited everywhere' }));
    await waitFor(() => expect(many).toHaveBeenCalledWith([900, 901], 'visited'));
  });

  it('FE-COMP-SAVETOCOL-019: the action disappears once every list is visited', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue(savedIn({ status: 'visited' }));
    openFor();
    render(<SaveToCollectionModal />);

    await screen.findByText('Favorites');
    expect(screen.queryByRole('button', { name: /Visited everywhere|Mark visited/ })).not.toBeInTheDocument();
  });

  it('FE-COMP-SAVETOCOL-020: a read-only list shows its status but does not offer to change it', async () => {
    vi.spyOn(collectionsApi, 'membership').mockResolvedValue(savedIn({ can_edit: false }));
    openFor();
    render(<SaveToCollectionModal />);

    await screen.findByText('Favorites');
    expect(screen.queryByRole('button', { name: 'Want to go' })).not.toBeInTheDocument();
    expect(screen.getByTitle('Want to go')).toBeInTheDocument();
    // Nothing to offer: the only list holding it is one the viewer cannot edit.
    expect(screen.queryByRole('button', { name: /Visited everywhere|Mark visited/ })).not.toBeInTheDocument();
  });

  it('FE-COMP-SAVETOCOL-014: the footer navigates to the collections page or just closes', async () => {
    openFor();
    const { unmount } = render(<SaveToCollectionModal />);
    await screen.findByText('Favorites');

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(mockNavigate).toHaveBeenCalledWith('/collections');
    expect(useSaveToCollectionStore.getState().target).toBeNull();
    unmount();

    mockNavigate.mockClear();
    openFor();
    render(<SaveToCollectionModal />);
    await screen.findByText('Favorites');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(useSaveToCollectionStore.getState().target).toBeNull();
  });
});
