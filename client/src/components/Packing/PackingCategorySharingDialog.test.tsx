// FE-PACK-CATSHAREDLG-001 to FE-PACK-CATSHAREDLG-004: the desktop dialog for sharing a whole packing list (#2961).
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import PackingCategorySharingDialog from './PackingCategorySharingDialog';
import type { PackingCategorySharing } from './usePackingCategorySharing';
import type { TripMember } from './usePackingListPanel';

const ME = 1;
const MEMBERS: TripMember[] = [
  { id: ME, username: 'me' },
  { id: 2, username: 'alice' },
];

function sharing(overrides: Partial<PackingCategorySharing> = {}): PackingCategorySharing {
  return {
    category: 'Camp',
    visibility: null,
    setVisibility: vi.fn(),
    recipientIds: [],
    toggleRecipient: vi.fn(),
    ownCount: 2,
    othersCount: 0,
    busy: false,
    ready: false,
    openFor: vi.fn(),
    close: vi.fn(),
    apply: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

function setup(state: PackingCategorySharing) {
  render(<PackingCategorySharingDialog sharing={state} tripMembers={MEMBERS} currentUserId={ME} />);
  return state;
}

describe('PackingCategorySharingDialog', () => {
  it('FE-PACK-CATSHAREDLG-001: renders nothing until a list is chosen', () => {
    setup(sharing({ category: null }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('FE-PACK-CATSHAREDLG-002: names the list, offers the three tiers and marks the chosen one', () => {
    const state = setup(sharing({ visibility: 'common' }));
    expect(screen.getByText('Camp')).toBeInTheDocument();
    expect(screen.getByText('Sharing for Whole List')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /In the group pool/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Private/ }));
    expect(state.setVisibility).toHaveBeenCalledWith('personal');
    // Apply waits until the choice is complete.
    expect(screen.getByRole('button', { name: 'Apply to list' })).toBeDisabled();
  });

  it('FE-PACK-CATSHAREDLG-003: the third tier lists the other members to pick, and applies once ready', () => {
    const state = setup(sharing({ visibility: 'shared', recipientIds: [2], ready: true, othersCount: 1 }));
    expect(screen.queryByRole('button', { name: 'me' })).toBeNull();
    const alice = screen.getByRole('button', { name: 'alice' });
    expect(alice).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(alice);
    expect(state.toggleRecipient).toHaveBeenCalledWith(2);
    expect(
      screen.getByText('Items other people added stay as they are. Only they can change them.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply to list' }));
    expect(state.apply).toHaveBeenCalledOnce();
  });

  it('FE-PACK-CATSHAREDLG-004: a list of nobody but others explains why and leaves the tiers shut', () => {
    setup(sharing({ ownCount: 0, othersCount: 2 }));
    expect(
      screen.getByText('Every item in this list was added by someone else, so only they can change its sharing.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /In the group pool/ })).toBeDisabled();
  });
});
