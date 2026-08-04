// FE-COMP-SAVETRIPPL-001 to FE-COMP-SAVETRIPPL-015
import React from 'react';
import { afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import type { Collection, CollectionListResponse } from '@trek/shared';
import { collectionsApi } from '../../api/collections';
import SaveTripPlacesToListModal from './SaveTripPlacesToListModal';

type ModalProps = React.ComponentProps<typeof SaveTripPlacesToListModal>;
type SaveManyResult = { copied: number; skipped: { id: number; name: string }[] };

function list(over: Partial<Collection>): Collection {
  return { id: 1, owner_id: 7, name: 'List', color: null, place_count: 0, ...over } as Collection;
}

const FAVORITES = list({ id: 1, name: 'Favorites', color: '#ef4444', place_count: 4 });
const WISHLIST = list({ id: 2, name: 'Wishlist' });

const listResponse = (collections: Collection[]): CollectionListResponse => ({ collections, incomingInvites: [] });

let addToast: ReturnType<typeof vi.fn>;

function renderModal(overrides: Partial<ModalProps> = {}) {
  const props: ModalProps = {
    isOpen: true,
    tripId: 5,
    placeIds: [11, 12],
    onClose: vi.fn(),
    onDone: vi.fn(),
    ...overrides,
  };
  render(<SaveTripPlacesToListModal {...props} />);
  return props;
}

beforeEach(() => {
  addToast = vi.fn();
  window.__addToast = addToast as unknown as typeof window.__addToast;
  vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES, WISHLIST]));
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.__addToast;
});

describe('SaveTripPlacesToListModal', () => {
  it('FE-COMP-SAVETRIPPL-001: titles the modal with the selection count and lists the writable lists', async () => {
    renderModal({ placeIds: [11, 12, 13] });
    expect(await screen.findByText('Favorites')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Save 3 to a list' })).toBeInTheDocument();
    expect(screen.getByText('4 places')).toBeInTheDocument();
    expect(screen.getByText('0 places')).toBeInTheDocument();
    expect(screen.getByText('Duplicates are skipped automatically')).toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-002: lists shared with the user are dropped — they cannot be written to', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(
      listResponse([FAVORITES, list({ id: 3, name: 'Team ideas', is_owner: false })]),
    );
    renderModal();
    expect(await screen.findByText('Favorites')).toBeInTheDocument();
    expect(screen.queryByText('Team ideas')).not.toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-003: shows the spinner until the lists arrive', async () => {
    let resolve!: (v: CollectionListResponse) => void;
    vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    renderModal();
    expect(document.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('You have no lists yet')).not.toBeInTheDocument();

    resolve(listResponse([FAVORITES]));
    expect(await screen.findByText('Favorites')).toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-004: an absent or failing collections response falls back to the empty copy', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue({ incomingInvites: [] } as unknown as CollectionListResponse);
    const { unmount } = render(<SaveTripPlacesToListModal isOpen tripId={5} placeIds={[11]} onClose={vi.fn()} onDone={vi.fn()} />);
    expect(await screen.findByText('You have no lists yet')).toBeInTheDocument();
    unmount();

    vi.spyOn(collectionsApi, 'list').mockRejectedValue(new Error('offline'));
    renderModal();
    expect(await screen.findByText('You have no lists yet')).toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-005: requests nothing and renders nothing while closed', () => {
    const spy = vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse([FAVORITES]));
    renderModal({ isOpen: false });
    expect(spy).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /Save/ })).not.toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-006: the search box appears above five lists and filters by name', async () => {
    const many = [1, 2, 3, 4, 5, 6].map(id => list({ id, name: `List ${id}` }));
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(listResponse(many));
    renderModal();

    const search = await screen.findByPlaceholderText('Search lists');
    fireEvent.change(search, { target: { value: 'list 4' } });
    expect(screen.getByText('List 4')).toBeInTheDocument();
    expect(screen.queryByText('List 5')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'nope' } });
    expect(screen.getByText('You have no lists yet')).toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-007: five lists or fewer need no search box', async () => {
    renderModal();
    await screen.findByText('Favorites');
    expect(screen.queryByPlaceholderText('Search lists')).not.toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-008: picking a list copies every selected place, reports it and closes', async () => {
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany').mockResolvedValue({ copied: 2, skipped: [] });
    const props = renderModal();

    fireEvent.click(await screen.findByText('Favorites'));

    await waitFor(() => expect(props.onDone).toHaveBeenCalled());
    expect(save).toHaveBeenCalledWith(1, 5, [11, 12]);
    expect(addToast).toHaveBeenCalledWith('Saved 2 to Favorites', 'success', undefined);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('FE-COMP-SAVETRIPPL-009: server-side duplicates are reported separately', async () => {
    vi.spyOn(collectionsApi, 'saveFromTripMany').mockResolvedValue({ copied: 1, skipped: [{ id: 12, name: 'Louvre' }] });
    renderModal();

    fireEvent.click(await screen.findByText('Favorites'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Skipped 1 duplicates', 'info', undefined));
    expect(addToast).toHaveBeenCalledWith('Saved 1 to Favorites', 'success', undefined);
  });

  it('FE-COMP-SAVETRIPPL-010: a no-op save says so instead of staying silent', async () => {
    vi.spyOn(collectionsApi, 'saveFromTripMany').mockResolvedValue({ copied: 0, skipped: [] });
    renderModal();

    fireEvent.click(await screen.findByText('Favorites'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Nothing to copy', 'info', undefined));
    expect(addToast).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-SAVETRIPPL-011: a failed save surfaces the server message and keeps the modal open', async () => {
    vi.spyOn(collectionsApi, 'saveFromTripMany').mockRejectedValue({ response: { data: { error: 'List is full' } } });
    const props = renderModal();

    fireEvent.click(await screen.findByText('Favorites'));
    await waitFor(() => expect(addToast).toHaveBeenCalledWith('List is full', 'error', undefined));
    expect(props.onDone).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('FE-COMP-SAVETRIPPL-012: every row locks while a save runs, and an empty selection never reaches the server', async () => {
    let resolve!: (v: SaveManyResult) => void;
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany').mockReturnValue(new Promise(r => { resolve = r; }));
    const props = renderModal();

    const favorites = await screen.findByRole('button', { name: /Favorites/ });
    fireEvent.click(favorites);
    const wishlist = screen.getByRole('button', { name: /Wishlist/ });
    expect(wishlist).toBeDisabled();
    expect(within(favorites).queryByText('4 places')).toBeInTheDocument();
    fireEvent.click(wishlist);
    expect(save).toHaveBeenCalledTimes(1);

    resolve({ copied: 1, skipped: [] });
    await waitFor(() => expect(props.onDone).toHaveBeenCalled());
  });

  it('FE-COMP-SAVETRIPPL-014: a list response landing after the modal closed is dropped', async () => {
    const closed = <SaveTripPlacesToListModal isOpen tripId={5} placeIds={[11]} onClose={vi.fn()} onDone={vi.fn()} />;

    let resolve!: (v: CollectionListResponse) => void;
    const spy = vi.spyOn(collectionsApi, 'list').mockReturnValue(new Promise(r => { resolve = r; }));
    render(closed).unmount();
    resolve(listResponse([FAVORITES]));
    await Promise.resolve();
    expect(screen.queryByText('Favorites')).not.toBeInTheDocument();

    let reject!: (e: Error) => void;
    spy.mockReturnValue(new Promise((_, r) => { reject = r; }));
    render(closed).unmount();
    reject(new Error('offline'));
    await Promise.resolve();
    expect(screen.queryByText('You have no lists yet')).not.toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-015: a list the server sent without a count still renders a countable row', async () => {
    vi.spyOn(collectionsApi, 'list').mockResolvedValue(
      listResponse([{ id: 9, owner_id: 7, name: 'Untracked' } as Collection]),
    );
    renderModal();

    const untracked = await screen.findByRole('button', { name: /Untracked/ });
    expect(within(untracked).getByText('0 places')).toBeInTheDocument();
  });

  it('FE-COMP-SAVETRIPPL-013: an empty selection is a no-op, and Escape hands back to the caller', async () => {
    const user = userEvent.setup();
    const save = vi.spyOn(collectionsApi, 'saveFromTripMany');
    const props = renderModal({ placeIds: [] });

    fireEvent.click(await screen.findByText('Favorites'));
    expect(save).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
