// FE-PACK-CATSHARE-001 to FE-PACK-CATSHARE-006: moving a whole packing list to one sharing tier (#2961).
import { act, renderHook } from '@testing-library/react';
import { type Mock, describe, expect, it, vi } from 'vitest';

import { buildPackingItem } from '../../../tests/helpers/factories';
import type { TripStoreState } from '../../store/tripStore';
import type { PackingItem } from '../../types';
import { usePackingCategorySharing } from './usePackingCategorySharing';

type Share = TripStoreState['setPackingItemSharing'];

const ME = 1;
const recipients = (...ids: number[]) => ids.map((user_id) => ({ user_id, username: `u${user_id}` }));

const tent = buildPackingItem({ id: 1, name: 'Tent', category: 'Camp', owner_id: ME });
const stove = buildPackingItem({ id: 2, name: 'Stove', category: 'Camp', owner_id: null, checked: 1 });
const theirs = buildPackingItem({ id: 3, name: 'Lamp', category: 'Camp', owner_id: 2 });
const socks = buildPackingItem({ id: 4, name: 'Socks', category: 'Clothes', owner_id: ME });
const diary = buildPackingItem({ id: 5, name: 'Diary', category: 'Camp', owner_id: ME, is_private: 1 });

function setup(items: PackingItem[], setPackingItemSharing: Mock<Share> = vi.fn<Share>(() => Promise.resolve())) {
  const toast = { success: vi.fn() };
  const t = vi.fn((key: string) => key);
  const hook = renderHook(() =>
    usePackingCategorySharing({
      tripId: 7,
      items,
      view: 'common',
      defaultCategory: 'Other',
      currentUserId: ME,
      setPackingItemSharing,
      t,
      toast,
    })
  );
  return { ...hook, setPackingItemSharing, toast, t };
}

describe('usePackingCategorySharing', () => {
  it('FE-PACK-CATSHARE-001: opens on the list of the open view, ticked items included, and counts the items of others', () => {
    const { result } = setup([tent, stove, theirs, socks, diary]);
    expect(result.current.category).toBeNull();

    act(() => result.current.openFor('Camp'));
    expect(result.current.category).toBe('Camp');
    // The personal Diary is in the other view, Socks in another list.
    expect(result.current.ownCount).toBe(2);
    expect(result.current.othersCount).toBe(1);
    // Tent and Stove both sit on the common list, so that tier is preselected.
    expect(result.current.visibility).toBe('common');
    expect(result.current.ready).toBe(true);
  });

  it('FE-PACK-CATSHARE-002: moving to my list writes each own item once, in order, and reports the items left alone', async () => {
    const { result, setPackingItemSharing, toast, t } = setup([tent, stove, theirs]);
    act(() => result.current.openFor('Camp'));
    act(() => result.current.setVisibility('personal'));

    await act(() => result.current.apply());

    expect(setPackingItemSharing.mock.calls).toEqual([
      [7, 1, 'personal', []],
      [7, 2, 'personal', []],
    ]);
    expect(t).toHaveBeenCalledWith('packing.shareCat.doneOthersKept', { name: 'Camp' });
    expect(toast.success).toHaveBeenCalledWith('packing.shareCat.doneOthersKept');
    expect(result.current.category).toBeNull();
  });

  it('FE-PACK-CATSHARE-003: sharing with people needs at least one of them, and sends who was picked', async () => {
    const { result, setPackingItemSharing, toast } = setup([tent]);
    act(() => result.current.openFor('Camp'));
    act(() => result.current.setVisibility('shared'));
    expect(result.current.ready).toBe(false);

    act(() => result.current.toggleRecipient(3));
    act(() => result.current.toggleRecipient(2));
    act(() => result.current.toggleRecipient(3));
    expect(result.current.recipientIds).toEqual([2]);
    expect(result.current.ready).toBe(true);

    await act(() => result.current.apply());
    expect(setPackingItemSharing).toHaveBeenCalledWith(7, 1, 'shared', [2]);
    expect(toast.success).toHaveBeenCalledWith('packing.shareCat.done');
  });

  it('FE-PACK-CATSHARE-004: items already at the tier are not written again, and a list that agrees on people starts there', async () => {
    const kettle = buildPackingItem({
      id: 6,
      category: 'Food',
      owner_id: ME,
      is_private: 1,
      recipients: recipients(3, 2),
    });
    const pans = buildPackingItem({
      id: 7,
      category: 'Food',
      owner_id: ME,
      is_private: 1,
      recipients: recipients(2, 3),
    });
    const { result, setPackingItemSharing, toast } = setup([kettle, pans]);
    act(() => result.current.openFor('Food'));
    expect(result.current.visibility).toBe('shared');
    expect(result.current.recipientIds).toEqual([2, 3]);

    await act(() => result.current.apply());
    expect(setPackingItemSharing).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.category).toBeNull();
  });

  it('FE-PACK-CATSHARE-005: a failed write stops the run and keeps the choice open, without a second message', async () => {
    const failing = vi.fn<Share>(() => Promise.reject(new Error('offline')));
    const { result, toast } = setup([tent, stove], failing);
    act(() => result.current.openFor('Camp'));
    act(() => result.current.setVisibility('personal'));

    await act(() => result.current.apply());

    expect(failing).toHaveBeenCalledOnce();
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.category).toBe('Camp');
    expect(result.current.busy).toBe(false);
  });

  it('FE-PACK-CATSHARE-006: a list of nobody but others cannot be applied, and closing clears the choice', async () => {
    const { result, setPackingItemSharing } = setup([theirs]);
    act(() => result.current.openFor('Camp'));
    act(() => result.current.setVisibility('personal'));
    expect(result.current.ownCount).toBe(0);
    expect(result.current.ready).toBe(false);

    await act(() => result.current.apply());
    expect(setPackingItemSharing).not.toHaveBeenCalled();

    act(() => result.current.close());
    expect(result.current.category).toBeNull();
  });
});
