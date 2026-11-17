// FE-MOB-PACKCATSHARE-001 to FE-MOB-PACKCATSHARE-004: the phone's sheet for sharing a whole packing list (#2961).
import { describe, expect, it, vi } from 'vitest';

import type { PackingCategorySharing } from '../../../../src/components/Packing/usePackingCategorySharing';
import MPackingCategorySharingSheet from '../../../../src/mobile/screens/trip/tabs/MPackingCategorySharingSheet';
import type { TripMember } from '../../../../src/types';
import { fireEvent, render, screen } from '../../../helpers/render';

const ME = 7;
const MEMBERS = [
  { id: ME, username: 'me' },
  { id: 11, username: 'anna' },
] as unknown as TripMember[];
const t = (key: string) => key;

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
  render(<MPackingCategorySharingSheet sharing={state} tripMembers={MEMBERS} currentUserId={ME} t={t} />);
  return state;
}

describe('MPackingCategorySharingSheet', () => {
  it('FE-MOB-PACKCATSHARE-001: stays shut without a list, and names the list it was opened for', () => {
    const { unmount } = render(
      <MPackingCategorySharingSheet
        sharing={sharing({ category: null })}
        tripMembers={MEMBERS}
        currentUserId={ME}
        t={t}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();

    setup(sharing());
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'packing.menuShareCat');
    expect(screen.getByText('Camp')).toBeInTheDocument();
    expect(screen.getByText('packing.shareCat.hint')).toBeInTheDocument();
  });

  it('FE-MOB-PACKCATSHARE-002: a tier is picked on its row, and the people show under the third, never me', () => {
    const state = setup(sharing({ visibility: 'shared', recipientIds: [] }));
    fireEvent.click(screen.getByRole('button', { name: /packing.tierPersonal/ }));
    expect(state.setVisibility).toHaveBeenCalledWith('personal');

    expect(screen.queryByRole('button', { name: 'me' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'anna' }));
    expect(state.toggleRecipient).toHaveBeenCalledWith(11);
    expect(screen.getByText('packing.shareCat.pickPeople')).toBeInTheDocument();
  });

  it('FE-MOB-PACKCATSHARE-003: applies once ready, and says that the items of others stay as they are', () => {
    const state = setup(sharing({ visibility: 'personal', ready: true, othersCount: 2 }));
    expect(screen.getByText('packing.shareCat.othersKept')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'packing.shareCat.apply' }));
    expect(state.apply).toHaveBeenCalledOnce();
  });

  it('FE-MOB-PACKCATSHARE-004: a list with none of my items explains why and offers no tier', () => {
    setup(sharing({ ownCount: 0, othersCount: 3 }));
    expect(screen.getByText('packing.shareCat.noneOwn')).toBeInTheDocument();
    expect(screen.queryByText('packing.shareCat.othersKept')).toBeNull();
    expect(screen.getByRole('button', { name: /packing.viewCommon/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'packing.shareCat.apply' })).toBeDisabled();
  });
});
